import { CalendarDays, Building2, User, Gavel, Layers, Tag, Clock } from "lucide-react";
import { Docket } from "@/data/mock";
import { format } from "date-fns";

type Props = { docket: Docket };

export const DocketHeader = ({ docket }: Props) => {
  const fmt = (d?: string | null) => (d ? format(new Date(d), "PPP") : "—");

  return (
    <header className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-[var(--shadow-elegant)]">
      <div className="absolute inset-0 pointer-events-none opacity-70" style={{ background: "var(--gradient-primary)" }} />
      <div className="relative z-10 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-1">{docket.docket_title}</h1>
          <p className="text-sm text-muted-foreground">Docket {docket.docket_govid}</p>
        </div>
        <div className="flex md:justify-end items-center gap-2 self-start">
          <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs border">{docket.industry ?? "other"}</span>
          {docket.current_status && (
            <span className="px-3 py-1 rounded-full bg-accent/10 text-foreground text-xs border">{docket.current_status}</span>
          )}
        </div>
      </div>
      <div className="relative z-10 mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Info icon={<Building2 size={16} />} label="Petitioner" value={docket.petitioner} />
        <Info icon={<User size={16} />} label="Hearing officer" value={docket.hearing_officer} />
        <Info icon={<Gavel size={16} />} label="Assigned judge" value={docket.assigned_judge} />
        <Info icon={<CalendarDays size={16} />} label="Opened" value={fmt(docket.opened_date)} />
        <Info icon={<Clock size={16} />} label="Closed" value={fmt(docket.closed_date)} />
        <Info icon={<Layers size={16} />} label="Subtype" value={docket["docket_subtype" as any] as any} />
      </div>
      {docket.docket_description && (
        <p className="relative z-10 mt-4 text-sm text-muted-foreground max-w-3xl">{docket.docket_description}</p>
      )}
    </header>
  );
};

const Info = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) => (
  <div className="flex items-center gap-3 rounded-lg border bg-background/60 px-3 py-2">
    <div className="shrink-0 text-foreground/80">{icon}</div>
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm truncate">{value ?? "—"}</div>
    </div>
  </div>
);
