import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Erases the calling user's personal data before they log out, to satisfy
// app-store account-deletion requirements. Runs with the service role because
// Order's delete rule is admin-only (users cannot delete their own orders).
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // 1) Delete the user's order history (service role bypasses RLS).
    try {
      await base44.asServiceRole.entities.Order.deleteMany({ created_by_id: user.id });
    } catch (e) {
      // best-effort; continue to PII cleanup
    }

    // 2) Clear personal profile fields stored on the user record.
    try {
      await base44.asServiceRole.entities.User.update(user.id, {
        phone: '',
        grade: '',
        group: '',
        shift: '',
        student_id: '',
        notify_orders: false,
        notify_promos: false,
      });
    } catch (e) {
      // best-effort
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}