import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { getSettings } from "../../shared/teacherAuth.ts";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const token = body && body.token ? String(body.token) : "";
    const version = Number(body && body.version);
    if (!token || Number.isNaN(version)) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const settings = await getSettings(base44);
    if (!settings || !settings.password_hash) {
      return Response.json({ ok: false, error: "not_configured" });
    }
    if (token !== settings.session_secret || version !== (settings.session_version || 0)) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const [ordersRes, agg, menuRes] = await Promise.all([
      base44.asServiceRole.entities.Order.filter(
        { status: { $in: ["pendiente", "en_preparacion", "listo"] } },
        { sort: "-created_date", limit: 30 }
      ),
      base44.asServiceRole.entities.Order.aggregate({ groupBy: "status" }),
      base44.asServiceRole.entities.MenuItem.filter({ available: { $ne: false } }, { sort: "-popular", limit: 50 }),
    ]);

    const counts = {};
    ((agg && agg.rows) || []).forEach((r) => { counts[r.status] = r.count; });

    return Response.json({
      ok: true,
      counts,
      orders: ((ordersRes && ordersRes.items) || []).map((o) => ({
        customer_name: o.customer_name,
        status: o.status,
        pickup_time: o.pickup_time,
        total: o.total,
        item_count: o.item_count,
        created_date: o.created_date,
        items: ((o.items || []).map((i) => ({ name: i.name, quantity: i.quantity }))),
      })),
      menu: ((menuRes && menuRes.items) || []).map((m) => ({
        name: m.name,
        price: m.price,
        category: m.category,
        day_of_week: m.day_of_week,
      })),
    });
  } catch (error) {
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }
}