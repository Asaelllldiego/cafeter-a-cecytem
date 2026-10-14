import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { getSettings } from "../../shared/teacherAuth.ts";

// Lightweight server-side validation of a teacher session token.
// Used on entry to the Teacher Area to detect and clear STALE sessions
// (e.g. after the admin rotated the password/secret), which would otherwise
// bypass the client gate but fail createOrder's teacher verification and
// cause the order to be saved as a student order.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, valid: false }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const token = body && body.token ? String(body.token) : "";
    const version = Number(body && body.version);

    const settings = await getSettings(base44);
    if (!settings || !settings.password_hash) {
      return Response.json({ ok: false, valid: false, reason: "not_configured" });
    }
    const valid = !!token &&
      Number.isFinite(version) &&
      settings.session_secret &&
      token === settings.session_secret &&
      version === (settings.session_version || 0);
    return Response.json({ ok: true, valid });
  } catch (error) {
    return Response.json({ ok: false, valid: false, error: "server" }, { status: 500 });
  }
}