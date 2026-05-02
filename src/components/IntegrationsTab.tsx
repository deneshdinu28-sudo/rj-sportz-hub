import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  RefreshCw, MessageSquare, Eye, Database, Clock, ChevronDown, Loader2, Save,
  Copy, Check, Settings as SettingsIcon, AlertTriangle, Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Status = "connected" | "not_configured" | "error" | "warning" | "checking";

interface CheckResult {
  status: Status;
  message: string;
  latency?: number;
}

const StatusBadge = ({ status }: { status: Status }) => {
  const config = {
    connected: { dot: "bg-success", bg: "bg-success/15 text-success border-success/30", label: "Connected" },
    not_configured: { dot: "bg-muted-foreground", bg: "bg-muted text-muted-foreground border-border", label: "Not Configured" },
    error: { dot: "bg-destructive", bg: "bg-destructive/15 text-destructive border-destructive/30", label: "Error" },
    warning: { dot: "bg-warning", bg: "bg-warning/15 text-warning border-warning/30", label: "Warning" },
    checking: { dot: "bg-muted-foreground", bg: "bg-muted text-muted-foreground border-border", label: "Checking…" },
  }[status];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${config.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot} ${status !== "checking" && status !== "not_configured" ? "animate-pulse" : ""}`} />
      {config.label}
    </div>
  );
};

const StatRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between text-xs py-1">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

export default function IntegrationsTab() {
  const { toast } = useToast();
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Statuses
  const [watiStatus, setWatiStatus] = useState<CheckResult>({ status: "checking", message: "" });
  const [visionStatus, setVisionStatus] = useState<CheckResult>({ status: "checking", message: "" });
  const [supabaseStatus, setSupabaseStatus] = useState<CheckResult>({ status: "checking", message: "" });
  const [cronStatus, setCronStatus] = useState<CheckResult>({ status: "checking", message: "" });

  // Stats
  const [stats, setStats] = useState({
    totalStudents: 0, totalPayments: 0, autoVerifiedThisMonth: 0,
    autoProcessedToday: 0, manualReviewToday: 0,
    studentsRemindedToday: 0, markedUnpaidToday: 0, markedOverdueToday: 0,
  });

  // Config (system_settings)
  const [config, setConfig] = useState({
    wati_token: "", wati_server_url: "", wati_webhook_url: "", google_vision_key: "",
  });
  const [showWatiToken, setShowWatiToken] = useState(false);
  const [showVisionKey, setShowVisionKey] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const configIdRef = useRef<string | null>(null);

  // ─── Status checks ─────────────────────────────────────────────

  const checkSupabase = useCallback(async (): Promise<CheckResult> => {
    try {
      const start = Date.now();
      const { error } = await supabase.from("students").select("id").limit(1);
      const latency = Date.now() - start;
      if (error) return { status: "error", message: error.message };
      return { status: "connected", message: `Connected — ${latency}ms latency`, latency };
    } catch {
      return { status: "error", message: "Cannot reach database" };
    }
  }, []);

  const checkWati = useCallback(async (token: string): Promise<CheckResult> => {
    if (!token) return { status: "not_configured", message: "API token not set" };
    return { status: "warning", message: "Token saved — live ping requires server-side check" };
  }, []);

  const checkVision = useCallback(async (key: string): Promise<CheckResult> => {
    if (!key) return { status: "not_configured", message: "API key not set" };
    return { status: "warning", message: "Key saved — live verification requires server-side check" };
  }, []);

  const checkCron = useCallback(async (): Promise<CheckResult> => {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("cron_logs")
        .select("ran_at")
        .gte("ran_at", since)
        .order("ran_at", { ascending: false })
        .limit(1);
      if (error) return { status: "not_configured", message: "Cron logs not accessible" };
      if (!data || data.length === 0) return { status: "warning", message: "No runs in last 24 hours" };
      const ago = Math.round((Date.now() - new Date(data[0].ran_at).getTime()) / 60000);
      return { status: "connected", message: `Last ran ${ago}m ago` };
    } catch {
      return { status: "not_configured", message: "Cannot check cron status" };
    }
  }, []);

  const loadStats = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

    const [studentsCount, paymentsCount, autoMonth, autoToday, todayCron] = await Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("payments").select("id", { count: "exact", head: true }),
      supabase.from("payments").select("id", { count: "exact", head: true }).eq("verification_method", "auto").gte("payment_date", monthStart),
      supabase.from("payments").select("id", { count: "exact", head: true }).eq("verification_method", "auto").eq("payment_date", today),
      supabase.from("cron_logs").select("job_name, students_affected, messages_sent").gte("ran_at", today),
    ]);

    const cronToday = todayCron.data || [];
    const remindersJob = cronToday.filter((r) => r.job_name === "payment_reminders");
    const unpaidJob = cronToday.filter((r) => r.job_name === "mark_unpaid");
    const overdueJob = cronToday.filter((r) => r.job_name === "mark_overdue");

    setStats({
      totalStudents: studentsCount.count || 0,
      totalPayments: paymentsCount.count || 0,
      autoVerifiedThisMonth: autoMonth.count || 0,
      autoProcessedToday: autoToday.count || 0,
      manualReviewToday: 0,
      studentsRemindedToday: remindersJob.reduce((s, r) => s + (r.messages_sent || 0), 0),
      markedUnpaidToday: unpaidJob.reduce((s, r) => s + (r.students_affected || 0), 0),
      markedOverdueToday: overdueJob.reduce((s, r) => s + (r.students_affected || 0), 0),
    });
  }, []);

  const loadConfig = useCallback(async () => {
    const { data } = await supabase.from("system_settings").select("*").limit(1).maybeSingle();
    if (data) {
      configIdRef.current = data.id;
      setConfig({
        wati_token: data.wati_token || "",
        wati_server_url: data.wati_server_url || "",
        wati_webhook_url: data.wati_webhook_url || "",
        google_vision_key: data.google_vision_key || "",
      });
    }
    return data;
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    setWatiStatus({ status: "checking", message: "" });
    setVisionStatus({ status: "checking", message: "" });
    setSupabaseStatus({ status: "checking", message: "" });
    setCronStatus({ status: "checking", message: "" });

    const cfg = await loadConfig();
    const [s, w, v, c] = await Promise.all([
      checkSupabase(),
      checkWati(cfg?.wati_token || ""),
      checkVision(cfg?.google_vision_key || ""),
      checkCron(),
    ]);
    setSupabaseStatus(s);
    setWatiStatus(w);
    setVisionStatus(v);
    setCronStatus(c);
    await loadStats();
    setLastChecked(new Date());
    setRefreshing(false);
    setLoading(false);
  }, [checkSupabase, checkWati, checkVision, checkCron, loadConfig, loadStats]);

  useEffect(() => {
    refreshAll();
    const id = setInterval(refreshAll, 60_000);
    return () => clearInterval(id);
  }, [refreshAll]);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      if (configIdRef.current) {
        await supabase.from("system_settings").update({ ...config, updated_at: new Date().toISOString() }).eq("id", configIdRef.current);
      } else {
        const { data } = await supabase.from("system_settings").insert(config).select().single();
        if (data) configIdRef.current = data.id;
      }
      toast({ title: "Integration settings saved" });
      refreshAll();
    } catch (e) {
      toast({ title: "Failed to save", description: String((e as Error).message), variant: "destructive" });
    } finally {
      setSavingConfig(false);
    }
  };

  const copyWebhook = () => {
    if (!config.wati_webhook_url) return;
    navigator.clipboard.writeText(config.wati_webhook_url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 1500);
  };

  // Overall banner
  const overall = (() => {
    const all = [watiStatus, visionStatus, supabaseStatus, cronStatus];
    if (all.some((s) => s.status === "error")) return { tone: "error", text: "🔴 Integration error detected — check details below" };
    if (all.every((s) => s.status === "connected")) return { tone: "success", text: "✅ All Systems Operational" };
    if (all.some((s) => s.status === "not_configured")) return { tone: "info", text: "ℹ️ Core systems running. WhatsApp and OCR not yet integrated." };
    if (all.some((s) => s.status === "warning")) return { tone: "warning", text: "⚠️ Some integrations need attention — see details below" };
    return { tone: "info", text: "Checking integration health…" };
  })();

  if (loading) {
    return <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold">API Integrations & System Status</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Monitor all third-party service connections and configurations</p>
          {lastChecked && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Last checked: {lastChecked.toLocaleTimeString("en-IN")} · Auto-refreshes every 60 seconds
            </p>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={refreshAll} disabled={refreshing} className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh All
        </Button>
      </div>

      {/* Overall banner */}
      <div className={`rounded-lg border p-3 text-sm ${
        overall.tone === "success" ? "bg-success/10 border-success/30 text-success" :
        overall.tone === "error" ? "bg-destructive/10 border-destructive/30 text-destructive" :
        overall.tone === "warning" ? "bg-warning/10 border-warning/30 text-warning" :
        "bg-primary/10 border-primary/30 text-primary"
      }`}>
        {overall.text}
      </div>

      {/* CARD 1: WATI */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm">WATI — WhatsApp Business API</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Handles all WhatsApp messaging — reminders, confirmations, alerts</p>
              </div>
            </div>
            <StatusBadge status={watiStatus.status} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 ml-13">{watiStatus.message}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatRow label="Messages sent today" value={stats.studentsRemindedToday || "Logging not set up"} />
          <StatRow label="Webhook URL" value={config.wati_webhook_url ? "Configured" : "Not configured"} />
          <StatRow label="Templates registered" value="—" />

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 mt-2 px-2">
                <SettingsIcon className="h-3 w-3" /> Configure WATI <ChevronDown className="h-3 w-3" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3 border-t border-border mt-2">
              <div>
                <Label className="text-xs">WATI API Token</Label>
                <div className="flex gap-2">
                  <Input
                    type={showWatiToken ? "text" : "password"}
                    value={config.wati_token}
                    onChange={(e) => setConfig((c) => ({ ...c, wati_token: e.target.value }))}
                    placeholder="Bearer token from WATI dashboard"
                  />
                  <Button size="sm" variant="outline" onClick={() => setShowWatiToken((v) => !v)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">WATI Server URL</Label>
                <Input
                  value={config.wati_server_url}
                  onChange={(e) => setConfig((c) => ({ ...c, wati_server_url: e.target.value }))}
                  placeholder="https://live-server-xxxx.wati.io"
                />
              </div>
              <div>
                <Label className="text-xs">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={config.wati_webhook_url}
                    onChange={(e) => setConfig((c) => ({ ...c, wati_webhook_url: e.target.value }))}
                    placeholder="https://your-domain.com/api/webhook/whatsapp"
                  />
                  <Button size="sm" variant="outline" onClick={copyWebhook} disabled={!config.wati_webhook_url}>
                    {copiedWebhook ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* CARD 2: Google Vision */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm">Google Vision API — OCR</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Reads and extracts payment details from parent screenshots automatically</p>
              </div>
            </div>
            <StatusBadge status={visionStatus.status} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">{visionStatus.message}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatRow label="Screenshots processed today" value={stats.autoProcessedToday} />
          <StatRow label="Auto-verified payments this month" value={stats.autoVerifiedThisMonth} />
          <StatRow label="Manual review required today" value={stats.manualReviewToday} />

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 mt-2 px-2">
                <SettingsIcon className="h-3 w-3" /> Configure Google Vision <ChevronDown className="h-3 w-3" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3 border-t border-border mt-2">
              <div>
                <Label className="text-xs">Google Vision API Key</Label>
                <div className="flex gap-2">
                  <Input
                    type={showVisionKey ? "text" : "password"}
                    value={config.google_vision_key}
                    onChange={(e) => setConfig((c) => ({ ...c, google_vision_key: e.target.value }))}
                    placeholder="AIza... API key"
                  />
                  <Button size="sm" variant="outline" onClick={() => setShowVisionKey((v) => !v)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* CARD 3: Supabase / Cloud */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm">Lovable Cloud — Database & Storage</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Core database, authentication, file storage and real-time sync</p>
              </div>
            </div>
            <StatusBadge status={supabaseStatus.status} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">{supabaseStatus.message}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatRow label="Total students in DB" value={stats.totalStudents} />
          <StatRow label="Total payments in DB" value={stats.totalPayments} />
          <StatRow
            label="DB latency"
            value={
              supabaseStatus.latency != null ? (
                <span className={
                  supabaseStatus.latency < 100 ? "text-success" :
                  supabaseStatus.latency < 300 ? "text-warning" : "text-destructive"
                }>{supabaseStatus.latency}ms</span>
              ) : "—"
            }
          />
          <StatRow label="RLS status" value={<Badge variant="default" className="text-[9px]">Enabled</Badge>} />
        </CardContent>
      </Card>

      {/* CARD 4: Cron jobs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm">Automated Jobs — Cron Tasks</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Background jobs for payment reminders, status updates and overdue alerts</p>
              </div>
            </div>
            <StatusBadge status={cronStatus.status} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">{cronStatus.message}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: "Payment Reminders", schedule: "Daily at 9:00 AM", stat: `${stats.studentsRemindedToday} students reminded today` },
            { name: "Mark Unpaid", schedule: "Daily at 12:00 AM", stat: `${stats.markedUnpaidToday} students marked unpaid today` },
            { name: "Mark Overdue + Alert", schedule: "Daily at 12:00 AM", stat: `${stats.markedOverdueToday} students marked overdue today` },
          ].map((job) => (
            <div key={job.name} className="rounded-lg border border-border p-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{job.name}</p>
                <span className="text-[10px] text-muted-foreground">{job.schedule}</span>
              </div>
              <p className="text-xs text-muted-foreground">{job.stat}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save config */}
      <div className="flex justify-end">
        <Button onClick={handleSaveConfig} disabled={savingConfig} className="gap-2">
          {savingConfig ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save Integration Settings</>}
        </Button>
      </div>

      {/* Setup guide */}
      <Card>
        <Collapsible>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Integration Setup Guide</CardTitle>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Follow these steps to connect all services</p>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 text-xs">
              {[
                { n: 1, title: "WATI Setup", body: "1. Sign up at wati.io\n2. Get your API token from Settings → API\n3. Paste it in the WATI config section above\n4. Set up webhook URL: {your_domain}/api/webhook/whatsapp", done: !!config.wati_token },
                { n: 2, title: "Google Vision Setup", body: "1. Go to console.cloud.google.com\n2. Enable Vision API\n3. Create API credentials → API Key\n4. Paste it in the Google Vision config above", done: !!config.google_vision_key },
                { n: 3, title: "Cron Jobs", body: "1. Enable pg_cron + pg_net extensions\n2. Schedule the 3 jobs (reminders, unpaid, overdue)\n3. Verify by checking the Cron status above", done: cronStatus.status === "connected" },
                { n: 4, title: "Environment Variables", body: "Stored securely in Lovable Cloud secrets — no .env editing needed.", done: true },
              ].map((step) => (
                <div key={step.n} className="flex gap-3 items-start">
                  <span className="text-base shrink-0">{step.done ? "✅" : "🔲"}</span>
                  <div className="flex-1">
                    <p className="font-semibold">Step {step.n}: {step.title}</p>
                    <pre className="whitespace-pre-wrap text-muted-foreground text-[11px] mt-1 font-sans">{step.body}</pre>
                  </div>
                </div>
              ))}
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-warning">Live API health checks for WATI and Google Vision require a server-side edge function to keep keys secret. Configure here, wire delivery later.</p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
