import { CalendarDays, Building2, Layers, Tag, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
type Docket = {
  uuid: string;
  docket_govid: string;
  docket_title: string | null;
  docket_description: string | null;
  industry: string | null;
  docket_type: string | null;
  petitioner_strings: string[] | null;
  opened_date: string;
  closed_date?: string | null;
  docket_subtype: string | null;
  current_status: string | null;
  hearing_officer?: string | null;
  assigned_judge?: string | null;
};
import { format } from "date-fns";

type Props = { docket: Docket };

export const DocketHeader = ({ docket }: Props) => {
  const fmt = (d?: string | null) => (d ? format(new Date(d), "PPP") : "—");

  return (
    <header className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-[var(--shadow-elegant)]">
      <div className="absolute inset-0 pointer-events-none opacity-70" style={{ background: "var(--gradient-primary)" }} />
      <div className="relative z-10 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <h1 className="text-lg md:text-xl lg:text-2xl font-medium leading-snug tracking-tight mb-1 break-words">{docket.docket_title}</h1>
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
        <div className="flex items-start gap-3 rounded-lg border bg-background/60 px-3 py-2">
          <div className="shrink-0 text-foreground/80"><Building2 size={16} /></div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Petitioners</div>
            {docket.petitioner_strings?.length ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {docket.petitioner_strings.map((p) => (
                  <Badge key={p} variant="outline" className="px-2 py-0.5">{p}</Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm">—</div>
            )}
          </div>
        </div>
        <Info icon={<Tag size={16} />} label="Type" value={docket.docket_type} />
        <Info icon={<Layers size={16} />} label="Subtype" value={docket.docket_subtype} />
        <Info icon={<CalendarDays size={16} />} label="Opened" value={fmt(docket.opened_date)} />
        <Info icon={<Clock size={16} />} label="Closed" value={fmt(docket.closed_date)} />
      </div>
      {docket.docket_description && (
        <p className="relative z-10 mt-4 text-sm text-muted-foreground max-w-3xl">{docket.docket_description}</p>
      )}
      <a
        href={`https://documents.dps.ny.gov/public/MatterManagement/CaseMaster.aspx?Mattercaseno=${docket.docket_govid}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${docket.docket_govid} on the NY PSC website`}
        className="absolute bottom-3 right-3 z-10 text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline inline-flex items-center gap-1"
      >
        NY PSC <ExternalLink size={14} className="opacity-70" />
      </a>
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
