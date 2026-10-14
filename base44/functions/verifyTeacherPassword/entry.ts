import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { getSettings, verifyPassword } from "../../shared/teacherAuth.ts";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    // The route is login-gated on the client; still require an authenticated
    // app user before attempting the teacher password.
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const password = body && body.password ? String(body.password) : "";
    if (!password) return Response.json({ ok: false, error: "invalid" }, { status: 400 });

    const settings = await getSettings(base44);
    if (!settings || !settings.password_hash) {
      return Response.json({ ok: false, error: "not_configured" });
    }

    const valid = await verifyPassword(password, settings.password_hash, settings.password_salt);
    if (!valid) return Response.json({ ok: false, error: "invalid" });

    return Response.json({
      ok: true,
      token: settings.session_secret,
      version: settings.session_version || 0,
    });
  } catch (error) {
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }
}