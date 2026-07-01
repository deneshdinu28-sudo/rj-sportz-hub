// Runs daily at 12 AM (after mark-unpaid). Marks:
//  - unpaid → overdue when next_due_date < today - 3 days
//  - unpaid → overdue when renewal_trigger='session_based' AND sessions_remaining=0
//    AND fee_status became unpaid > 3 days ago (updated_at as proxy)
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const started = Date.now();
  const cutoff = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
  const cutoffTs = new Date(Date.now() - 3 * 86400000).toISOString();
  try {
    const { data: a } = await supabase.from("students")
      .update({ fee_status: "overdue" })
      .eq("fee_status", "unpaid").lt("next_due_date", cutoff).select("id");

    const { data: b } = await supabase.from("students")
      .update({ fee_status: "overdue" })
      .eq("fee_status", "unpaid").eq("renewal_trigger", "session_based")
      .eq("sessions_remaining", 0).lt("updated_at", cutoffTs).select("id");

    const affected = (a?.length ?? 0) + (b?.length ?? 0);
    await supabase.from("cron_logs").insert({
      job_name: "mark-overdue", status: "success", students_affected: affected, duration_ms: Date.now() - started,
    });
    return new Response(JSON.stringify({ ok: true, affected }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    await supabase.from("cron_logs").insert({ job_name: "mark-overdue", status: "error", error_message: String(e), duration_ms: Date.now() - started });
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
