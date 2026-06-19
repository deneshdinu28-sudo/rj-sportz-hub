import { Plus, Trash2, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PricingType = "duration_based" | "custom_monthly" | "session_pack";
export type RenewalTrigger = "date_based" | "session_based";

export interface PackEntry {
  pack_name: string;
  session_count: string;
  standard_price: string;
  premium_price: string;
}

export interface PricingConfig {
  pricing_type: PricingType;
  renewal_trigger: RenewalTrigger;
  // duration_based
  standard_1month: string;
  standard_3months: string;
  standard_6months: string;
  premium_1month: string;
  premium_3months: string;
  premium_6months: string;
  sessions_per_month: string;
  // custom_monthly
  custom_monthly_price: string;
  custom_monthly_sessions: string;
  // session_pack
  packs: PackEntry[];
  renewal_days: string;
}

export const defaultPricingConfig = (): PricingConfig => ({
  pricing_type: "duration_based",
  renewal_trigger: "date_based",
  standard_1month: "3000",
  standard_3months: "8500",
  standard_6months: "16000",
  premium_1month: "4500",
  premium_3months: "12500",
  premium_6months: "24000",
  sessions_per_month: "8",
  custom_monthly_price: "2500",
  custom_monthly_sessions: "8",
  packs: [{ pack_name: "8 Session Pack", session_count: "8", standard_price: "2000", premium_price: "2800" }],
  renewal_days: "30",
});

interface Props {
  value: PricingConfig;
  onChange: (next: PricingConfig) => void;
}

const TypeCard = ({
  selected,
  onClick,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "text-left p-3 rounded-lg border transition-all duration-200",
      selected
        ? "border-primary bg-primary/10 shadow-[0_0_12px_rgba(57,255,20,0.25)]"
        : "border-border bg-muted/20 hover:border-primary/40"
    )}
  >
    <p className={cn("text-sm font-semibold", selected && "text-primary")}>{title}</p>
    <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{desc}</p>
  </button>
);

export default function SportPricingFields({ value, onChange }: Props) {
  const set = (patch: Partial<PricingConfig>) => onChange({ ...value, ...patch });

  const updatePack = (idx: number, patch: Partial<PackEntry>) => {
    const packs = value.packs.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    set({ packs });
  };
  const addPack = () =>
    set({ packs: [...value.packs, { pack_name: "", session_count: "", standard_price: "", premium_price: "" }] });
  const removePack = (idx: number) => set({ packs: value.packs.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold">Pricing Type *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
          <TypeCard
            selected={value.pricing_type === "duration_based"}
            onClick={() => set({ pricing_type: "duration_based" })}
            title="Duration Based"
            desc="Fixed 1 / 3 / 6 month plans with set prices"
          />
          <TypeCard
            selected={value.pricing_type === "custom_monthly"}
            onClick={() => set({ pricing_type: "custom_monthly", renewal_trigger: "session_based" })}
            title="Custom Monthly"
            desc="Your own price and session count per month"
          />
          <TypeCard
            selected={value.pricing_type === "session_pack"}
            onClick={() => set({ pricing_type: "session_pack" })}
            title="Session Pack"
            desc="Reusable bundles like 8 or 16 sessions"
          />
        </div>
      </div>

      {/* DURATION BASED */}
      {value.pricing_type === "duration_based" && (
        <>
          <div className="border-t border-border pt-3">
            <p className="text-sm font-semibold mb-3">STANDARD BATCH PRICING</p>
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-xs">1 Month</Label><Input type="number" value={value.standard_1month} onChange={(e) => set({ standard_1month: e.target.value })} /></div>
              <div><Label className="text-xs">3 Months</Label><Input type="number" value={value.standard_3months} onChange={(e) => set({ standard_3months: e.target.value })} /></div>
              <div><Label className="text-xs">6 Months</Label><Input type="number" value={value.standard_6months} onChange={(e) => set({ standard_6months: e.target.value })} /></div>
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <p className="text-sm font-semibold mb-3">PREMIUM BATCH PRICING</p>
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-xs">1 Month</Label><Input type="number" value={value.premium_1month} onChange={(e) => set({ premium_1month: e.target.value })} /></div>
              <div><Label className="text-xs">3 Months</Label><Input type="number" value={value.premium_3months} onChange={(e) => set({ premium_3months: e.target.value })} /></div>
              <div><Label className="text-xs">6 Months</Label><Input type="number" value={value.premium_6months} onChange={(e) => set({ premium_6months: e.target.value })} /></div>
            </div>
          </div>
        </>
      )}

      {/* CUSTOM MONTHLY */}
      {value.pricing_type === "custom_monthly" && (
        <div className="border-t border-border pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Price per Month (₹) *</Label>
              <Input type="number" value={value.custom_monthly_price} onChange={(e) => set({ custom_monthly_price: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Sessions per Month *</Label>
              <Input type="number" value={value.custom_monthly_sessions} onChange={(e) => set({ custom_monthly_sessions: e.target.value })} />
            </div>
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <p>Renews only after all sessions are completed. Renewal date depends on attendance, not a fixed calendar date.</p>
          </div>
        </div>
      )}

      {/* SESSION PACK */}
      {value.pricing_type === "session_pack" && (
        <div className="border-t border-border pt-3 space-y-3">
          <p className="text-sm font-semibold">SESSION PACKS</p>
          <div className="space-y-3">
            {value.packs.map((pack, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">Pack {idx + 1}</p>
                  {value.packs.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => removePack(idx)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div>
                  <Label className="text-xs">Pack Name *</Label>
                  <Input value={pack.pack_name} placeholder="8 Session Pack" onChange={(e) => updatePack(idx, { pack_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Sessions *</Label>
                    <Input type="number" value={pack.session_count} onChange={(e) => updatePack(idx, { session_count: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Standard ₹ *</Label>
                    <Input type="number" value={pack.standard_price} onChange={(e) => updatePack(idx, { standard_price: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Premium ₹</Label>
                    <Input type="number" value={pack.premium_price} onChange={(e) => updatePack(idx, { premium_price: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addPack} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Add Another Pack
          </Button>
        </div>
      )}

      {/* RENEWAL TRIGGER (not for custom_monthly — it's always session_based) */}
      {value.pricing_type !== "custom_monthly" && (
        <div className="border-t border-border pt-3 space-y-2">
          <Label className="text-sm font-semibold">Renewal Trigger *</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <TypeCard
              selected={value.renewal_trigger === "date_based"}
              onClick={() => set({ renewal_trigger: "date_based" })}
              title="Date Based"
              desc={
                value.pricing_type === "session_pack"
                  ? "Renews after a fixed number of days"
                  : "Renews automatically when the plan duration ends"
              }
            />
            <TypeCard
              selected={value.renewal_trigger === "session_based"}
              onClick={() => set({ renewal_trigger: "session_based" })}
              title="Session Based"
              desc="Renews only after the student completes all paid sessions"
            />
          </div>

          {value.pricing_type === "duration_based" && value.renewal_trigger === "session_based" && (
            <div>
              <Label className="text-xs">Sessions per month for this sport *</Label>
              <Input
                type="number"
                value={value.sessions_per_month}
                onChange={(e) => set({ sessions_per_month: e.target.value })}
                placeholder="8"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Used to calculate total sessions per plan (e.g. 3 months × 8 sessions = 24).
              </p>
            </div>
          )}

          {value.pricing_type === "session_pack" && value.renewal_trigger === "date_based" && (
            <div>
              <Label className="text-xs">Renewal period (days) *</Label>
              <Input type="number" value={value.renewal_days} onChange={(e) => set({ renewal_days: e.target.value })} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
