import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { formatCurrencyFull } from "@/data/communitiesData";

const daysList = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  open: boolean;
  onClose: () => void;
  sportName: string;
  standardFee: number;
  premiumFee: number;
}

export function AddBatchModal({ open, onClose, sportName, standardFee, premiumFee }: Props) {
  const { toast } = useToast();
  const [batchStart, setBatchStart] = useState("");
  const [batchEnd, setBatchEnd] = useState("");
  const [days, setDays] = useState<string[]>(["Mon", "Wed", "Fri"]);
  const [ageGroup, setAgeGroup] = useState<"kids" | "adults">("kids");
  const [batchType, setBatchType] = useState<"standard" | "premium">("standard");
  const [maxStudents, setMaxStudents] = useState("30");

  const toggleDay = (d: string) => {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const handleSave = () => {
    if (!batchStart || !batchEnd || days.length === 0) {
      toast({ title: "Please fill time and days", variant: "destructive" });
      return;
    }
    toast({ title: "Batch added!", description: `New batch added to ${sportName}` });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Batch to {sportName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Time *</Label><Input type="time" value={batchStart} onChange={e => setBatchStart(e.target.value)} /></div>
            <div><Label>End Time *</Label><Input type="time" value={batchEnd} onChange={e => setBatchEnd(e.target.value)} /></div>
          </div>

          <div>
            <Label>Days *</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {daysList.map(d => (
                <label key={d} className="flex items-center gap-1.5 text-sm">
                  <Checkbox checked={days.includes(d)} onCheckedChange={() => toggleDay(d)} />
                  {d}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Age Group *</Label>
            <RadioGroup value={ageGroup} onValueChange={v => setAgeGroup(v as "kids" | "adults")} className="flex gap-4 mt-1">
              <div className="flex items-center gap-2"><RadioGroupItem value="kids" id="bk" /><Label htmlFor="bk">Kids</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="adults" id="ba" /><Label htmlFor="ba">Adults</Label></div>
            </RadioGroup>
          </div>

          <div>
            <Label>Batch Type *</Label>
            <RadioGroup value={batchType} onValueChange={v => setBatchType(v as "standard" | "premium")} className="flex gap-4 mt-1">
              <div className="flex items-center gap-2"><RadioGroupItem value="standard" id="bs" /><Label htmlFor="bs">Standard - {formatCurrencyFull(standardFee)}/mo</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="premium" id="bp" /><Label htmlFor="bp">Premium - {formatCurrencyFull(premiumFee)}/mo</Label></div>
            </RadioGroup>
          </div>

          <div><Label>Max Students</Label><Input value={maxStudents} onChange={e => setMaxStudents(e.target.value)} type="number" placeholder="Optional" /></div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Batch</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
