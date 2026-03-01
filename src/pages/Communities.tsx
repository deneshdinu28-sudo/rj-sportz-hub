import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, MapPin, Phone, Building2, Trophy, Users, IndianRupee, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  mockCommunities,
  getCommunityStudentCount,
  getCommunityRevenue,
  getGlobalStats,
  formatCurrency,
  getPaymentHealth,
  getSportStudentCount,
  getSportRevenue,
  type Community,
} from "@/data/communitiesData";

export default function Communities() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editCommunity, setEditCommunity] = useState<Community | null>(null);
  const [deleteCommunity, setDeleteCommunity] = useState<Community | null>(null);
  const [formData, setFormData] = useState({ name: "", location: "", contactPerson: "", contactPhone: "" });

  const stats = useMemo(() => getGlobalStats(), []);

  const filtered = useMemo(() => {
    let list = mockCommunities;
    if (statusFilter !== "all") list = list.filter(c => c.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.sports.some(s => s.name.toLowerCase().includes(q)) ||
        c.sports.some(s => s.batches.some(b => b.students.some(st => st.name.toLowerCase().includes(q))))
      );
    }
    return list;
  }, [search, statusFilter]);

  // Search results grouped
  const searchResults = useMemo(() => {
    if (!search || search.length < 2) return null;
    const q = search.toLowerCase();
    const communities = mockCommunities.filter(c => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q));
    const sports: { name: string; icon: string; community: string; communityId: string }[] = [];
    const students: { name: string; sport: string; community: string; studentId: string; communityId: string }[] = [];
    for (const c of mockCommunities) {
      for (const s of c.sports) {
        if (s.name.toLowerCase().includes(q)) sports.push({ name: s.name, icon: s.icon, community: c.name, communityId: c.id });
        for (const b of s.batches) {
          for (const st of b.students) {
            if (st.name.toLowerCase().includes(q)) students.push({ name: st.name, sport: s.name, community: c.name, studentId: st.id, communityId: c.id });
          }
        }
      }
    }
    if (!communities.length && !sports.length && !students.length) return null;
    return { communities: communities.slice(0, 3), sports: sports.slice(0, 5), students: students.slice(0, 5) };
  }, [search]);

  const openAdd = () => {
    setFormData({ name: "", location: "", contactPerson: "", contactPhone: "" });
    setAddOpen(true);
  };

  const openEdit = (c: Community) => {
    setFormData({ name: c.name, location: c.location, contactPerson: c.contactPerson, contactPhone: c.contactPhone });
    setEditCommunity(c);
  };

  const handleSave = () => {
    toast({ title: editCommunity ? "Community updated!" : "Community added!", description: formData.name });
    setAddOpen(false);
    setEditCommunity(null);
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
          <p className="text-muted-foreground">Manage all communities, sports, and students</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add Community
        </Button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <MapPin className="h-5 w-5 text-primary" />, value: stats.communities, label: "Communities" },
          { icon: <Trophy className="h-5 w-5 text-primary" />, value: stats.sports, label: "Sports" },
          { icon: <Users className="h-5 w-5 text-primary" />, value: stats.students, label: "Students" },
          { icon: <IndianRupee className="h-5 w-5 text-primary" />, value: formatCurrency(stats.revenue), label: "Total Revenue" },
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
      <div className="flex flex-col sm:flex-row gap-3 relative">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search communities, sports, or students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          {/* Search dropdown */}
          {searchResults && (
            <Card className="absolute z-50 top-12 left-0 right-0 max-h-80 overflow-auto">
              <CardContent className="p-3 space-y-3">
                {searchResults.communities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">COMMUNITIES ({searchResults.communities.length})</p>
                    {searchResults.communities.map(c => (
                      <button key={c.id} onClick={() => { navigate(`/communities/${c.id}`); setSearch(""); }} className="block w-full text-left px-2 py-1.5 rounded hover:bg-accent text-sm">
                        🏢 {c.name}
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.sports.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">SPORTS ({searchResults.sports.length})</p>
                    {searchResults.sports.map((s, i) => (
                      <button key={i} onClick={() => { navigate(`/communities/${s.communityId}`); setSearch(""); }} className="block w-full text-left px-2 py-1.5 rounded hover:bg-accent text-sm">
                        {s.icon} {s.name} at {s.community}
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.students.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">STUDENTS ({searchResults.students.length})</p>
                    {searchResults.students.map((s, i) => (
                      <button key={i} onClick={() => { navigate(`/students/${s.studentId}`); setSearch(""); }} className="block w-full text-left px-2 py-1.5 rounded hover:bg-accent text-sm">
                        👤 {s.name} ({s.sport}, {s.community})
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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
        {filtered.map(c => {
          const studentCount = getCommunityStudentCount(c);
          const revenue = getCommunityRevenue(c);
          const totalStudents = studentCount || 1;
          const paidCount = c.sports.reduce((sum, s) => sum + s.batches.reduce((bs, b) => bs + b.students.filter(st => st.feeStatus === "paid").length, 0), 0);
          const paidPercent = (paidCount / totalStudents) * 100;
          const health = getPaymentHealth(paidPercent);
          const healthEmoji = health === "good" ? "🟢" : health === "attention" ? "🟡" : "🔴";

          return (
            <Card key={c.id} onClick={() => navigate(`/communities/${c.id}`)} className="cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_15px_hsl(110_100%_55%/0.15)] group">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{c.name}</h3>
                      <span>{healthEmoji}</span>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" /> {c.location}
                    </p>
                  </div>
                  <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: "🏐", val: c.sports.length, label: "Sports" },
                    { icon: "👥", val: studentCount, label: "Students" },
                    { icon: "💰", val: formatCurrency(revenue), label: "Revenue" },
                    { icon: "📞", val: c.contactPhone.slice(-4), label: "Contact" },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-2 rounded-lg bg-secondary/50">
                      <p className="text-xs">{s.icon}</p>
                      <p className="font-semibold text-sm">{s.val}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold">Top Sports:</p>
                  {c.sports.slice(0, 3).map(s => (
                    <div key={s.id} className="flex justify-between text-sm">
                      <span>{s.icon} {s.name} ({getSportStudentCount(s)} students)</span>
                      <span className="text-muted-foreground">{formatCurrency(getSportRevenue(s))}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => navigate(`/communities/${c.id}`)}>
                    View Details →
                  </Button>
                  <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); openEdit(c); }}>Edit</Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={e => { e.stopPropagation(); setDeleteCommunity(c); }}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={addOpen || !!editCommunity} onOpenChange={v => { if (!v) { setAddOpen(false); setEditCommunity(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCommunity ? "Edit Community" : "Add Community"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Community Name *</Label><Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Sunshine Apartments" /></div>
            <div><Label>Location *</Label><Input value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="e.g. HSR Layout, Bangalore" /></div>
            <div><Label>Contact Person *</Label><Input value={formData.contactPerson} onChange={e => setFormData(p => ({ ...p, contactPerson: e.target.value }))} placeholder="e.g. Mr. Sharma" /></div>
            <div><Label>Contact Phone *</Label><Input value={formData.contactPhone} onChange={e => setFormData(p => ({ ...p, contactPhone: e.target.value }))} placeholder="9876543210" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setEditCommunity(null); }}>Cancel</Button>
            <Button onClick={handleSave}>{editCommunity ? "Update" : "Save Community"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCommunity} onOpenChange={v => { if (!v) setDeleteCommunity(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteCommunity?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This will remove all sports, batches, and students in this community. This action cannot be undone.</AlertDialogDescription>
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
