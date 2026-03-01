import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { formatCurrencyFull, type Community, type Sport, type Batch } from "@/data/communitiesData";
import { addDays, format } from "date-fns";

interface Props {
  open: boolean;
  onClose: () => void;
  community: Community;
  sport: Sport;
  batch: Batch | null;
}

export function AddStudentModal({ open, onClose, community, sport, batch }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [syncWa, setSyncWa] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(batch?.id || "");
  const [ageGroup, setAgeGroup] = useState<"kids" | "adults">(batch?.ageGroup || "kids");
  const [batchType, setBatchType] = useState<"standard" | "premium">(batch?.batchType || "standard");
  const [paymentPlan, setPaymentPlan] = useState("monthly");
  const [joiningDate, setJoiningDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentStatus, setPaymentStatus] = useState("later");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fee = batchType === "premium" ? sport.premiumFee : sport.standardFee;
  const planMultiplier = paymentPlan === "monthly" ? 1 : paymentPlan === "two_months" ? 2 : paymentPlan === "three_months" ? 3 : 6;
  const totalAmount = fee * planMultiplier;
  const planDays = planMultiplier * 30;

  const validPeriod = useMemo(() => {
    const start = new Date(joiningDate);
    const end = addDays(start, planDays - 1);
    const nextDue = addDays(start, planDays);
    return {
      start: format(start, "dd MMM yyyy"),
      end: format(end, "dd MMM yyyy"),
      nextDue: format(nextDue, "dd MMM yyyy"),
    };
  }, [joiningDate, planDays]);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (syncWa) setWhatsapp(val);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Required";
    if (!age || Number(age) < 5 || Number(age) > 50) e.age = "Age must be 5-50";
    if (!parentName.trim()) e.parentName = "Required";
    if (!phone || phone.length !== 10) e.phone = "Must be 10 digits";
    if (!whatsapp || whatsapp.length !== 10) e.whatsapp = "Must be 10 digits";
    if (!selectedBatch && !batch) e.batch = "Select a batch";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    toast({ title: "Student added!", description: `Welcome message sent to parent via WhatsApp.` });
    if (paymentStatus === "paid") {
      toast({ title: "Payment recorded", description: formatCurrencyFull(totalAmount) });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Student to {sport.icon} {sport.name} - {community.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Student Details */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">STUDENT DETAILS</p>
            <div>
              <Label>Student Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label>Age *</Label>
              <Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 12" min={5} max={50} />
              {errors.age && <p className="text-xs text-destructive mt-1">{errors.age}</p>}
            </div>
          </div>

          {/* Parent Details */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">PARENT DETAILS</p>
            <div>
              <Label>Parent Name *</Label>
              <Input value={parentName} onChange={e => setParentName(e.target.value)} placeholder="Parent/Guardian name" />
              {errors.parentName && <p className="text-xs text-destructive mt-1">{errors.parentName}</p>}
            </div>
            <div>
              <Label>Phone Number *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">+91</span>
                <Input value={phone} onChange={e => handlePhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" />
              </div>
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>
            <div>
              <Label>WhatsApp Number *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">+91</span>
                <Input value={whatsapp} onChange={e => { setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10)); setSyncWa(false); }} placeholder="Auto-fill from phone" />
              </div>
              {errors.whatsapp && <p className="text-xs text-destructive mt-1">{errors.whatsapp}</p>}
            </div>
          </div>

          {/* Batch Selection */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">BATCH SELECTION</p>
            {batch ? (
              <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                <p>⏰ {batch.startTime} - {batch.endTime} | {batch.ageGroup === "kids" ? "👶 Kids" : "👨 Adults"} | {batch.batchType === "premium" ? "⭐ Premium" : "Standard"}</p>
              </div>
            ) : (
              <>
                <div>
                  <Label>Batch Time *</Label>
                  <Select value={selectedBatch} onValueChange={v => {
                    setSelectedBatch(v);
                    const b = sport.batches.find(x => x.id === v);
                    if (b) { setAgeGroup(b.ageGroup); setBatchType(b.batchType); }
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                    <SelectContent>
                      {sport.batches.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.startTime} - {b.endTime} ({b.ageGroup}, {b.batchType})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.batch && <p className="text-xs text-destructive mt-1">{errors.batch}</p>}
                </div>
              </>
            )}

            <div>
              <Label>Age Group *</Label>
              <RadioGroup value={ageGroup} onValueChange={v => setAgeGroup(v as "kids" | "adults")} className="flex gap-4 mt-1" disabled={!!batch}>
                <div className="flex items-center gap-2"><RadioGroupItem value="kids" id="kids" /><Label htmlFor="kids">Kids</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="adults" id="adults" /><Label htmlFor="adults">Adults</Label></div>
              </RadioGroup>
            </div>

            <div>
              <Label>Batch Type *</Label>
              <RadioGroup value={batchType} onValueChange={v => setBatchType(v as "standard" | "premium")} className="flex gap-4 mt-1" disabled={!!batch}>
                <div className="flex items-center gap-2"><RadioGroupItem value="standard" id="std" /><Label htmlFor="std">Standard - {formatCurrencyFull(sport.standardFee)}/mo</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="premium" id="prem" /><Label htmlFor="prem">Premium - {formatCurrencyFull(sport.premiumFee)}/mo</Label></div>
              </RadioGroup>
            </div>
          </div>

          {/* Payment */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">PAYMENT PLAN *</p>
            <RadioGroup value={paymentPlan} onValueChange={setPaymentPlan} className="space-y-2">
              {[
                { value: "monthly", label: `Per Month (${formatCurrencyFull(fee)})` },
                { value: "two_months", label: `Two Months (${formatCurrencyFull(fee * 2)})` },
                { value: "three_months", label: `Three Months (${formatCurrencyFull(fee * 3)})` },
                { value: "six_months", label: `Six Months (${formatCurrencyFull(fee * 6)})` },
              ].map(p => (
                <div key={p.value} className="flex items-center gap-2">
                  <RadioGroupItem value={p.value} id={p.value} />
                  <Label htmlFor={p.value}>{p.label}</Label>
                </div>
              ))}
            </RadioGroup>

            <div>
              <Label>Joining Date *</Label>
              <Input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} />
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 rounded-lg bg-secondary/50 space-y-1 text-sm">
            <p className="font-semibold">Summary:</p>
            <p>• Valid Period: {validPeriod.start} - {validPeriod.end}</p>
            <p>• Next Due Date: {validPeriod.nextDue}</p>
            <p>• Total Amount: {formatCurrencyFull(totalAmount)}</p>
          </div>

          {/* Payment Status */}
          <div>
            <Label>First Payment Status</Label>
            <RadioGroup value={paymentStatus} onValueChange={setPaymentStatus} className="flex gap-4 mt-1">
              <div className="flex items-center gap-2"><RadioGroupItem value="paid" id="paid" /><Label htmlFor="paid">Already Paid</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="later" id="later" /><Label htmlFor="later">Will Pay Later</Label></div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Student</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
