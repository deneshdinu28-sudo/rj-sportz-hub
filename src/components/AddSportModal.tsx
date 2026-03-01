import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const sportOptions = ["Badminton", "Swimming", "Cricket", "Tennis", "Yoga", "Karate", "Football", "Basketball", "Table Tennis", "Skating", "Chess", "Gymnastics", "Custom"];
const coachOptions = ["Rajesh Kumar", "Sunita Rao", "Vikas Patil", "Priya Menon", "Arjun Desai", "Meera Nair", "Ramesh Tiwari", "Anita Sharma"];
const daysList = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  open: boolean;
  onClose: () => void;
  communityName: string;
}

export function AddSportModal({ open, onClose, communityName }: Props) {
  const { toast } = useToast();
  const [sport, setSport] = useState("");
  const [customSport, setCustomSport] = useState("");
  const [coach, setCoach] = useState("");
  const [stdFee, setStdFee] = useState("1500");
  const [premFee, setPremFee] = useState("2500");
  const [batchStart, setBatchStart] = useState("");
  const [batchEnd, setBatchEnd] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [ageGroup, setAgeGroup] = useState<"kids" | "adults">("kids");
  const [batchType, setBatchType] = useState<"standard" | "premium">("standard");
  const [maxStudents, setMaxStudents] = useState("");

  const toggleDay = (d: string) => {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const handleSave = () => {
    const name = sport === "Custom" ? customSport : sport;
    if (!name || !coach || !stdFee || !premFee) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    toast({ title: "Sport added!", description: `${name} added to ${communityName}` });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Sport to {communityName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Sport *</Label>
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger><SelectValue placeholder="Select Sport" /></SelectTrigger>
              <SelectContent>
                {sportOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {sport === "Custom" && (
              <Input className="mt-2" value={customSport} onChange={e => setCustomSport(e.target.value)} placeholder="Enter sport name" />
            )}
          </div>

          <div>
            <Label>Assign Coach *</Label>
            <Select value={coach} onValueChange={setCoach}>
              <SelectTrigger><SelectValue placeholder="Select Coach" /></SelectTrigger>
              <SelectContent>
                {coachOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Standard Batch Fee *</Label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">₹</span>
                <Input value={stdFee} onChange={e => setStdFee(e.target.value)} type="number" />
              </div>
            </div>
            <div>
              <Label>Premium Batch Fee *</Label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">₹</span>
                <Input value={premFee} onChange={e => setPremFee(e.target.value)} type="number" />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-semibold text-muted-foreground">INITIAL BATCH (Optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Time</Label><Input type="time" value={batchStart} onChange={e => setBatchStart(e.target.value)} /></div>
              <div><Label>End Time</Label><Input type="time" value={batchEnd} onChange={e => setBatchEnd(e.target.value)} /></div>
            </div>
            <div>
              <Label>Days</Label>
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
              <Label>Age Group</Label>
              <RadioGroup value={ageGroup} onValueChange={v => setAgeGroup(v as "kids" | "adults")} className="flex gap-4 mt-1">
                <div className="flex items-center gap-2"><RadioGroupItem value="kids" id="s-kids" /><Label htmlFor="s-kids">Kids</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="adults" id="s-adults" /><Label htmlFor="s-adults">Adults</Label></div>
              </RadioGroup>
            </div>
            <div>
              <Label>Batch Type</Label>
              <RadioGroup value={batchType} onValueChange={v => setBatchType(v as "standard" | "premium")} className="flex gap-4 mt-1">
                <div className="flex items-center gap-2"><RadioGroupItem value="standard" id="s-std" /><Label htmlFor="s-std">Standard</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="premium" id="s-prem" /><Label htmlFor="s-prem">Premium</Label></div>
              </RadioGroup>
            </div>
            <div><Label>Max Students</Label><Input value={maxStudents} onChange={e => setMaxStudents(e.target.value)} type="number" placeholder="Optional" /></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Sport</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
