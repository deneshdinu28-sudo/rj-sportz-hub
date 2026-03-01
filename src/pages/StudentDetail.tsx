import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle, Calendar, IndianRupee, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { findStudentById, formatCurrencyFull } from "@/data/communitiesData";

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const result = findStudentById(id || "");

  if (!result) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <p className="text-muted-foreground">Student not found.</p>
      </div>
    );
  }

  const { student, batch, sport, community } = result;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/communities">Communities</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to={`/communities/${community.id}`}>{community.name}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to={`/communities/${community.id}`}>{sport.icon} {sport.name}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{student.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Student Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-7 w-7 text-primary" /> {student.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {sport.icon} {sport.name} at {community.name} | {batch.startTime} - {batch.endTime} | {batch.ageGroup === "kids" ? "👶 Kids" : "👨 Adults"} | {batch.batchType === "premium" ? "⭐ Premium" : "Standard"}
          </p>
        </div>
        <Badge variant={student.feeStatus === "paid" ? "default" : student.feeStatus === "pending" ? "secondary" : "destructive"} className="text-sm px-3 py-1">
          {student.feeStatus === "paid" ? "✅ Paid" : student.feeStatus === "pending" ? "⚠️ Pending" : "🔴 Overdue"}
        </Badge>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Age</p>
            <p className="text-xl font-bold">{student.age} years</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Monthly Fee</p>
            <p className="text-xl font-bold">{formatCurrencyFull(student.fee)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Valid Till</p>
            <p className="text-xl font-bold">{student.validTill}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Next Due</p>
            <p className="text-xl font-bold">{student.nextDueDate}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Student Details</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Full Name</span><span>{student.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span>{student.age}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Joining Date</span><span>{student.joiningDate}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment Plan</span><span className="capitalize">{student.paymentPlan.replace("_", " ")}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Parent / Guardian</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{student.parentName}</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <a href={`tel:+91${student.phone}`} className="text-primary hover:underline flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {student.phone}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WhatsApp</span>
                  <a href={`https://wa.me/91${student.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" /> {student.whatsapp}
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Enrollment Info</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Community</span><span>{community.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sport</span><span>{sport.icon} {sport.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Batch</span><span>{batch.startTime} - {batch.endTime}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{batch.batchType === "premium" ? "⭐ Premium" : "Standard"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Coach</span><span>{sport.coach}</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: "2026-02-15", amount: student.fee, status: student.feeStatus },
                  { date: "2026-01-15", amount: student.fee, status: "paid" as const },
                ].map((p, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{p.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatCurrencyFull(p.amount)}</span>
                      <Badge variant={p.status === "paid" ? "default" : "destructive"} className="text-[10px]">
                        {p.status === "paid" ? "Paid" : p.status === "pending" ? "Pending" : "Overdue"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Attendance tracking coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>No notes yet. Notes feature coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
