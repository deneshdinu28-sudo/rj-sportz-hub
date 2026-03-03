import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndianRupee, AlertTriangle, CheckCircle, Clock, Phone, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockStudents, mockCommunities, mockSports, mockPayments, formatCurrencyFull, formatCurrency } from "@/lib/mock-data";
import type { Student } from "@/types/database";

export default function Payments() {
  const { toast } = useToast();
  const [markPaidStudent, setMarkPaidStudent] = useState<Student | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "", payment_date: new Date().toISOString().slice(0, 10), payment_mode: "PhonePe", transaction_id: "",
  });

  const stats = useMemo(() => {
    const totalCollected = mockPayments.reduce((s, p) => s + p.amount, 0);
    const pending = mockStudents.filter((s) => s.fee_status === "pending");
    const overdue = mockStudents.filter((s) => s.fee_status === "overdue");
    const pendingAmount = pending.reduce((s, st) => s + st.fee_amount, 0);
    const overdueAmount = overdue.reduce((s, st) => s + st.fee_amount, 0);
    const todayPayments = mockPayments.filter((p) => p.payment_date === new Date().toISOString().slice(0, 10));
    const todayAmount = todayPayments.reduce((s, p) => s + p.amount, 0);
    return { totalCollected, pendingCount: pending.length, pendingAmount, overdueCount: overdue.length, overdueAmount, todayAmount, todayCount: todayPayments.length };
  }, []);

  const pendingStudents = useMemo(() => mockStudents.filter((s) => s.fee_status === "pending"), []);
  const overdueStudents = useMemo(() => mockStudents.filter((s) => s.fee_status === "overdue"), []);
  const paidStudents = useMemo(() => mockStudents.filter((s) => s.fee_status === "paid").slice(0, 20), []);

  const openMarkPaid = (student: Student) => {
    setPaymentForm({
      amount: String(student.fee_amount),
      payment_date: new Date().toISOString().slice(0, 10),
      payment_mode: "PhonePe",
      transaction_id: "",
    });
    setMarkPaidStudent(student);
  };

  const handleMarkPaid = () => {
    toast({ title: "Payment recorded!", description: `${formatCurrencyFull(Number(paymentForm.amount))} from ${markPaidStudent?.name}` });
    setMarkPaidStudent(null);
  };

  const StudentCard = ({ student, showOverdue = false }: { student: Student; showOverdue?: boolean }) => {
    const comm = mockCommunities.find((c) => c.id === student.community_id);
    const sport = mockSports.find((s) => s.id === student.sport_id);
    return (
      <div className={`p-4 rounded-lg border ${showOverdue ? "border-destructive/40 bg-destructive/5" : "border-warning/30 bg-warning/5"}`}>
        <Badge variant={showOverdue ? "destructive" : "secondary"} className="text-xs mb-2">
          {showOverdue ? "🔴 OVERDUE" : "⚠️ PENDING"}
        </Badge>
        <p className="font-semibold">{student.student_id} • {student.name}</p>
        <p className="text-xs text-muted-foreground">Parent: {student.parent_name}</p>
        <p className="text-xs text-muted-foreground mt-1">{comm?.name} • {sport?.name} • {student.batch_time}</p>
        <p className="text-xs text-muted-foreground">{student.batch_type} • {student.payment_plan === "1m" ? "1 Month" : student.payment_plan === "3m" ? "3 Months" : "6 Months"}</p>
        <p className="font-bold text-lg mt-2">{formatCurrencyFull(student.fee_amount)}</p>
        {student.next_due_date && <p className="text-xs text-muted-foreground">Due: {student.next_due_date}</p>}
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" className="gap-1 text-xs" asChild>
            <a href={`tel:+91${student.parent_whatsapp}`}><Phone className="h-3 w-3" /> Call</a>
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs" asChild>
            <a href={`https://wa.me/91${student.parent_whatsapp}`} target="_blank"><MessageSquare className="h-3 w-3" /> Remind</a>
          </Button>
          <Button size="sm" className="gap-1 text-xs" onClick={() => openMarkPaid(student)}>
            <CheckCircle className="h-3 w-3" /> Mark Paid
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payments</h1>

      {/* Stats */}
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
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({stats.pendingCount})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({stats.overdueCount})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingStudents.map((s) => <StudentCard key={s.id} student={s} />)}
          </div>
        </TabsContent>

        <TabsContent value="overdue" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overdueStudents.map((s) => <StudentCard key={s.id} student={s} showOverdue />)}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                {mockPayments.slice(0, 20).map((p) => {
                  const st = mockStudents.find((s) => s.id === p.student_id);
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-sm">
                      <div>
                        <p className="font-medium">✅ {st?.name} <span className="text-muted-foreground">({st?.student_id})</span></p>
                        <p className="text-xs text-muted-foreground">{p.payment_date} • {p.payment_mode}</p>
                      </div>
                      <span className="font-semibold">{formatCurrencyFull(p.amount)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mark Paid Modal */}
      <Dialog open={!!markPaidStudent} onOpenChange={(v) => { if (!v) setMarkPaidStudent(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark Payment - {markPaidStudent?.student_id}</DialogTitle>
          </DialogHeader>
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
                <SelectContent>
                  {["PhonePe", "GPay", "UPI", "Cash", "Bank Transfer"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Transaction ID</Label><Input value={paymentForm.transaction_id} onChange={(e) => setPaymentForm((p) => ({ ...p, transaction_id: e.target.value }))} placeholder="T2026031512345" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidStudent(null)}>Cancel</Button>
            <Button onClick={handleMarkPaid}>Confirm Payment →</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
