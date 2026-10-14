import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { getSettings } from "../../shared/teacherAuth.ts";

// TEMPORAL / SOLO DEBUG (admin). Expone el session_secret actual para probar
// el camino positivo de createOrder. Se elimina tras la verificación.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

    const settings = await getSettings(base44);
    return Response.json({
      ok: true,
      exists: !!(settings && settings.password_hash),
      secret: settings ? settings.session_secret : null,
      version: settings ? settings.session_version || 0 : null,
    });
  } catch (error) {
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }
}