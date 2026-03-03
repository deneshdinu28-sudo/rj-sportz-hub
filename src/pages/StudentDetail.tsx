import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockStudents, mockCommunities, mockSports, mockPayments, formatCurrencyFull } from "@/lib/mock-data";

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const student = mockStudents.find((s) => s.id === id);
  if (!student) return <div className="p-6">Student not found</div>;

  const community = mockCommunities.find((c) => c.id === student.community_id);
  const sport = mockSports.find((s) => s.id === student.sport_id);
  const studentPayments = mockPayments.filter((p) => p.student_id === student.id);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3 flex-wrap">
          <button onClick={() => navigate("/communities")} className="hover:text-primary">Communities</button>
          <span>›</span>
          <button onClick={() => navigate(`/communities/${community?.id}`)} className="hover:text-primary">{community?.name}</button>
          <span>›</span>
          <span className="text-foreground">{student.name}</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <p className="text-muted-foreground text-sm font-mono">{student.student_id}</p>
          </div>
          <Badge variant={student.fee_status === "paid" ? "default" : student.fee_status === "pending" ? "secondary" : "destructive"}>
            {student.fee_status === "paid" ? "✅ Paid" : student.fee_status === "pending" ? "⚠️ Pending" : "🔴 Overdue"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Student Info</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span>{student.age}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Community</span><span>{community?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sport</span><span>{sport?.icon} {sport?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Batch</span><span>{student.batch_time} • {student.age_group} • {student.batch_type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Joining Date</span><span>{student.joining_date}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Parent / Contact</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Parent</span><span>{student.parent_name}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">WhatsApp</span>
                  <div className="flex items-center gap-2">
                    <a href={`tel:+91${student.parent_whatsapp}`} className="text-primary hover:underline">{student.parent_whatsapp}</a>
                    <a href={`https://wa.me/91${student.parent_whatsapp}`} target="_blank" className="text-primary"><MessageSquare className="h-3.5 w-3.5" /></a>
                  </div>
                </div>
                {student.parent_phone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><a href={`tel:+91${student.parent_phone}`} className="text-primary hover:underline">{student.parent_phone}</a></div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Payment Info</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span>{student.batch_type} • {student.payment_plan === "1m" ? "1 Month" : student.payment_plan === "3m" ? "3 Months" : "6 Months"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{formatCurrencyFull(student.fee_amount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Period</span><span>{student.payment_start_date} → {student.payment_end_date}</span></div>
                {student.next_due_date && <div className="flex justify-between"><span className="text-muted-foreground">Next Due</span><span className="text-warning">{student.next_due_date}</span></div>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {studentPayments.length > 0 ? (
                <div className="space-y-2">
                  {studentPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-sm">
                      <div>
                        <p className="font-medium">{formatCurrencyFull(p.amount)}</p>
                        <p className="text-xs text-muted-foreground">{p.payment_date} • {p.payment_mode}</p>
                      </div>
                      <Badge variant="default" className="text-xs">✅ Verified ({p.verification_method})</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No payment records</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
