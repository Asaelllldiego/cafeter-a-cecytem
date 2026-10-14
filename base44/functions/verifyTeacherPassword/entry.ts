import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { getSettings, verifyPassword } from "../../shared/teacherAuth.ts";

// Brute-force protection:
//  - Failures are recorded with atomic $push into timestamp arrays. There is
//    no read-modify-write on a shared counter, so concurrent attempts cannot
//    collapse into a single increment (the previous last-write-wins hole).
//  - Limits apply per user, per IP AND globally, so an attacker spinning up
//    many free accounts still hits the shared global/IP ceiling.
//  - A small per-failure delay slows tight brute-force loops.
const MAX_USER = 5;
const MAX_GLOBAL = 30;
const MAX_IP = 15;
const WINDOW_MS = 30 * 60 * 1000; // sliding 30-min window
const FAILURE_DELAY_MS = 200;

type NumArr = number[];
const readArr = (v: any): NumArr =>
  Array.isArray(v) ? v.filter((t) => typeof t === "number") : [];

function retryAfter(arr: NumArr, now: number): number {
  if (!arr.length) return Math.ceil(WINDOW_MS / 1000);
  // timestamps are append-ordered, so the oldest is first.
  return Math.max(1, Math.ceil((arr[0] + WINDOW_MS - now) / 1000));
}

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

    // Client IP (best-effort; sanitized to a safe object key, since dots/colons
    // in an IP would otherwise be interpreted as nested paths).
    const rawIp =
      (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "";
    const ipKey = (rawIp || "unknown").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 45);

    const settings = await getSettings(base44);
    if (!settings || !settings.password_hash) {
      return Response.json({ ok: false, error: "not_configured" });
    }

    const now = Date.now();
    const cutoff = now - WINDOW_MS;
    const log: any =
      settings.attempt_log && typeof settings.attempt_log === "object"
        ? settings.attempt_log
        : {};

    const userArr = readArr(log?.u?.[user.id]).filter((t) => t > cutoff);
    const globalArr = readArr(log?.g).filter((t) => t > cutoff);
    const ipArr = readArr(log?.i?.[ipKey]).filter((t) => t > cutoff);

    // Lock check across all three dimensions, evaluated before verifying.
    if (userArr.length >= MAX_USER || globalArr.length >= MAX_GLOBAL || ipArr.length >= MAX_IP) {
      const candidates: NumArr[] = [];
      if (userArr.length >= MAX_USER) candidates.push(userArr);
      if (globalArr.length >= MAX_GLOBAL) candidates.push(globalArr);
      if (ipArr.length >= MAX_IP) candidates.push(ipArr);
      const retry = Math.min(...candidates.map((a) => retryAfter(a, now)));
      return Response.json({ ok: false, error: "locked", retry_after: retry });
    }

    const valid = await verifyPassword(password, settings.password_hash, settings.password_salt);

    if (!valid) {
      // A small per-failure slow-down so each guess costs a little time.
      await new Promise((r) => setTimeout(r, FAILURE_DELAY_MS));

      const userPath = `attempt_log.u.${user.id}`;
      const ipPath = `attempt_log.i.${ipKey}`;

      // Prune expired entries first (keeps arrays bounded to the window), then
      // append this failure. Each call is an atomic update on the single
      // settings document, so parallel failures all persist their own stamp
      // instead of one overwriting the others.
      try {
        await base44.asServiceRole.entities.TeacherAreaSettings.updateMany(
          { id: settings.id },
          {
            $pull: {
              [userPath]: { $lt: cutoff },
              "attempt_log.g": { $lt: cutoff },
              [ipPath]: { $lt: cutoff },
            },
          }
        );
      } catch (_) {}
      try {
        await base44.asServiceRole.entities.TeacherAreaSettings.updateMany(
          { id: settings.id },
          {
            $push: {
              [userPath]: now,
              "attempt_log.g": now,
              [ipPath]: now,
            },
          }
        );
      } catch (_) {}

      const count = userArr.length + 1; // includes this failure
      if (count >= MAX_USER) {
        return Response.json({
          ok: false,
          error: "locked",
          retry_after: retryAfter([...userArr, now], now),
        });
      }
      return Response.json({ ok: false, error: "invalid", attempts_left: Math.max(0, MAX_USER - count) });
    }

    // Success: clear THIS user's failure history only. Do NOT clear IP/global,
    // which may be protecting against cross-account abuse from the same source.
    if (userArr.length > 0) {
      try {
        await base44.asServiceRole.entities.TeacherAreaSettings.updateMany(
          { id: settings.id },
          { $unset: { [`attempt_log.u.${user.id}`]: "" } }
        );
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