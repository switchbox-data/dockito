import { CalendarDays, Building2, Layers, Tag, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getIndustryIcon, getIndustryColor } from "@/utils/industryIcons";
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
import { Link } from "react-router-dom";
import { format } from "date-fns";

type Props = { docket: Docket };

export const DocketHeader = ({ docket }: Props) => {
  const fmt = (d?: string | null) => (d ? format(new Date(d), "PPP") : "—");

  return (
    <header className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-[var(--shadow-elegant)]">
      <div className="absolute inset-0 pointer-events-none opacity-70" style={{ background: "var(--gradient-primary)" }} />
      <div className="relative z-10 grid gap-4">
        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">Docket {docket.docket_govid}</p>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs border inline-flex items-center gap-1.5">
              {(() => {
                const IndustryIcon = getIndustryIcon(docket.industry || "other");
                return <IndustryIcon size={12} className={getIndustryColor(docket.industry || "other")} />;
              })()}
              {docket.industry ?? "other"}
            </span>
            {docket.current_status && (
              <span className="px-3 py-1 rounded-full bg-accent/10 text-foreground text-xs border">{docket.current_status}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-[0.9]">
            <h1 className="text-lg md:text-xl font-semibold tracking-tight mb-1">{docket.docket_title}</h1>
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Info icon={<CalendarDays size={16} />} label="Opened" value={fmt(docket.opened_date)} />
        <Info icon={<Tag size={16} />} label="Type" value={docket.docket_type} />
        <Info icon={<Layers size={16} />} label="Subtype" value={docket.docket_subtype} />
      </div>
      
      {docket.petitioner_strings?.length && (
        <div className="relative z-10 mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} className="text-foreground/80" />
            <span className="text-sm font-medium text-foreground">Petitioners</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {docket.petitioner_strings.map((p) => (
              <Link key={p} to={`/org/${encodeURIComponent(p)}`} className="inline-block">
                <Badge variant="outline" className="px-3 py-1.5 text-sm bg-background border-gray-300 hover:border-gray-400 transition-colors cursor-pointer">{p}</Badge>
              </Link>
            ))}
          </div>
        </div>
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
