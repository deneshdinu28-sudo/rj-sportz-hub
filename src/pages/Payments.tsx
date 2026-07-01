import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndianRupee, AlertTriangle, CheckCircle, Clock, Phone, MessageSquare, Loader2, MoreVertical, Pause, X, Search, SlidersHorizontal, Download } from "lucide-react";
import { useStudents, useCommunities, useSports, usePayments, useMarkPayment, useUpdateStudent, formatCurrencyFull, formatCurrency, detectPaymentPlan, type DetectedPlan } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";

type Plan = "all" | "1m" | "3m" | "6m";

export default function Payments() {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: communities = [] } = useCommunities();
  const { data: sports = [] } = useSports();
  const { data: payments = [], isLoading: loadingPayments } = usePayments();
  const markPayment = useMarkPayment();
  const updateStudent = useUpdateStudent();
  const { toast } = useToast();

  const [markPaidStudentId, setMarkPaidStudentId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "", payment_date: new Date().toISOString().slice(0, 10), payment_mode: "PhonePe", transaction_id: "",
  });

  // ─── Search + filters ───
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [communityFilter, setCommunityFilter] = useState<string>("all");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<Plan>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const sportsForCommunity = useMemo(() => {
    if (communityFilter === "all") return sports;
    return sports.filter((s) => s.community_id === communityFilter);
  }, [sports, communityFilter]);

  // Reset sport filter when community changes and the sport doesn't belong
  useEffect(() => {
    if (sportFilter !== "all" && !sportsForCommunity.some((s) => s.id === sportFilter)) {
      setSportFilter("all");
    }
  }, [sportFilter, sportsForCommunity]);

  const applyDatePreset = (preset: "week" | "month" | "lastMonth" | "3months") => {
    const now = new Date();
    let from = new Date();
    const to = new Date();
    if (preset === "week") {
      from = new Date(now);
      from.setDate(now.getDate() - 7);
    } else if (preset === "month") {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (preset === "lastMonth") {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to.setFullYear(now.getFullYear(), now.getMonth(), 0);
    } else if (preset === "3months") {
      from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    }
    setDateFrom(from.toISOString().slice(0, 10));
    setDateTo(to.toISOString().slice(0, 10));
  };

  const clearAllFilters = () => {
    setSearchInput(""); setSearchTerm("");
    setCommunityFilter("all"); setSportFilter("all"); setPlanFilter("all");
    setDateFrom(""); setDateTo(""); setModeFilter("all");
    setMinAmount(""); setMaxAmount("");
  };

  const matchesStudent = (s: typeof students[0]) => {
    if (searchTerm) {
      const blob = `${s.name} ${s.student_id} ${s.parent_name} ${s.parent_whatsapp}`.toLowerCase();
      if (!blob.includes(searchTerm)) return false;
    }
    if (communityFilter !== "all" && s.community_id !== communityFilter) return false;
    if (sportFilter !== "all" && s.sport_id !== sportFilter) return false;
    if (planFilter !== "all" && s.payment_plan !== planFilter) return false;
    return true;
  };

  const isSessionRenewalDue = (s: typeof students[0]) =>
    (s as any).renewal_trigger === "session_based" && Number((s as any).sessions_remaining ?? 0) === 0;

  const filteredPending = useMemo(
    () => students.filter((s) => {
      if (!matchesStudent(s)) return false;
      if (["pending", "awaiting_first", "unpaid"].includes(s.fee_status)) return true;
      // Session-based students with sessions exhausted → treat as pending renewal
      if (isSessionRenewalDue(s) && s.fee_status !== "paid") return true;
      return false;
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [students, searchTerm, communityFilter, sportFilter, planFilter]
  );
  const filteredOverdue = useMemo(
    () => students.filter((s) => matchesStudent(s) && s.fee_status === "overdue"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [students, searchTerm, communityFilter, sportFilter, planFilter]
  );

  const filteredHistory = useMemo(() => {
    return payments.filter((p) => {
      const st = students.find((s) => s.id === p.student_id);
      if (searchTerm) {
        const blob = `${st?.name ?? ""} ${st?.student_id ?? p.student_code ?? ""} ${st?.parent_name ?? ""} ${st?.parent_whatsapp ?? ""}`.toLowerCase();
        if (!blob.includes(searchTerm)) return false;
      }
      if (communityFilter !== "all" && st?.community_id !== communityFilter) return false;
      if (sportFilter !== "all" && st?.sport_id !== sportFilter) return false;
      if (planFilter !== "all" && p.plan_period !== planFilter) return false;
      if (dateFrom && p.payment_date < dateFrom) return false;
      if (dateTo && p.payment_date > dateTo) return false;
      if (modeFilter !== "all" && p.payment_mode !== modeFilter) return false;
      if (minAmount && Number(p.amount) < Number(minAmount)) return false;
      if (maxAmount && Number(p.amount) > Number(maxAmount)) return false;
      return true;
    });
  }, [payments, students, searchTerm, communityFilter, sportFilter, planFilter, dateFrom, dateTo, modeFilter, minAmount, maxAmount]);

  const stats = useMemo(() => {
    const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);
    const pending = students.filter((s) => ["pending", "awaiting_first", "unpaid"].includes(s.fee_status));
    const overdue = students.filter((s) => s.fee_status === "overdue");
    const pendingAmount = pending.reduce((s, st) => s + Number(st.fee_amount), 0);
    const overdueAmount = overdue.reduce((s, st) => s + Number(st.fee_amount), 0);
    const today = new Date().toISOString().slice(0, 10);
    const todayPayments = payments.filter((p) => p.payment_date === today);
    const todayAmount = todayPayments.reduce((s, p) => s + Number(p.amount), 0);
    return { totalCollected, pendingCount: pending.length, pendingAmount, overdueCount: overdue.length, overdueAmount, todayAmount, todayCount: todayPayments.length };
  }, [students, payments]);

  const isLoading = loadingStudents || loadingPayments;

  const openMarkPaid = (student: typeof students[0]) => {
    setPaymentForm({
      amount: String(student.fee_amount),
      payment_date: new Date().toISOString().slice(0, 10),
      payment_mode: "PhonePe",
      transaction_id: "",
    });
    setMarkPaidStudentId(student.id);
  };

  const markPaidStudent = students.find((s) => s.id === markPaidStudentId);

  const handleMarkPaid = async () => {
    if (!markPaidStudent) return;
    await markPayment.mutateAsync({
      student_id: markPaidStudent.id,
      student_code: markPaidStudent.student_id,
      amount: Number(paymentForm.amount),
      payment_date: paymentForm.payment_date,
      payment_mode: paymentForm.payment_mode,
      transaction_id: paymentForm.transaction_id,
      plan_period: markPaidStudent.payment_plan,
    });
    setMarkPaidStudentId(null);
  };

  const handlePutOnHold = async (student: typeof students[0]) => {
    await updateStudent.mutateAsync({ id: student.id, updates: { is_on_hold: true, hold_reason: "Fee not paid" } });
    toast({ title: `${student.name} put on hold` });
  };
  const handleDiscontinue = async (student: typeof students[0]) => {
    await updateStudent.mutateAsync({ id: student.id, updates: { is_active: false } });
    toast({ title: `${student.name} marked as discontinued`, variant: "destructive" });
  };

  const getDaysInfo = (student: typeof students[0]) => {
    if (!student.next_due_date) return { text: "—", days: 0 };
    const days = Math.ceil((new Date(student.next_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days === 0) return { text: "Due Today", days: 0 };
    if (days < 0) return { text: `${Math.abs(days)} days overdue`, days };
    return { text: `Due in ${days} days`, days };
  };

  const exportCsv = () => {
    let rows: string[][] = [];
    let filename = "payments";
    if (activeTab === "history") {
      filename = "payment-history";
      rows = [["Receipt", "Student", "Student ID", "Amount", "Plan", "Date", "Mode", "Txn ID"]];
      filteredHistory.forEach((p) => {
        const st = students.find((s) => s.id === p.student_id);
        rows.push([p.receipt_number ?? "", st?.name ?? "", p.student_code ?? st?.student_id ?? "", String(p.amount), p.plan_period, p.payment_date, p.payment_mode, p.transaction_id ?? ""]);
      });
    } else {
      filename = activeTab === "overdue" ? "overdue-students" : "pending-students";
      const list = activeTab === "overdue" ? filteredOverdue : filteredPending;
      rows = [["Student ID", "Name", "Parent", "WhatsApp", "Community", "Sport", "Plan", "Amount", "Next Due"]];
      list.forEach((s) => {
        const c = communities.find((x) => x.id === s.community_id);
        const sp = sports.find((x) => x.id === s.sport_id);
        rows.push([s.student_id, s.name, s.parent_name, s.parent_whatsapp, c?.name ?? "", sp?.name ?? "", s.payment_plan, String(s.fee_amount), s.next_due_date ?? ""]);
      });
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const StudentCard = ({ student, showOverdue = false }: { student: typeof students[0]; showOverdue?: boolean }) => {
    const comm = communities.find((c) => c.id === student.community_id);
    const sport = sports.find((s) => s.id === student.sport_id);
    const daysInfo = getDaysInfo(student);
    return (
      <div className={`p-4 rounded-lg border ${showOverdue ? "border-destructive/40 bg-destructive/5" : "border-warning/30 bg-warning/5"}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant={showOverdue ? "destructive" : "secondary"} className="text-xs">
                {showOverdue ? "🔴 OVERDUE" : student.fee_status === "awaiting_first" ? "✨ NEW" : "⚠️ PENDING"}
              </Badge>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${showOverdue ? "bg-destructive text-destructive-foreground" : "bg-warning/20 text-warning"}`}>
                {daysInfo.text}
              </span>
            </div>
            <p className="font-semibold">{student.student_id} • {student.name}</p>
            <p className="text-xs text-muted-foreground">Parent: {student.parent_name}</p>
            <p className="text-xs text-muted-foreground mt-1">{comm?.name} • {sport?.name} • {student.batch_type}</p>
            <p className="font-bold text-lg mt-2">{formatCurrencyFull(Number(student.fee_amount))}</p>
            {student.next_due_date && <p className="text-xs text-muted-foreground">Due: {student.next_due_date}</p>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handlePutOnHold(student)}><Pause className="h-4 w-4 mr-2" /> Put on Hold</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDiscontinue(student)} className="text-destructive"><X className="h-4 w-4 mr-2" /> Mark Discontinued</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" className="gap-1 text-xs" asChild><a href={`tel:+91${student.parent_whatsapp}`}><Phone className="h-3 w-3" /> Call</a></Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs" asChild><a href={`https://wa.me/91${student.parent_whatsapp}`} target="_blank"><MessageSquare className="h-3 w-3" /> {showOverdue ? "Urgent Remind" : "Remind"}</a></Button>
          <Button size="sm" className="gap-1 text-xs" onClick={() => openMarkPaid(student)}><CheckCircle className="h-3 w-3" /> Mark Paid</Button>
        </div>
      </div>
    );
  };

  // Active filter chips
  const activeChips: Array<{ key: string; label: string; clear: () => void }> = [];
  if (communityFilter !== "all") activeChips.push({ key: "c", label: `Community: ${communities.find((c) => c.id === communityFilter)?.name ?? ""}`, clear: () => setCommunityFilter("all") });
  if (sportFilter !== "all") activeChips.push({ key: "s", label: `Sport: ${sports.find((s) => s.id === sportFilter)?.name ?? ""}`, clear: () => setSportFilter("all") });
  if (planFilter !== "all") activeChips.push({ key: "p", label: `Plan: ${planFilter === "1m" ? "1 Month" : planFilter === "3m" ? "3 Months" : "6 Months"}`, clear: () => setPlanFilter("all") });
  if (dateFrom) activeChips.push({ key: "df", label: `From: ${dateFrom}`, clear: () => setDateFrom("") });
  if (dateTo) activeChips.push({ key: "dt", label: `To: ${dateTo}`, clear: () => setDateTo("") });
  if (modeFilter !== "all") activeChips.push({ key: "m", label: `Mode: ${modeFilter}`, clear: () => setModeFilter("all") });
  if (minAmount) activeChips.push({ key: "mn", label: `Min: ₹${minAmount}`, clear: () => setMinAmount("") });
  if (maxAmount) activeChips.push({ key: "mx", label: `Max: ₹${maxAmount}`, clear: () => setMaxAmount("") });

  const FilterControls = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div>
        <Label className="text-xs">Community</Label>
        <Select value={communityFilter} onValueChange={setCommunityFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Communities</SelectItem>
            {communities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Sport</Label>
        <Select value={sportFilter} onValueChange={setSportFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {sportsForCommunity.map((s) => <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Plan</Label>
        <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as Plan)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="1m">1 Month</SelectItem>
            <SelectItem value="3m">3 Months</SelectItem>
            <SelectItem value="6m">6 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {activeTab === "history" && (
        <div>
          <Label className="text-xs">Payment Mode</Label>
          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              {["PhonePe", "GPay", "Cash", "Bank Transfer", "UPI"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {activeTab === "history" && (
        <>
          <div>
            <Label className="text-xs">From Date</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">To Date</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex flex-wrap gap-2 items-end">
            {[
              { k: "week", label: "This Week" },
              { k: "month", label: "This Month" },
              { k: "lastMonth", label: "Last Month" },
              { k: "3months", label: "Last 3 Months" },
            ].map((p) => (
              <Button key={p.k} variant="outline" size="sm" className="text-xs h-7" onClick={() => applyDatePreset(p.k as "week")}>
                {p.label}
              </Button>
            ))}
          </div>
          <div>
            <Label className="text-xs">Min ₹</Label>
            <Input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="0" />
          </div>
          <div>
            <Label className="text-xs">Max ₹</Label>
            <Input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} placeholder="∞" />
          </div>
          <div className="sm:col-span-2 flex flex-wrap gap-2 items-end">
            {[3000, 8500, 16000].map((v) => (
              <Button key={v} variant="outline" size="sm" className="text-xs h-7" onClick={() => setMaxAmount(String(v))}>≤ ₹{v.toLocaleString("en-IN")}</Button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Payments</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      </div>
    );
  }

  const currentCount = activeTab === "history" ? filteredHistory.length : activeTab === "overdue" ? filteredOverdue.length : filteredPending.length;
  const totalCount = activeTab === "history" ? payments.length : activeTab === "overdue" ? stats.overdueCount : stats.pendingCount;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payments</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <IndianRupee className="h-5 w-5 text-primary" />, value: formatCurrency(stats.totalCollected), label: "This Month", color: "" },
          { icon: <Clock className="h-5 w-5 text-warning" />, value: `${stats.pendingCount}`, label: `Pending (${formatCurrency(stats.pendingAmount)})`, color: "text-warning" },
          { icon: <AlertTriangle className="h-5 w-5 text-destructive" />, value: `${stats.overdueCount}`, label: `Overdue (${formatCurrency(stats.overdueAmount)})`, color: "text-destructive" },
          { icon: <CheckCircle className="h-5 w-5 text-primary" />, value: formatCurrency(stats.todayAmount), label: `Today (${stats.todayCount} payments)`, color: "" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">{s.icon}</div>
              <div><p className={`text-xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Search & Filters ─── */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, student ID, parent name, phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Mobile filter trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden gap-2"><SlidersHorizontal className="h-4 w-4" /> Filters</Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
              <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
              <div className="mt-4"><FilterControls /></div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop filters */}
        <div className="hidden md:block">
          <FilterControls />
        </div>

        {/* Active chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Active:</span>
            {activeChips.map((chip) => (
              <button key={chip.key} onClick={chip.clear} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/10 border border-primary/30 hover:bg-primary/20">
                {chip.label} <X className="h-3 w-3" />
              </button>
            ))}
            <button onClick={clearAllFilters} className="text-xs text-destructive hover:underline ml-1">Clear All</button>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Showing {currentCount} of {totalCount} results</span>
          <Button variant="outline" size="sm" className="gap-1 h-8" onClick={exportCsv}><Download className="h-3 w-3" /> Export CSV</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({filteredPending.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({filteredOverdue.length})</TabsTrigger>
          <TabsTrigger value="history">History ({filteredHistory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {filteredPending.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No pending payments match your filters</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{filteredPending.map((s) => <StudentCard key={s.id} student={s} />)}</div>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="mt-4">
          {filteredOverdue.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No overdue payments match your filters</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{filteredOverdue.map((s) => <StudentCard key={s.id} student={s} showOverdue />)}</div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {filteredHistory.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No payment history matches your filters</p>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="p-3">Name</th>
                        <th className="p-3">Student ID</th>
                        <th className="p-3 hidden md:table-cell">Parent</th>
                        <th className="p-3 hidden lg:table-cell">Sport</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3 hidden md:table-cell">Pack</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 hidden md:table-cell">Mode</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.slice(0, 200).map((p) => {
                        const st = students.find((s) => s.id === p.student_id);
                        const sport = st ? sports.find((sp) => sp.id === st.sport_id) : null;
                        const planLabel = p.plan_period === "1m" ? "1 Month" : p.plan_period === "3m" ? "3 Months" : p.plan_period === "6m" ? "6 Months" : p.plan_period;
                        return (
                          <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-medium">{st?.name ?? "—"}</td>
                            <td className="p-3"><code className="text-primary text-xs">{p.student_code ?? st?.student_id ?? "—"}</code></td>
                            <td className="p-3 hidden md:table-cell text-muted-foreground">{st?.parent_name ?? "—"}</td>
                            <td className="p-3 hidden lg:table-cell text-muted-foreground">{sport ? `${sport.icon} ${sport.name}` : "—"}</td>
                            <td className="p-3 font-bold text-success">{formatCurrencyFull(Number(p.amount))}</td>
                            <td className="p-3 hidden md:table-cell"><span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs">{planLabel}</span></td>
                            <td className="p-3 text-muted-foreground">{p.payment_date}</td>
                            <td className="p-3 hidden md:table-cell text-muted-foreground">{p.payment_mode}</td>
                            <td className="p-3"><Badge variant="default" className="text-xs">✅ Verified</Badge></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mark Paid Modal */}
      <Dialog open={!!markPaidStudentId} onOpenChange={(v) => { if (!v) setMarkPaidStudentId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Mark Payment - {markPaidStudent?.student_id}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p>Student: <strong>{markPaidStudent?.name}</strong></p>
              <p>Plan: {markPaidStudent?.batch_type} {markPaidStudent?.payment_plan === "1m" ? "1 Month" : markPaidStudent?.payment_plan === "3m" ? "3 Months" : "6 Months"}</p>
            </div>
            <div><Label>Amount Received *</Label><Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} /></div>
            <div><Label>Payment Date *</Label><Input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm((p) => ({ ...p, payment_date: e.target.value }))} /></div>
            <div>
              <Label>Payment Mode *</Label>
              <Select value={paymentForm.payment_mode} onValueChange={(v) => setPaymentForm((p) => ({ ...p, payment_mode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["PhonePe", "GPay", "UPI", "Cash", "Bank Transfer"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Transaction ID</Label><Input value={paymentForm.transaction_id} onChange={(e) => setPaymentForm((p) => ({ ...p, transaction_id: e.target.value }))} placeholder="T2026031512345" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidStudentId(null)}>Cancel</Button>
            <Button onClick={handleMarkPaid} disabled={markPayment.isPending}>
              {markPayment.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</> : "Confirm Payment →"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
