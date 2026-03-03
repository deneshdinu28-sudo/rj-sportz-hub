import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Building2, Users, Trophy, IndianRupee, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { mockCommunities, mockSports, mockStudents, mockPayments, formatCurrency, formatCurrencyFull } from "@/lib/mock-data";
import type { Community } from "@/types/database";

export default function Communities() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteCommunity, setDeleteCommunity] = useState<Community | null>(null);
  const [formData, setFormData] = useState({
    name: "", short_code: "", address: "", contact_person: "", contact_phone: "",
    std_1m: "3500", std_3m: "10000", std_6m: "19000",
    prm_1m: "5000", prm_3m: "14000", prm_6m: "27000",
  });

  const globalStats = useMemo(() => {
    const totalRevenue = mockPayments.reduce((s, p) => s + p.amount, 0);
    return {
      communities: mockCommunities.length,
      sports: mockSports.length,
      students: mockStudents.length,
      revenue: totalRevenue,
    };
  }, []);

  const filtered = useMemo(() => {
    let list = mockCommunities;
    if (statusFilter !== "all") list = list.filter((c) => c.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.short_code.toLowerCase().includes(q) || c.address.toLowerCase().includes(q));
    }
    return list;
  }, [search, statusFilter]);

  const getCommStats = (c: Community) => {
    const students = mockStudents.filter((s) => s.community_id === c.id);
    const sports = mockSports.filter((s) => s.community_id === c.id);
    const payments = mockPayments.filter((p) => students.some((s) => s.id === p.student_id));
    const revenue = payments.reduce((s, p) => s + p.amount, 0);
    const paidPct = students.length ? (students.filter((s) => s.fee_status === "paid").length / students.length) * 100 : 0;
    return { studentCount: students.length, sportCount: sports.length, revenue, paidPct, sports: sports.slice(0, 3) };
  };

  const handleNameChange = (name: string) => {
    const code = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
    setFormData((p) => ({ ...p, name, short_code: code }));
  };

  const handleSave = () => {
    toast({ title: "Community added!", description: formData.name });
    setAddOpen(false);
  };

  const handleDelete = () => {
    toast({ title: "Community deleted", description: deleteCommunity?.name, variant: "destructive" });
    setDeleteCommunity(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Communities Management</h1>
          <p className="text-muted-foreground text-sm">Manage all communities, sports, and students</p>
        </div>
        <Button onClick={() => { setFormData({ name: "", short_code: "", address: "", contact_person: "", contact_phone: "", std_1m: "3500", std_3m: "10000", std_6m: "19000", prm_1m: "5000", prm_3m: "14000", prm_6m: "27000" }); setAddOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Community
        </Button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Building2 className="h-5 w-5 text-primary" />, value: globalStats.communities, label: "Communities" },
          { icon: <Trophy className="h-5 w-5 text-primary" />, value: globalStats.sports, label: "Sports" },
          { icon: <Users className="h-5 w-5 text-primary" />, value: globalStats.students, label: "Students" },
          { icon: <IndianRupee className="h-5 w-5 text-primary" />, value: formatCurrency(globalStats.revenue), label: "Total Revenue" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">{s.icon}</div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search communities..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Community Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((c) => {
          const cs = getCommStats(c);
          const health = cs.paidPct >= 90 ? "🟢" : cs.paidPct >= 70 ? "🟡" : "🔴";
          return (
            <Card
              key={c.id}
              onClick={() => navigate(`/communities/${c.id}`)}
              className="cursor-pointer hover:border-primary/50 transition-all duration-200 hover:shadow-[0_0_15px_hsl(110_100%_55%/0.1)] group"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{c.name}</h3>
                      <span>{health}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {c.short_code} • {c.address}
                    </p>
                  </div>
                  <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: `👥 ${cs.studentCount}`, label: "Students" },
                    { val: `🏐 ${cs.sportCount}`, label: "Sports" },
                    { val: `💰 ${formatCurrency(cs.revenue)}`, label: "Revenue" },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-2 rounded-lg bg-secondary/50">
                      <p className="font-semibold text-sm">{s.val}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate(`/communities/${c.id}`)}>
                  View Details →
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Community Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Add New Community</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Community Name *</Label><Input value={formData.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Waterford" /></div>
            <div><Label>Short Code * (3 letters)</Label><Input value={formData.short_code} onChange={(e) => setFormData((p) => ({ ...p, short_code: e.target.value.toUpperCase().slice(0, 3) }))} placeholder="WTF" maxLength={3} /></div>
            <div><Label>Address *</Label><Input value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} placeholder="HSR Layout, Bangalore" /></div>
            <div><Label>Contact Person</Label><Input value={formData.contact_person} onChange={(e) => setFormData((p) => ({ ...p, contact_person: e.target.value }))} placeholder="Mr. Sharma" /></div>
            <div><Label>Contact Phone</Label><Input value={formData.contact_phone} onChange={(e) => setFormData((p) => ({ ...p, contact_phone: e.target.value }))} placeholder="+91 9876543210" /></div>
            <div className="border-t border-border pt-4">
              <p className="text-sm font-semibold mb-3">Pricing Structure</p>
              <p className="text-xs text-muted-foreground mb-2">Standard Batch:</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div><Label className="text-xs">1 Month</Label><Input value={formData.std_1m} onChange={(e) => setFormData((p) => ({ ...p, std_1m: e.target.value }))} type="number" /></div>
                <div><Label className="text-xs">3 Months</Label><Input value={formData.std_3m} onChange={(e) => setFormData((p) => ({ ...p, std_3m: e.target.value }))} type="number" /></div>
                <div><Label className="text-xs">6 Months</Label><Input value={formData.std_6m} onChange={(e) => setFormData((p) => ({ ...p, std_6m: e.target.value }))} type="number" /></div>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Premium Batch:</p>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">1 Month</Label><Input value={formData.prm_1m} onChange={(e) => setFormData((p) => ({ ...p, prm_1m: e.target.value }))} type="number" /></div>
                <div><Label className="text-xs">3 Months</Label><Input value={formData.prm_3m} onChange={(e) => setFormData((p) => ({ ...p, prm_3m: e.target.value }))} type="number" /></div>
                <div><Label className="text-xs">6 Months</Label><Input value={formData.prm_6m} onChange={(e) => setFormData((p) => ({ ...p, prm_6m: e.target.value }))} type="number" /></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save →</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCommunity} onOpenChange={(v) => { if (!v) setDeleteCommunity(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteCommunity?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This will remove all sports and students. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
