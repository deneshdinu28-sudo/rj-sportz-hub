// Runs daily at 12 AM. Marks:
//  - paid → unpaid when payment_end_date < today
//  - paid → unpaid when renewal_trigger='session_based' AND sessions_remaining=0
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
  try {
    const { data: a } = await supabase.from("students")
      .update({ fee_status: "unpaid", days_overdue: 0 })
      .eq("fee_status", "paid").lt("payment_end_date", today).select("id");

    const { data: b } = await supabase.from("students")
      .update({ fee_status: "unpaid" })
      .eq("fee_status", "paid").eq("renewal_trigger", "session_based").eq("sessions_remaining", 0).select("id");

    const affected = (a?.length ?? 0) + (b?.length ?? 0);
    await supabase.from("cron_logs").insert({
      job_name: "mark-unpaid", status: "success", students_affected: affected, duration_ms: Date.now() - started,
    });
    return new Response(JSON.stringify({ ok: true, affected }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    await supabase.from("cron_logs").insert({ job_name: "mark-unpaid", status: "error", error_message: String(e), duration_ms: Date.now() - started });
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
