import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { mockSports, getTotalStudents, getTotalRevenue, type Sport } from "@/data/sportsData";

const Sports = () => {
  const navigate = useNavigate();
  const [sports, setSports] = useState<Sport[]>(mockSports);
  const [search, setSearch] = useState("");
  const [communityFilter, setCommunityFilter] = useState("all");

  // Modal states
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "", icon: "🏸", community: "", coach: "", standardFee: "", premiumFee: "",
  });

  const communities = [...new Set(sports.map((s) => s.community))];

  const filtered = sports.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.community.toLowerCase().includes(search.toLowerCase());
    const matchesCommunity = communityFilter === "all" || s.community === communityFilter;
    return matchesSearch && matchesCommunity;
  });

  const openEdit = (sport: Sport, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSport(sport);
    setFormData({
      name: sport.name, icon: sport.icon, community: sport.community,
      coach: sport.coach, standardFee: String(sport.standardFee), premiumFee: String(sport.premiumFee),
    });
    setEditOpen(true);
  };

  const openDelete = (sport: Sport, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSport(sport);
    setDeleteOpen(true);
  };

  const openAdd = () => {
    setFormData({ name: "", icon: "🏸", community: "", coach: "", standardFee: "", premiumFee: "" });
    setAddOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedSport) return;
    setSports((prev) =>
      prev.map((s) =>
        s.id === selectedSport.id
          ? { ...s, name: formData.name, icon: formData.icon, community: formData.community, coach: formData.coach, standardFee: Number(formData.standardFee), premiumFee: Number(formData.premiumFee) }
          : s
      )
    );
    setEditOpen(false);
    toast({ title: "Sport Updated", description: `${formData.name} has been updated successfully.` });
  };

  const handleDelete = () => {
    if (!selectedSport) return;
    setSports((prev) => prev.filter((s) => s.id !== selectedSport.id));
    setDeleteOpen(false);
    toast({ title: "Sport Deleted", description: `${selectedSport.name} has been removed.`, variant: "destructive" });
  };

  const handleAdd = () => {
    const newSport: Sport = {
      id: `sp-${Date.now()}`, name: formData.name, icon: formData.icon,
      community: formData.community, communityId: `c-${Date.now()}`,
      coach: formData.coach, coachId: `co-${Date.now()}`,
      standardFee: Number(formData.standardFee), premiumFee: Number(formData.premiumFee),
      batches: [],
    };
    setSports((prev) => [...prev, newSport]);
    setAddOpen(false);
    toast({ title: "Sport Added", description: `${formData.name} has been added successfully.` });
  };

  const SportForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Icon</Label>
          <Input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="🏸" className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label>Sport Name</Label>
          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Badminton" className="bg-secondary border-border" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Community</Label>
        <Input value={formData.community} onChange={(e) => setFormData({ ...formData, community: e.target.value })} placeholder="Sunshine Apartments" className="bg-secondary border-border" />
      </div>
      <div className="space-y-2">
        <Label>Coach</Label>
        <Input value={formData.coach} onChange={(e) => setFormData({ ...formData, coach: e.target.value })} placeholder="Coach name" className="bg-secondary border-border" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Standard Fee (₹)</Label>
          <Input type="number" value={formData.standardFee} onChange={(e) => setFormData({ ...formData, standardFee: e.target.value })} placeholder="1500" className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label>Premium Fee (₹)</Label>
          <Input type="number" value={formData.premiumFee} onChange={(e) => setFormData({ ...formData, premiumFee: e.target.value })} placeholder="2500" className="bg-secondary border-border" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sports</h1>
          <p className="text-muted-foreground">Manage sports categories across communities</p>
        </div>
        <Button onClick={openAdd} className="gap-2 neon-glow">
          <Plus className="h-4 w-4" /> Add Sport
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search sports..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
        </div>
        <Select value={communityFilter} onValueChange={setCommunityFilter}>
          <SelectTrigger className="w-full sm:w-[220px] bg-secondary border-border">
            <SelectValue placeholder="All Communities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Communities</SelectItem>
            {communities.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead>Sport</TableHead>
              <TableHead className="hidden sm:table-cell">Community</TableHead>
              <TableHead className="hidden md:table-cell">Coach</TableHead>
              <TableHead className="hidden lg:table-cell">Batches</TableHead>
              <TableHead className="text-right">Students</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Std / Prem Fee</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Revenue</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((sport) => {
              const totalStudents = getTotalStudents(sport);
              const totalRevenue = getTotalRevenue(sport);
              return (
                <TableRow
                  key={sport.id}
                  className="cursor-pointer border-border transition-colors hover:bg-secondary/60"
                  onClick={() => navigate(`/sports/${sport.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      <span className="text-xl">{sport.icon}</span>
                      <span>{sport.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{sport.community}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{sport.coach}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="secondary" className="font-mono">{sport.batches.length} batches</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{totalStudents}</TableCell>
                  <TableCell className="hidden lg:table-cell text-right text-muted-foreground">
                    ₹{sport.standardFee.toLocaleString()} / ₹{sport.premiumFee.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell font-semibold text-primary neon-text">
                    ₹{totalRevenue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={(e) => openEdit(sport, e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={(e) => openDelete(sport, e)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No sports found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Sport</DialogTitle>
            <DialogDescription>Update the sport details below.</DialogDescription>
          </DialogHeader>
          <SportForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} className="neon-glow">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add New Sport</DialogTitle>
            <DialogDescription>Fill in the details for the new sport.</DialogDescription>
          </DialogHeader>
          <SportForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} className="neon-glow">Add Sport</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedSport?.name} from {selectedSport?.community}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all students enrolled in this sport. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Sports;
