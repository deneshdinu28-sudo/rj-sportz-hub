import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { mockCommunities, formatCurrencyFull } from "@/lib/mock-data";
import type { Community } from "@/types/database";

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [editPricing, setEditPricing] = useState<Community | null>(null);
  const [pricingForm, setPricingForm] = useState({
    std_1m: "", std_3m: "", std_6m: "", prm_1m: "", prm_3m: "", prm_6m: "",
  });

  const openEditPricing = (c: Community) => {
    setPricingForm({
      std_1m: String(c.pricing.standard["1m"]),
      std_3m: String(c.pricing.standard["3m"]),
      std_6m: String(c.pricing.standard["6m"]),
      prm_1m: String(c.pricing.premium["1m"]),
      prm_3m: String(c.pricing.premium["3m"]),
      prm_6m: String(c.pricing.premium["6m"]),
    });
    setEditPricing(c);
  };

  const handleSavePricing = () => {
    toast({ title: "Pricing updated!", description: editPricing?.name });
    setEditPricing(null);
  };

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
            {mockCommunities.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{c.name} ({c.short_code})</p>
                    <p className="text-xs text-muted-foreground">
                      Standard: {formatCurrencyFull(c.pricing.standard["1m"])}/mo | Premium: {formatCurrencyFull(c.pricing.premium["1m"])}/mo
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEditPricing(c)}>Edit Pricing</Button>
                </CardContent>
              </Card>
            ))}
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
              <p>Version: 1.0.0</p>
              <p>Database: Connected (Lovable Cloud)</p>
              <p>Auth: Supabase Auth</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Pricing Modal */}
      <Dialog open={!!editPricing} onOpenChange={(v) => { if (!v) setEditPricing(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Pricing - {editPricing?.name}</DialogTitle>
          </DialogHeader>
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
            <Button variant="outline" onClick={() => setEditPricing(null)}>Cancel</Button>
            <Button onClick={handleSavePricing}>Update →</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
