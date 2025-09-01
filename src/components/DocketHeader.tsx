import { CalendarDays, Building2, Layers, Tag, Clock, ExternalLink, Heart, DollarSign, Frown, FileCheck, Search, 
  BarChart3, Gavel, Flame, Lock, HelpCircle, Book, EyeOff, 
  FileSpreadsheet, TrendingUp, Microscope, Clipboard, CheckCircle, MessageCircle, Lightbulb, FolderOpen, Files } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Props = { docket: Docket };

// Helper function to get appropriate icon for docket types
const getDocketTypeIcon = (type: string) => {
  const typeKey = type?.toLowerCase().trim();
  switch (typeKey) {
    case 'petition':
      return Heart; // Prayer/thank you hands - someone asking for something
    case 'tariff':
      return DollarSign; // Rate changes
    case 'complaint':
      return Frown; // Mad face for complaints
    case 'contract':
      return Lock; // Lock for contracts
    case 'audit':
      return Search; // Magnifying glass for audits
    case 'incident':
      return Flame; // Creative - incidents (like fires, emergencies)
    case 'compliance':
      return FileCheck; // Compliance
    case 'commission instituted new case proceeding':
      return Gavel; // Commission proceedings
    case 'rulemaking':
      return Book; // Making rules/laws
    case 'exception from disclosure':
      return EyeOff; // Hiding information/confidential
    case 'company workpapers':
      return FileSpreadsheet; // Internal documents/calculations
    case 'analysis':
      return TrendingUp; // Analyzing data/trends
    case 'investigation':
      return Microscope; // Investigating/examining closely
    case 'office policy and procedures':
      return Clipboard; // Internal policies/procedures
    case 'authorization':
      return CheckCircle; // Authorization/permission granted
    case 'complaint and inquiry':
      return MessageCircle; // Questions/inquiries combined with complaints
    case 'policy initiative':
      return Lightbulb; // New initiatives/bright ideas
    default:
      return HelpCircle; // Miscellaneous and others
  }
};

// Helper function to get semantic colors for docket types
const getDocketTypeColor = (type: string) => {
  const typeKey = type?.toLowerCase().trim();
  switch (typeKey) {
    case 'petition':
      return 'text-blue-600'; // Blue for requests/prayers
    case 'tariff':
      return 'text-green-600'; // Green for money/rates
    case 'complaint':
      return 'text-red-600'; // Red for complaints/anger
    case 'contract':
      return 'text-purple-600'; // Purple for security/contracts
    case 'audit':
      return 'text-orange-600'; // Orange for investigation/search
    case 'incident':
      return 'text-red-500'; // Red for incidents/emergencies
    case 'compliance':
      return 'text-emerald-600'; // Emerald for approval/compliance
    case 'commission instituted new case proceeding':
      return 'text-indigo-600'; // Indigo for official proceedings
    case 'rulemaking':
      return 'text-slate-600'; // Slate for legal/regulatory
    case 'exception from disclosure':
      return 'text-gray-600'; // Gray for confidential/hidden
    case 'company workpapers':
      return 'text-amber-600'; // Amber for internal documents
    case 'analysis':
      return 'text-cyan-600'; // Cyan for data analysis
    case 'investigation':
      return 'text-pink-600'; // Pink for investigation/examination
    case 'office policy and procedures':
      return 'text-teal-600'; // Teal for organizational policies
    case 'authorization':
      return 'text-lime-600'; // Lime for approval/authorization
    case 'complaint and inquiry':
      return 'text-rose-600'; // Rose for mixed complaints/questions
    case 'policy initiative':
      return 'text-yellow-600'; // Yellow for bright ideas/initiatives
    default:
      return 'text-muted-foreground'; // Default muted color
  }
};

// Helper function to get subtle background and border colors for docket type badges
const getDocketTypeBadgeColors = (type: string) => {
  const typeKey = type?.toLowerCase().trim();
  switch (typeKey) {
    case 'petition':
      return 'bg-blue-50 border-blue-200'; // Blue theme
    case 'tariff':
      return 'bg-green-50 border-green-200'; // Green theme
    case 'complaint':
      return 'bg-red-50 border-red-200'; // Red theme
    case 'contract':
      return 'bg-purple-50 border-purple-200'; // Purple theme
    case 'audit':
      return 'bg-orange-50 border-orange-200'; // Orange theme
    case 'incident':
      return 'bg-red-50 border-red-300'; // Red theme (slightly different border)
    case 'compliance':
      return 'bg-emerald-50 border-emerald-200'; // Emerald theme
    case 'commission instituted new case proceeding':
      return 'bg-indigo-50 border-indigo-200'; // Indigo theme
    case 'rulemaking':
      return 'bg-slate-50 border-slate-200'; // Slate theme
    case 'exception from disclosure':
      return 'bg-gray-50 border-gray-200'; // Gray theme
    case 'company workpapers':
      return 'bg-amber-50 border-amber-200'; // Amber theme
    case 'analysis':
      return 'bg-cyan-50 border-cyan-200'; // Cyan theme
    case 'investigation':
      return 'bg-pink-50 border-pink-200'; // Pink theme
    case 'office policy and procedures':
      return 'bg-teal-50 border-teal-200'; // Teal theme
    case 'authorization':
      return 'bg-lime-50 border-lime-200'; // Lime theme
    case 'complaint and inquiry':
      return 'bg-rose-50 border-rose-200'; // Rose theme
    case 'policy initiative':
      return 'bg-yellow-50 border-yellow-200'; // Yellow theme
    default:
      return 'bg-gray-50 border-gray-200'; // Default theme
  }
};

export const DocketHeader = ({ docket }: Props) => {
  const fmt = (d?: string | null) => (d ? format(new Date(d), "PPP") : "—");

  // Query to get filing count for this docket
  const { data: filingCount = 0 } = useQuery({
    queryKey: ["docket-filing-count", docket.docket_govid],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("fillings")
        .select("*", { count: "exact", head: true })
        .eq("docket_govid", docket.docket_govid);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Query to get unique organizations count for this docket
  const { data: uniqueOrgsCount = 0 } = useQuery({
    queryKey: ["docket-unique-orgs", docket.docket_govid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fillings")
        .select("organization_author_strings")
        .eq("docket_govid", docket.docket_govid)
        .not("organization_author_strings", "is", null);
      if (error) throw error;
      const uniqueOrgs = new Set();
      data?.forEach(f => {
        if (f.organization_author_strings) {
          f.organization_author_strings.forEach((org: string) => uniqueOrgs.add(org));
        }
      });
      return uniqueOrgs.size;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <header className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-[var(--shadow-elegant)]">
      <div className="absolute inset-0 pointer-events-none opacity-70" style={{ background: "var(--gradient-primary)" }} />
      <div className="relative z-10 grid gap-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {docket.docket_type && (
                <Badge variant="outline" className={`text-xs inline-flex items-center gap-1.5 ${getDocketTypeBadgeColors(docket.docket_type)}`}>
                  {(() => {
                    const TypeIcon = getDocketTypeIcon(docket.docket_type);
                    const typeColor = getDocketTypeColor(docket.docket_type);
                    return <TypeIcon size={12} className={typeColor} />;
                  })()}
                  {docket.docket_type}
                </Badge>
              )}
              {docket.docket_subtype && (
                <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200 hover:bg-slate-100 inline-flex items-center gap-1.5">
                  <Layers size={12} className="text-slate-600" />
                  {docket.docket_subtype}
                </Badge>
              )}
            </div>
            <div className="border-t border-border/50 pt-4">
            <div className="flex items-start gap-3">
              <FolderOpen size={28} className="text-foreground/50 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground leading-tight">Docket</p>
                <h2 className="text-lg md:text-xl font-semibold leading-tight">{docket.docket_govid}</h2>
              </div>
            </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-background border-gray-300 hover:border-gray-400 transition-colors inline-flex items-center gap-1.5">
              {(() => {
                const IndustryIcon = getIndustryIcon(docket.industry || "other");
                return <IndustryIcon size={12} className={getIndustryColor(docket.industry || "other")} />;
              })()}
              {docket.industry ?? "other"}
            </Badge>
            {docket.current_status && (
              <span className="px-3 py-1 rounded-full bg-accent/10 text-foreground text-xs border">{docket.current_status}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-[0.9]">
            <h1 className="text-sm md:text-base font-normal tracking-tight mb-1 text-muted-foreground/90">{docket.docket_title}</h1>
          </div>
        </div>
      </div>
      
      <div className="relative z-10 mt-6 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-foreground/80" />
          <span className="text-sm font-medium text-foreground">Stats</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Info icon={<Files size={16} />} label="Filings" value={filingCount.toLocaleString()} />
          <Info icon={<Building2 size={16} />} label="Organizations" value={uniqueOrgsCount.toLocaleString()} />
          <Info icon={<CalendarDays size={16} />} label="Opened" value={fmt(docket.opened_date)} />
        </div>
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
