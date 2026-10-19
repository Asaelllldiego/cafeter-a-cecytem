import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { getSettings, hashPassword, freshToken } from "../../shared/teacherAuth.ts";

// Admin-only recovery reset for the Teachers Area shared password. Needed
// because setTeacherPassword requires the current password, which an admin
// cannot supply when it was lost. Rotates the session secret and bumps the
// version so every previously issued session is invalidated.
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
    if (!newPwd || newPwd.length < 8) {
      return Response.json({ ok: false, error: "weak" }, { status: 400 });
    }

    // Recovery reset: the admin is already verified by role, so the lost
    // current password is not required (setTeacherPassword covers that path).
    const settings = await getSettings(base44);

    const { hash, salt } = await hashPassword(newPwd);
    const newSecret = freshToken();
    const newVersion = (settings ? settings.session_version || 0 : 0) + 1;

    if (settings) {
      await base44.asServiceRole.entities.TeacherAreaSettings.update(settings.id, {
        password_hash: hash,
        password_salt: salt,
        session_secret: newSecret,
        session_version: newVersion,
        attempt_log: {},
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

    return Response.json({ ok: true, version: newVersion });
  } catch (error) {
    console.error("resetTeacherPassword failed:", error && (error.stack || error.message || error));
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }
}