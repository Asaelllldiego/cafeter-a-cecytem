import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

// Server-side order creation: the server is the ONLY source of truth for
// prices, subtotal, tax and total. The client sends only menu item ids +
// quantities plus pickup/customer details; all monetary fields are recomputed
// here from MenuItem records, so a tampered payload cannot change what gets
// charged or stored.
const TAX_RATE = 0.16;
const MAX_QTY = 50;
const round2 = (n: number) => Math.round(n * 100) / 100;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const rawItems = Array.isArray(body && body.items) ? body.items : [];
    const pickupTime = body && body.pickup_time ? String(body.pickup_time) : "";
    const customerName = body && body.customer_name ? String(body.customer_name).slice(0, 80) : "Estudiante";
    const notes = body && body.notes ? String(body.notes).slice(0, 500) : "";

    if (rawItems.length === 0) return Response.json({ ok: false, error: "empty_order" }, { status: 400 });
    if (!pickupTime) return Response.json({ ok: false, error: "missing_pickup" }, { status: 400 });

    // Normalize and validate line items: only id + quantity from the client.
    const lines: { id: string; qty: number }[] = [];
    const seen = new Set<string>();
    for (const it of rawItems) {
      const id = it && it.id ? String(it.id) : "";
      const qty = Math.floor(Number(it && it.quantity));
      if (!id || !qty || qty < 1 || qty > MAX_QTY) {
        return Response.json({ ok: false, error: "invalid_item" }, { status: 400 });
      }
      if (seen.has(id)) return Response.json({ ok: false, error: "duplicate_item" }, { status: 400 });
      seen.add(id);
      lines.push({ id, qty });
    }

    // Fetch the real menu items. Prices come from the DB, never the client.
    const menuItems = await Promise.all(
      lines.map((l) => base44.asServiceRole.entities.MenuItem.get(l.id).catch(() => null))
    );

    let subtotal = 0;
    let itemCount = 0;
    const orderItems: { name: string; price: number; quantity: number; image_url: string }[] = [];
    for (let i = 0; i < lines.length; i++) {
      const m: any = menuItems[i];
      if (!m) return Response.json({ ok: false, error: "item_not_found" }, { status: 400 });
      if (m.available === false) return Response.json({ ok: false, error: "unavailable" }, { status: 400 });
      if (typeof m.stock === "number" && m.stock < lines[i].qty) {
        return Response.json({ ok: false, error: "out_of_stock", name: m.name }, { status: 400 });
      }
      const price = Number(m.price);
      if (!Number.isFinite(price) || price < 0) {
        return Response.json({ ok: false, error: "invalid_price" }, { status: 500 });
      }
      subtotal += price * lines[i].qty;
      itemCount += lines[i].qty;
      orderItems.push({
        name: m.name,
        price,
        quantity: lines[i].qty,
        image_url: m.image_url || "",
      });
    }

    subtotal = round2(subtotal);
    const tax = round2(subtotal * TAX_RATE);
    const total = round2(subtotal + tax);

    // Created via service role (Order.create is admin-only by RLS) but
    // attributed to the calling user so they can read their own order.
    const order = await base44.asServiceRole.entities.Order.create({
      items: orderItems,
      subtotal,
      tax,
      total,
      status: "pendiente",
      pickup_time: pickupTime,
      customer_name: customerName,
      notes,
      item_count: itemCount,
      customer_user_id: user.id, // ownership for RLS read (created_by_id is service-stamped)
    });

    return Response.json({ ok: true, order });
  } catch (error) {
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }
}