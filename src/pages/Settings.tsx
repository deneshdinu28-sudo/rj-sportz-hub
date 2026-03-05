import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunities, useSportPricing, formatCurrencyFull } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: communities = [], isLoading } = useCommunities();
  const { data: allPricing = [] } = useSportPricing();

  const [editPricingId, setEditPricingId] = useState<string | null>(null);
  const [pricingForm, setPricingForm] = useState({
    std_1m: "", std_3m: "", std_6m: "", prm_1m: "", prm_3m: "", prm_6m: "",
  });
  const [saving, setSaving] = useState(false);

  const editCommunity = communities.find((c) => c.id === editPricingId);
  const commPricing = allPricing.filter((p) => p.community_id === editPricingId);

  const openEditPricing = (communityId: string) => {
    const pricing = allPricing.find((p) => p.community_id === communityId);
    if (pricing) {
      setPricingForm({
        std_1m: String(pricing.standard_1month),
        std_3m: String(pricing.standard_3months),
        std_6m: String(pricing.standard_6months),
        prm_1m: String(pricing.premium_1month),
        prm_3m: String(pricing.premium_3months),
        prm_6m: String(pricing.premium_6months),
      });
    }
    setEditPricingId(communityId);
  };

  const handleSavePricing = async () => {
    if (!editPricingId) return;
    setSaving(true);
    try {
      const pricingRecords = allPricing.filter((p) => p.community_id === editPricingId);
      for (const pr of pricingRecords) {
        await supabase.from("sport_pricing").update({
          standard_1month: Number(pricingForm.std_1m),
          standard_3months: Number(pricingForm.std_3m),
          standard_6months: Number(pricingForm.std_6m),
          premium_1month: Number(pricingForm.prm_1m),
          premium_3months: Number(pricingForm.prm_3m),
          premium_6months: Number(pricingForm.prm_6m),
        }).eq("id", pr.id);
      }
      toast({ title: "Pricing updated!" });
      setEditPricingId(null);
    } catch {
      toast({ title: "Failed to update pricing", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="communities">Communities</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Admin Profile</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
              <div><Label>Role</Label><Input value="Admin" disabled /></div>
              <Button variant="outline" size="sm">Change Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communities" className="mt-4">
          <div className="space-y-3">
            {communities.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No communities yet</p>
            ) : (
              communities.map((c) => {
                const pricing = allPricing.find((p) => p.community_id === c.id);
                return (
                  <Card key={c.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{c.name} ({c.short_code})</p>
                        {pricing ? (
                          <p className="text-xs text-muted-foreground">
                            Standard: {formatCurrencyFull(Number(pricing.standard_1month))}/mo | Premium: {formatCurrencyFull(Number(pricing.premium_1month))}/mo
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">No pricing set</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openEditPricing(c.id)}>Edit Pricing</Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">WhatsApp Integration</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>WhatsApp Business Number</Label><Input placeholder="+91 9876543210" /></div>
              <div><Label>API Key (Wati)</Label><Input placeholder="Enter API key" type="password" /></div>
              <Button variant="outline" size="sm">Test Message</Button>
              <p className="text-xs text-muted-foreground">Connect your Wati account to enable WhatsApp reminders and payment verification.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">System Settings</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Version: 2.0.0</p>
              <p>Database: Connected (Lovable Cloud)</p>
              <p>Auth: Active</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Pricing Modal */}
      <Dialog open={!!editPricingId} onOpenChange={(v) => { if (!v) setEditPricingId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Pricing - {editCommunity?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">Standard Batch</p>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">1 Month</Label><Input type="number" value={pricingForm.std_1m} onChange={(e) => setPricingForm((p) => ({ ...p, std_1m: e.target.value }))} /></div>
                <div><Label className="text-xs">3 Months</Label><Input type="number" value={pricingForm.std_3m} onChange={(e) => setPricingForm((p) => ({ ...p, std_3m: e.target.value }))} /></div>
                <div><Label className="text-xs">6 Months</Label><Input type="number" value={pricingForm.std_6m} onChange={(e) => setPricingForm((p) => ({ ...p, std_6m: e.target.value }))} /></div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Premium Batch</p>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">1 Month</Label><Input type="number" value={pricingForm.prm_1m} onChange={(e) => setPricingForm((p) => ({ ...p, prm_1m: e.target.value }))} /></div>
                <div><Label className="text-xs">3 Months</Label><Input type="number" value={pricingForm.prm_3m} onChange={(e) => setPricingForm((p) => ({ ...p, prm_3m: e.target.value }))} /></div>
                <div><Label className="text-xs">6 Months</Label><Input type="number" value={pricingForm.prm_6m} onChange={(e) => setPricingForm((p) => ({ ...p, prm_6m: e.target.value }))} /></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPricingId(null)}>Cancel</Button>
            <Button onClick={handleSavePricing} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...</> : "Update →"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
