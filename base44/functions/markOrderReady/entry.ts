import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

// Marca un pedido como 'listo'. Solo administradores. El aviso al cliente
// llega por la suscripción en tiempo real de la entidad Order (OrderReadyNotice),
// por lo que aquí solo se actualiza el estado y se devuelve el resumen.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const orderId = body && body.order_id ? String(body.order_id) : "";
    if (!orderId) return Response.json({ ok: false, error: "missing_order_id" }, { status: 400 });

    const order = await base44.entities.Order.get(orderId).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!order) return Response.json({ ok: false, error: "not_found" }, { status: 404 });

    if (order.status === "entregado" || order.status === "cancelado") {
      return Response.json({ ok: false, error: "invalid_status" }, { status: 400 });
    }

    const updated = await base44.entities.Order.update(orderId, { status: "listo" });

    return Response.json({
      ok: true,
      order: {
        id: updated.id,
        status: updated.status,
        customer_name: updated.customer_name,
        pickup_time: updated.pickup_time,
      },
    });
  } catch (error) {
    console.error("markOrderReady failed:", error && (error.stack || error.message || error));
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }
}