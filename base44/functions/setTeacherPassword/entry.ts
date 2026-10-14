import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { getSettings, hashPassword, verifyPassword, freshToken } from "../../shared/teacherAuth.ts";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    if (user.role !== "admin") {
      return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const newPwd = body && body.new_password ? String(body.new_password) : "";
    const curPwd = body && body.current_password ? String(body.current_password) : "";
    if (!newPwd || newPwd.length < 8) {
      return Response.json({ ok: false, error: "weak" }, { status: 400 });
    }

    const settings = await getSettings(base44);
    // If a password already exists, verify the current one before replacing it.
    if (settings && settings.password_hash) {
      if (!curPwd) return Response.json({ ok: false, error: "current_required" }, { status: 400 });
      const okCurrent = await verifyPassword(curPwd, settings.password_hash, settings.password_salt);
      if (!okCurrent) return Response.json({ ok: false, error: "current_invalid" }, { status: 403 });
    }

    const { hash, salt } = await hashPassword(newPwd);
    const newSecret = freshToken();
    const newVersion = (settings ? settings.session_version || 0 : 0) + 1;

    if (settings) {
      await base44.asServiceRole.entities.TeacherAreaSettings.update(settings.id, {
        password_hash: hash,
        password_salt: salt,
        session_secret: newSecret,
        session_version: newVersion,
        attempt_log: {}, // reset failed-attempt counters on password change
      });
    } else {
      await base44.asServiceRole.entities.TeacherAreaSettings.create({
        key: "main",
        password_hash: hash,
        password_salt: salt,
        session_secret: newSecret,
        session_version: newVersion,
        attempt_log: {},
      });
    }

    // New secret + bumped version invalidate every previously issued session.
    return Response.json({ ok: true, version: newVersion });
  } catch (error) {
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }
}