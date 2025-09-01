import { Building2, Calendar, FileText, FilePlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Props = { 
  orgName: string;
  docketCount?: number;
  petitionedCount?: number;
  filedCount?: number;
  dateBounds?: { min: string | null; max: string | null };
  isLoading?: boolean;
};

export const OrganizationHeader = ({ orgName, docketCount, petitionedCount, filedCount, dateBounds, isLoading }: Props) => {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } catch {
      return "—";
    }
  };

  return (
    <header className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-[var(--shadow-elegant)] mb-6">
      <div className="absolute inset-0 pointer-events-none opacity-70" style={{ background: "var(--gradient-primary)" }} />
      <div className="relative z-10 grid gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Building2 size={28} className="text-foreground/50 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground leading-tight">Organization</p>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight leading-tight">{orgName}</h1>
            </div>
          </div>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(petitionedCount !== undefined || isLoading) && (
            <div className="flex items-center gap-3 rounded-lg border bg-background/60 px-3 py-2">
              <div className="shrink-0 text-foreground/80">
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Dockets</div>
                <div className="text-sm font-medium">
                  {isLoading ? <Skeleton className="h-4 w-12" /> : petitionedCount?.toLocaleString()}
                </div>
              </div>
            </div>
          )}
          
          {(filedCount !== undefined || isLoading) && (
            <div className="flex items-center gap-3 rounded-lg border bg-background/60 px-3 py-2">
              <div className="shrink-0 text-foreground/80">
                <FilePlus size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Filings</div>
                <div className="text-sm font-medium">
                  {isLoading ? <Skeleton className="h-4 w-12" /> : filedCount?.toLocaleString()}
                </div>
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
                <div className="text-sm font-medium">
                  {isLoading ? <Skeleton className="h-4 w-12" /> : docketCount?.toLocaleString()}
                </div>
              </div>
            </div>
          )}
          
          {(dateBounds && (dateBounds.min || dateBounds.max)) || isLoading ? (
            <div className="flex items-center gap-3 rounded-lg border bg-background/60 px-3 py-2">
              <div className="shrink-0 text-foreground/80">
                <Calendar size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Activity Period</div>
                <div className="text-sm">
                  {isLoading ? <Skeleton className="h-4 w-32" /> : `${formatDate(dateBounds?.min)} — ${formatDate(dateBounds?.max)}`}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};