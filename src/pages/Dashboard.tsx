import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Users, Building2, AlertTriangle, Plus, ArrowRight, TrendingUp, TrendingDown, Phone, MessageSquare, Trophy } from "lucide-react";
import { mockCommunities, mockSports, mockStudents, mockPayments, formatCurrencyFull, formatCurrency } from "@/lib/mock-data";

export default function Dashboard() {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const totalRevenue = mockPayments.reduce((s, p) => s + p.amount, 0);
    const lastMonthRevenue = Math.round(totalRevenue * 0.86); // simulated
    const revDiff = totalRevenue - lastMonthRevenue;
    const revPct = lastMonthRevenue > 0 ? ((revDiff / lastMonthRevenue) * 100).toFixed(1) : "0";
    const pendingStudents = mockStudents.filter((s) => s.fee_status === "pending" || s.fee_status === "overdue");
    const pendingAmount = pendingStudents.reduce((s, st) => s + st.fee_amount, 0);
    return {
      totalRevenue,
      lastMonthRevenue,
      revDiff,
      revPct,
      revUp: revDiff >= 0,
      totalStudents: mockStudents.length,
      totalCommunities: mockCommunities.length,
      pendingCount: pendingStudents.length,
      pendingAmount,
      pendingStudents: pendingStudents.slice(0, 8),
    };
  }, []);

  const revenueByComm = useMemo(() => {
    return mockCommunities.map((c) => {
      const commStudents = mockStudents.filter((s) => s.community_id === c.id);
      const commPayments = mockPayments.filter((p) => commStudents.some((s) => s.id === p.student_id));
      const revenue = commPayments.reduce((s, p) => s + p.amount, 0);
      const paidPct = commStudents.length ? Math.round((commStudents.filter((s) => s.fee_status === "paid").length / commStudents.length) * 100) : 0;
      return { ...c, studentCount: commStudents.length, revenue, paidPct };
    }).sort((a, b) => b.revenue - a.revenue);
  }, []);

  const revenueBySport = useMemo(() => {
    const sportMap: Record<string, { name: string; icon: string; revenue: number; students: number; unpaid: number }> = {};
    mockSports.forEach((sport) => {
      const key = sport.name;
      if (!sportMap[key]) sportMap[key] = { name: sport.name, icon: sport.icon, revenue: 0, students: 0, unpaid: 0 };
      const sportStudents = mockStudents.filter((s) => s.sport_id === sport.id);
      const sportPayments = mockPayments.filter((p) => sportStudents.some((s) => s.id === p.student_id));
      sportMap[key].revenue += sportPayments.reduce((s, p) => s + p.amount, 0);
      sportMap[key].students += sportStudents.length;
      sportMap[key].unpaid += sportStudents.filter((s) => s.fee_status !== "paid").length;
    });
    return Object.values(sportMap).sort((a, b) => b.revenue - a.revenue);
  }, []);

  const recentPayments = useMemo(() => {
    return mockPayments.slice(0, 8).map((p) => {
      const student = mockStudents.find((s) => s.id === p.student_id);
      return { ...p, studentName: student?.name ?? "—", studentCode: student?.student_id ?? "—" };
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <Card>
          <CardContent className="p-5">
            <div className="text-primary mb-3"><IndianRupee className="h-6 w-6" /></div>
            <p className="text-3xl font-bold text-primary">{formatCurrencyFull(stats.totalRevenue)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Revenue</p>
            <p className="text-xs text-muted-foreground mt-0.5">March 2026</p>
            <div className={`flex items-center gap-1 mt-2 text-xs ${stats.revUp ? "text-success" : "text-destructive"}`}>
              {stats.revUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{stats.revUp ? "↑" : "↓"} {formatCurrencyFull(Math.abs(stats.revDiff))} ({stats.revPct}%)</span>
            </div>
            <p className="text-xs text-muted-foreground">Last month: {formatCurrencyFull(stats.lastMonthRevenue)}</p>
          </CardContent>
        </Card>

        {/* Students Card */}
        <Card>
          <CardContent className="p-5">
            <div className="text-foreground mb-3"><Users className="h-6 w-6" /></div>
            <p className="text-3xl font-bold">{stats.totalStudents}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Students</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><TrendingUp className="h-3 w-3" /> Active</p>
          </CardContent>
        </Card>

        {/* Communities Card */}
        <Card>
          <CardContent className="p-5">
            <div className="text-foreground mb-3"><Building2 className="h-6 w-6" /></div>
            <p className="text-3xl font-bold">{stats.totalCommunities}</p>
            <p className="text-sm text-muted-foreground mt-1">Communities</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><TrendingUp className="h-3 w-3" /> Registered</p>
          </CardContent>
        </Card>

        {/* Pending Card */}
        <Card className="border-warning/30">
          <CardContent className="p-5">
            <div className="text-warning mb-3"><AlertTriangle className="h-6 w-6" /></div>
            <p className="text-3xl font-bold text-warning">{stats.pendingCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Pending Payments</p>
            <p className="text-xs text-warning mt-0.5">{formatCurrencyFull(stats.pendingAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate("/communities")} className="gap-2"><Plus className="h-4 w-4" /> Add Community</Button>
        <Button onClick={() => navigate("/communities")} variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add Student</Button>
        <Button onClick={() => navigate("/attendance")} variant="outline" className="gap-2"><ArrowRight className="h-4 w-4" /> Attendance</Button>
      </div>

      {/* Revenue by Community & Revenue by Sports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue by Community</CardTitle></CardHeader>
          <CardContent className="max-h-[400px] overflow-auto scrollbar-hide lg:max-h-[400px] max-lg:max-h-none max-lg:overflow-visible">
            <div className="space-y-1">
              <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium py-2 border-b border-border">
                <span>Community</span>
                <span className="text-center">Students</span>
                <span className="text-right">Revenue</span>
              </div>
              {revenueByComm.map((c) => (
                <div key={c.id} onClick={() => navigate(`/communities/${c.id}`)} className="grid grid-cols-3 py-2.5 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 transition-colors">
                  <span className="font-medium truncate">{c.name}</span>
                  <span className="text-center text-muted-foreground">{c.studentCount}</span>
                  <span className="text-right flex items-center justify-end gap-1.5">
                    {formatCurrencyFull(c.revenue)}
                    {c.paidPct >= 90 ? "✅" : c.paidPct >= 70 ? "⚠️" : "🔴"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /> Revenue by Sports</CardTitle></CardHeader>
          <CardContent className="max-h-[400px] overflow-auto scrollbar-hide lg:max-h-[400px] max-lg:max-h-none max-lg:overflow-visible">
            <div className="space-y-1">
              <div className="grid grid-cols-4 text-xs text-muted-foreground font-medium py-2 border-b border-border">
                <span>Sport</span>
                <span className="text-center">Students</span>
                <span className="text-center">Revenue</span>
                <span className="text-right">Unpaid</span>
              </div>
              {revenueBySport.map((s) => (
                <div key={s.name} className="grid grid-cols-4 py-2.5 text-sm hover:bg-muted/50 rounded px-1 transition-colors">
                  <span className="font-medium truncate">{s.icon} {s.name}</span>
                  <span className="text-center text-muted-foreground">{s.students}</span>
                  <span className="text-center">{formatCurrency(s.revenue)}</span>
                  <span className={`text-right ${s.unpaid > 0 ? "text-warning" : "text-success"}`}>{s.unpaid}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments & Pending Fees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Payments</CardTitle></CardHeader>
          <CardContent className="max-h-[400px] overflow-auto scrollbar-hide lg:max-h-[400px] max-lg:max-h-none max-lg:overflow-visible">
            <div className="space-y-2">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 text-sm border-b border-border/50 last:border-0">
                  <div>
                    <span className="text-primary mr-1">✅</span>
                    <span className="font-medium">{p.studentName}</span>
                    <span className="text-muted-foreground ml-1">({p.studentCode})</span>
                  </div>
                  <span className="font-semibold">{formatCurrencyFull(p.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Pending Fees ({stats.pendingCount} students)
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-auto scrollbar-hide lg:max-h-[400px] max-lg:max-h-none max-lg:overflow-visible">
            <div className="space-y-3">
              {stats.pendingStudents.map((st) => {
                const comm = mockCommunities.find((c) => c.id === st.community_id);
                const sport = mockSports.find((s) => s.id === st.sport_id);
                const isOverdue = st.fee_status === "overdue";
                return (
                  <div key={st.id} className={`p-3 rounded-lg border ${isOverdue ? "border-destructive/40 bg-destructive/5" : "border-warning/30 bg-warning/5"}`}>
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <Badge variant={isOverdue ? "destructive" : "secondary"} className="text-xs mb-1">
                          {isOverdue ? "🔴 OVERDUE" : "⚠️ PENDING"}
                        </Badge>
                        <p className="font-semibold text-sm">{st.student_id} • {st.name}</p>
                        <p className="text-xs text-muted-foreground">{comm?.name} • {sport?.name}</p>
                      </div>
                      <p className="font-bold">{formatCurrencyFull(st.fee_amount)}</p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="gap-1 text-xs h-7" asChild>
                        <a href={`tel:+91${st.parent_whatsapp}`}><Phone className="h-3 w-3" /> Call</a>
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 text-xs h-7" asChild>
                        <a href={`https://wa.me/91${st.parent_whatsapp}`} target="_blank"><MessageSquare className="h-3 w-3" /> Remind</a>
                      </Button>
                      <Button size="sm" className="gap-1 text-xs h-7" onClick={() => navigate("/payments")}>Mark Paid</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
