import { Building2, Calendar, FileText, FilePlus } from "lucide-react";

type Props = { 
  orgName: string;
  docketCount?: number;
  petitionedCount?: number;
  filedCount?: number;
  dateRange?: { start: Date | null; end: Date | null };
};

export const OrganizationHeader = ({ orgName, docketCount, petitionedCount, filedCount, dateRange }: Props) => {
  const formatDate = (d?: Date | null) => (d ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : "—");

  return (
    <header className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-[var(--shadow-elegant)] mb-6">
      <div className="absolute inset-0 pointer-events-none opacity-70" style={{ background: "var(--gradient-primary)" }} />
      <div className="relative z-10 grid gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Building2 size={24} className="text-primary shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Organization</p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{orgName}</h1>
            </div>
          </div>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {petitionedCount !== undefined && (
            <div className="flex items-center gap-3 rounded-lg border bg-background/60 px-3 py-2">
              <div className="shrink-0 text-foreground/80">
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Dockets Petitioned</div>
                <div className="text-sm font-medium">{petitionedCount.toLocaleString()}</div>
              </div>
            </div>
          )}
          
          {filedCount !== undefined && (
            <div className="flex items-center gap-3 rounded-lg border bg-background/60 px-3 py-2">
              <div className="shrink-0 text-foreground/80">
                <FilePlus size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Dockets Filed</div>
                <div className="text-sm font-medium">{filedCount.toLocaleString()}</div>
              </div>
            </div>
          )}
          
          {(docketCount !== undefined && petitionedCount === undefined && filedCount === undefined) && (
            <div className="flex items-center gap-3 rounded-lg border bg-background/60 px-3 py-2">
              <div className="shrink-0 text-foreground/80">
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Total Dockets</div>
                <div className="text-sm font-medium">{docketCount.toLocaleString()}</div>
              </div>
            </div>
          )}
          
          {dateRange && (
            <div className="flex items-center gap-3 rounded-lg border bg-background/60 px-3 py-2">
              <div className="shrink-0 text-foreground/80">
                <Calendar size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Activity Period</div>
                <div className="text-sm">{formatDate(dateRange.start)} — {formatDate(dateRange.end)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};