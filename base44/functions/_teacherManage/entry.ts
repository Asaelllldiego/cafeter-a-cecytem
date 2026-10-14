import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { getSettings, hashPassword, verifyPassword, freshToken } from "../../shared/teacherAuth.ts";

// TEMPORAL / SOLO ADMIN. Permite respaldar, cambiar temporalmente y restaurar
// la contraseña del Área de Maestros para ejecutar la prueba E2E obligatoria.
// Se elimina tras la verificación.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const mode = String(body && body.mode || "backup");
    const settings = await getSettings(base44);
    if (!settings || !settings.password_hash) {
      return Response.json({ ok: false, error: "not_configured" }, { status: 400 });
    }

    if (mode === "backup") {
      return Response.json({
        ok: true,
        backup: {
          id: settings.id,
          password_hash: settings.password_hash,
          password_salt: settings.password_salt,
          session_secret: settings.session_secret,
          session_version: settings.session_version || 0,
        },
      });
    }

    if (mode === "setpwd") {
      const newPwd = String(body && body.new_password || "");
      if (newPwd.length < 8) return Response.json({ ok: false, error: "weak" }, { status: 400 });
      const { hash, salt } = await hashPassword(newPwd, settings.password_salt); // keep salt stable
      const newSecret = freshToken();
      const newVersion = (settings.session_version || 0) + 1;
      await base44.asServiceRole.entities.TeacherAreaSettings.update(settings.id, {
        password_hash: hash,
        session_secret: newSecret,
        session_version: newVersion,
        attempt_log: {},
      });
      return Response.json({ ok: true, secret: newSecret, version: newVersion });
    }

    if (mode === "restore") {
      const b = body && body.backup;
      if (!b || !b.id) return Response.json({ ok: false, error: "no_backup" }, { status: 400 });
      await base44.asServiceRole.entities.TeacherAreaSettings.update(b.id, {
        password_hash: b.password_hash,
        password_salt: b.password_salt,
        session_secret: b.session_secret,
        session_version: b.session_version,
        attempt_log: {},
      });
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: "unknown_mode" }, { status: 400 });
  } catch (error) {
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }
}