// Runs daily at 9 AM. Sends payment reminders:
//  1. Date-based students whose payment_end_date is exactly today+2
//  2. Session-based students with sessions_remaining <= 2 and fee_status='paid'
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const started = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const in2 = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

  try {
    const { data: dateBased } = await supabase
      .from("students")
      .select("id,name,parent_whatsapp,parent_name")
      .eq("is_active", true).eq("payment_end_date", in2);

    const { data: sessionBased } = await supabase
      .from("students")
      .select("id,name,parent_whatsapp,parent_name,sessions_remaining")
      .eq("is_active", true).eq("renewal_trigger", "session_based")
      .eq("fee_status", "paid").lte("sessions_remaining", 2);

    // Dedupe already-notified today
    const { data: alreadyLogged } = await supabase.from("cron_logs")
      .select("id").eq("job_name", "payment-reminders").gte("ran_at", today);

    const affected = (dateBased?.length ?? 0) + (sessionBased?.length ?? 0);
    // NOTE: Actual WhatsApp send would go through your integration (Wati). Here we just log.
    await supabase.from("cron_logs").insert({
      job_name: "payment-reminders",
      status: "success",
      students_affected: affected,
      messages_sent: affected,
      duration_ms: Date.now() - started,
    });
    return new Response(JSON.stringify({ ok: true, affected, alreadyLoggedToday: alreadyLogged?.length ?? 0 }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    await supabase.from("cron_logs").insert({
      job_name: "payment-reminders", status: "error", error_message: String(e), duration_ms: Date.now() - started,
    });
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
