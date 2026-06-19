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
  kid_standard_price: string;
  kid_premium_price: string;
  adult_standard_price: string;
  adult_premium_price: string;
}

export interface PricingConfig {
  allows_kids: boolean;
  allows_adults: boolean;
  pricing_type: PricingType;
  renewal_trigger: RenewalTrigger;
  // duration_based — kid
  kid_standard_1month: string; kid_standard_3months: string; kid_standard_6months: string;
  kid_premium_1month: string; kid_premium_3months: string; kid_premium_6months: string;
  // duration_based — adult
  adult_standard_1month: string; adult_standard_3months: string; adult_standard_6months: string;
  adult_premium_1month: string; adult_premium_3months: string; adult_premium_6months: string;
  // sessions per month (session_based + duration)
  kid_sessions_per_month: string;
  adult_sessions_per_month: string;
  // custom_monthly
  kid_custom_monthly_price: string; kid_custom_monthly_sessions: string;
  adult_custom_monthly_price: string; adult_custom_monthly_sessions: string;
  // session_pack
  packs: PackEntry[];
  // date_based renewal period (custom_monthly + session_pack)
  renewal_days: string;
}

export const defaultPricingConfig = (): PricingConfig => ({
  allows_kids: true,
  allows_adults: true,
  pricing_type: "duration_based",
  renewal_trigger: "date_based",
  kid_standard_1month: "3000", kid_standard_3months: "8500", kid_standard_6months: "16000",
  kid_premium_1month: "4500", kid_premium_3months: "12500", kid_premium_6months: "24000",
  adult_standard_1month: "3500", adult_standard_3months: "9500", adult_standard_6months: "18000",
  adult_premium_1month: "5000", adult_premium_3months: "13500", adult_premium_6months: "26000",
  kid_sessions_per_month: "8",
  adult_sessions_per_month: "8",
  kid_custom_monthly_price: "2500", kid_custom_monthly_sessions: "8",
  adult_custom_monthly_price: "3000", adult_custom_monthly_sessions: "8",
  packs: [{
    pack_name: "8 Session Pack", session_count: "8",
    kid_standard_price: "2000", kid_premium_price: "2800",
    adult_standard_price: "2500", adult_premium_price: "3500",
  }],
  renewal_days: "30",
});

interface Props {
  value: PricingConfig;
  onChange: (next: PricingConfig) => void;
}

const TypeCard = ({
  selected, onClick, title, desc,
}: { selected: boolean; onClick: () => void; title: string; desc: string; }) => (
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
  const showKid = value.allows_kids;
  const showAdult = value.allows_adults;

  const updatePack = (idx: number, patch: Partial<PackEntry>) => {
    const packs = value.packs.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    set({ packs });
  };
  const addPack = () => set({
    packs: [...value.packs, {
      pack_name: "", session_count: "",
      kid_standard_price: "", kid_premium_price: "",
      adult_standard_price: "", adult_premium_price: "",
    }],
  });
  const removePack = (idx: number) => set({ packs: value.packs.filter((_, i) => i !== idx) });

  const audiencePreset: "both" | "adults_only" =
    showKid && showAdult ? "both" : "adults_only";

  const DurationGroup = ({
    label, prefix,
  }: { label: string; prefix: "kid_standard" | "kid_premium" | "adult_standard" | "adult_premium" }) => (
    <div>
      <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        <div><Label className="text-xs">1 Month</Label><Input type="number" value={(value as any)[`${prefix}_1month`]} onChange={(e) => set({ [`${prefix}_1month`]: e.target.value } as any)} /></div>
        <div><Label className="text-xs">3 Months</Label><Input type="number" value={(value as any)[`${prefix}_3months`]} onChange={(e) => set({ [`${prefix}_3months`]: e.target.value } as any)} /></div>
        <div><Label className="text-xs">6 Months</Label><Input type="number" value={(value as any)[`${prefix}_6months`]} onChange={(e) => set({ [`${prefix}_6months`]: e.target.value } as any)} /></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* AUDIENCE TOGGLE */}
      <div>
        <Label className="text-sm font-semibold">Who can join this sport? *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          <TypeCard
            selected={audiencePreset === "both"}
            onClick={() => set({ allows_kids: true, allows_adults: true })}
            title="Kids and Adults"
            desc="Different pricing for each age group"
          />
          <TypeCard
            selected={audiencePreset === "adults_only"}
            onClick={() => set({ allows_kids: false, allows_adults: true })}
            title="Adults Only"
            desc="No kid pricing — adults only sport"
          />
        </div>
      </div>

      {/* PRICING TYPE */}
      <div>
        <Label className="text-sm font-semibold">Pricing Type *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
          <TypeCard selected={value.pricing_type === "duration_based"} onClick={() => set({ pricing_type: "duration_based" })} title="Duration Based" desc="Fixed 1 / 3 / 6 month plans" />
          <TypeCard selected={value.pricing_type === "custom_monthly"} onClick={() => set({ pricing_type: "custom_monthly" })} title="Custom Monthly" desc="Your own price and session count per month" />
          <TypeCard selected={value.pricing_type === "session_pack"} onClick={() => set({ pricing_type: "session_pack" })} title="Session Pack" desc="Reusable bundles like 8 or 16 sessions" />
        </div>
      </div>

      {/* DURATION BASED */}
      {value.pricing_type === "duration_based" && (
        <div className="border-t border-border pt-3 space-y-4">
          {showKid && <DurationGroup label="Kid Standard" prefix="kid_standard" />}
          {showKid && <DurationGroup label="Kid Premium" prefix="kid_premium" />}
          {showAdult && <DurationGroup label="Adult Standard" prefix="adult_standard" />}
          {showAdult && <DurationGroup label="Adult Premium" prefix="adult_premium" />}
        </div>
      )}

      {/* CUSTOM MONTHLY */}
      {value.pricing_type === "custom_monthly" && (
        <div className="border-t border-border pt-3 space-y-4">
          {showKid && (
            <div>
              <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Kid</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Price per Month (₹) *</Label><Input type="number" value={value.kid_custom_monthly_price} onChange={(e) => set({ kid_custom_monthly_price: e.target.value })} /></div>
                <div><Label className="text-xs">Sessions per Month *</Label><Input type="number" value={value.kid_custom_monthly_sessions} onChange={(e) => set({ kid_custom_monthly_sessions: e.target.value })} /></div>
              </div>
            </div>
          )}
          {showAdult && (
            <div>
              <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Adult</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Price per Month (₹) *</Label><Input type="number" value={value.adult_custom_monthly_price} onChange={(e) => set({ adult_custom_monthly_price: e.target.value })} /></div>
                <div><Label className="text-xs">Sessions per Month *</Label><Input type="number" value={value.adult_custom_monthly_sessions} onChange={(e) => set({ adult_custom_monthly_sessions: e.target.value })} /></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SESSION PACK */}
      {value.pricing_type === "session_pack" && (
        <div className="border-t border-border pt-3 space-y-3">
          <p className="text-sm font-semibold">SESSION PACKS</p>
          <div className="space-y-3">
            {value.packs.map((pack, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">Pack {idx + 1}</p>
                  {value.packs.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => removePack(idx)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">Pack Name *</Label><Input value={pack.pack_name} placeholder="8 Session Pack" onChange={(e) => updatePack(idx, { pack_name: e.target.value })} /></div>
                  <div><Label className="text-xs">Sessions *</Label><Input type="number" value={pack.session_count} onChange={(e) => updatePack(idx, { session_count: e.target.value })} /></div>
                </div>
                {showKid && (
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Kid Standard ₹ *</Label><Input type="number" value={pack.kid_standard_price} onChange={(e) => updatePack(idx, { kid_standard_price: e.target.value })} /></div>
                    <div><Label className="text-xs">Kid Premium ₹</Label><Input type="number" value={pack.kid_premium_price} onChange={(e) => updatePack(idx, { kid_premium_price: e.target.value })} /></div>
                  </div>
                )}
                {showAdult && (
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Adult Standard ₹ *</Label><Input type="number" value={pack.adult_standard_price} onChange={(e) => updatePack(idx, { adult_standard_price: e.target.value })} /></div>
                    <div><Label className="text-xs">Adult Premium ₹</Label><Input type="number" value={pack.adult_premium_price} onChange={(e) => updatePack(idx, { adult_premium_price: e.target.value })} /></div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addPack} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Add Another Pack
          </Button>
        </div>
      )}

      {/* RENEWAL TRIGGER — always shown for all 3 pricing types */}
      <div className="border-t border-border pt-3 space-y-2">
        <Label className="text-sm font-semibold">Renewal Trigger *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <TypeCard
            selected={value.renewal_trigger === "date_based"}
            onClick={() => set({ renewal_trigger: "date_based" })}
            title="Date Based"
            desc="Renews after a fixed number of days"
          />
          <TypeCard
            selected={value.renewal_trigger === "session_based"}
            onClick={() => set({ renewal_trigger: "session_based" })}
            title="Session Based"
            desc="Renews only after the student completes all paid sessions"
          />
        </div>

        {/* Date-based extras */}
        {value.renewal_trigger === "date_based" && (value.pricing_type === "custom_monthly" || value.pricing_type === "session_pack") && (
          <div>
            <Label className="text-xs">Renewal period (days) *</Label>
            <Input type="number" value={value.renewal_days} onChange={(e) => set({ renewal_days: e.target.value })} placeholder="30" />
          </div>
        )}

        {/* Session-based extras for duration_based */}
        {value.renewal_trigger === "session_based" && value.pricing_type === "duration_based" && (
          <div className="space-y-2">
            {showKid && (
              <div>
                <Label className="text-xs">Kid — sessions per month *</Label>
                <Input type="number" value={value.kid_sessions_per_month} onChange={(e) => set({ kid_sessions_per_month: e.target.value })} />
              </div>
            )}
            {showAdult && (
              <div>
                <Label className="text-xs">Adult — sessions per month *</Label>
                <Input type="number" value={value.adult_sessions_per_month} onChange={(e) => set({ adult_sessions_per_month: e.target.value })} />
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">Used to calculate total sessions per plan (e.g. 3 months × 8 = 24).</p>
          </div>
        )}

        {value.renewal_trigger === "session_based" && value.pricing_type !== "duration_based" && (
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <p>Session counts are already entered above. No extra field needed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
