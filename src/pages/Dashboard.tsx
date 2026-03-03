import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Users, Building2, AlertTriangle, Plus, ArrowRight, TrendingUp, Phone, MessageSquare } from "lucide-react";
import { mockCommunities, mockSports, mockStudents, mockPayments, formatCurrencyFull } from "@/lib/mock-data";

export default function Dashboard() {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const totalRevenue = mockPayments.reduce((s, p) => s + p.amount, 0);
    const pendingStudents = mockStudents.filter((s) => s.fee_status === "pending" || s.fee_status === "overdue");
    const pendingAmount = pendingStudents.reduce((s, st) => s + st.fee_amount, 0);
    return {
      totalRevenue,
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
      const commPayments = mockPayments.filter((p) =>
        commStudents.some((s) => s.id === p.student_id)
      );
      const revenue = commPayments.reduce((s, p) => s + p.amount, 0);
      const paidPct = commStudents.length ? Math.round((commStudents.filter((s) => s.fee_status === "paid").length / commStudents.length) * 100) : 0;
      return { ...c, studentCount: commStudents.length, revenue, paidPct };
    }).sort((a, b) => b.revenue - a.revenue);
  }, []);

  const recentPayments = useMemo(() => {
    return mockPayments.slice(0, 8).map((p) => {
      const student = mockStudents.find((s) => s.id === p.student_id);
      return { ...p, studentName: student?.name ?? "—", studentCode: student?.student_id ?? "—" };
    });
  }, []);

  const statCards = [
    { icon: <IndianRupee className="h-6 w-6" />, value: formatCurrencyFull(stats.totalRevenue), label: "Total Revenue", sub: "This Month", color: "text-primary" },
    { icon: <Users className="h-6 w-6" />, value: stats.totalStudents, label: "Total Students", sub: "Active", color: "text-foreground" },
    { icon: <Building2 className="h-6 w-6" />, value: stats.totalCommunities, label: "Communities", sub: "Registered", color: "text-foreground" },
    { icon: <AlertTriangle className="h-6 w-6" />, value: stats.pendingCount, label: "Pending Payments", sub: formatCurrencyFull(stats.pendingAmount), color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className={`${s.color} mb-3`}>{s.icon}</div>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <TrendingUp className="h-3 w-3" /> {s.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate("/communities")} className="gap-2">
          <Plus className="h-4 w-4" /> Add Community
        </Button>
        <Button onClick={() => navigate("/communities")} variant="outline" className="gap-2">
          <Plus className="h-4 w-4" /> Add Student
        </Button>
        <Button onClick={() => navigate("/communities")} variant="outline" className="gap-2">
          <ArrowRight className="h-4 w-4" /> View All
        </Button>
      </div>

      {/* Revenue & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Community</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-auto scrollbar-hide">
            <div className="space-y-1">
              <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium py-2 border-b border-border">
                <span>Community</span>
                <span className="text-center">Students</span>
                <span className="text-right">Revenue</span>
              </div>
              {revenueByComm.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/communities/${c.id}`)}
                  className="grid grid-cols-3 py-2.5 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 transition-colors"
                >
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
          <CardHeader>
            <CardTitle className="text-base">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-auto scrollbar-hide">
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
      </div>

      {/* Pending Fees */}
      <Card className="border-warning/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Pending Fees ({stats.pendingCount} students)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.pendingStudents.map((st) => {
              const comm = mockCommunities.find((c) => c.id === st.community_id);
              const sport = mockSports.find((s) => s.id === st.sport_id);
              const isOverdue = st.fee_status === "overdue";
              return (
                <div
                  key={st.id}
                  className={`p-4 rounded-lg border ${isOverdue ? "border-destructive/40 bg-destructive/5" : "border-warning/30 bg-warning/5"}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant={isOverdue ? "destructive" : "secondary"} className="text-xs mb-1">
                        {isOverdue ? "🔴 OVERDUE" : "⚠️ PENDING"}
                      </Badge>
                      <p className="font-semibold">{st.student_id} • {st.name}</p>
                      <p className="text-xs text-muted-foreground">Parent: {st.parent_name}</p>
                    </div>
                    <p className="font-bold text-lg">{formatCurrencyFull(st.fee_amount)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {comm?.name} • {sport?.name} • {st.batch_time}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1 text-xs" asChild>
                      <a href={`tel:+91${st.parent_whatsapp}`}><Phone className="h-3 w-3" /> Call</a>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 text-xs" asChild>
                      <a href={`https://wa.me/91${st.parent_whatsapp}`} target="_blank"><MessageSquare className="h-3 w-3" /> Remind</a>
                    </Button>
                    <Button size="sm" className="gap-1 text-xs" onClick={() => navigate("/payments")}>
                      Mark Paid
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
