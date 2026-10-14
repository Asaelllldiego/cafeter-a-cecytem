import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { getSettings, verifyPassword } from "../../shared/teacherAuth.ts";

// Brute-force protection: per-user sliding window with progressive lockout.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 30 * 60 * 1000; // failures counted across a 30-min window
const LOCKOUT_MS = 15 * 60 * 1000; // 15-min cooldown after MAX_ATTEMPTS failures

type AttemptEntry = { count: number; first_ts: number; locked_until?: number };

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

    const now = Date.now();
    const log: Record<string, AttemptEntry> =
      settings.attempt_log && typeof settings.attempt_log === "object"
        ? { ...(settings.attempt_log as object) }
        : {};
    const entry = log[user.id] || null;

    // If the user is currently locked, reject before even verifying.
    if (entry && entry.locked_until && now < entry.locked_until) {
      const retryAfter = Math.ceil((entry.locked_until - now) / 1000);
      return Response.json({ ok: false, error: "locked", retry_after: retryAfter });
    }

    const valid = await verifyPassword(password, settings.password_hash, settings.password_salt);

    if (!valid) {
      // Sliding window: reset the counter if the previous window expired.
      const windowExpired = !entry || !entry.first_ts || now - entry.first_ts > WINDOW_MS;
      const firstTs = windowExpired ? now : entry.first_ts;
      const count = windowExpired ? 1 : (entry.count || 0) + 1;
      const next: AttemptEntry = { count, first_ts: firstTs };
      if (count >= MAX_ATTEMPTS) {
        next.locked_until = now + LOCKOUT_MS;
      }
      log[user.id] = next;
      try {
        await base44.asServiceRole.entities.TeacherAreaSettings.update(settings.id, { attempt_log: log });
      } catch (_) {}

      if (next.locked_until) {
        return Response.json({ ok: false, error: "locked", retry_after: Math.ceil(LOCKOUT_MS / 1000) });
      }
      return Response.json({ ok: false, error: "invalid", attempts_left: Math.max(0, MAX_ATTEMPTS - count) });
    }

    // Success: clear this user's attempt history so a later typo starts fresh.
    if (entry) {
      delete log[user.id];
      try {
        await base44.asServiceRole.entities.TeacherAreaSettings.update(settings.id, { attempt_log: log });
      } catch (_) {}
    }

    return Response.json({
      ok: true,
      token: settings.session_secret,
      version: settings.session_version || 0,
    });
  } catch (error) {
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }
}