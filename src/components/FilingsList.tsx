import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FileArchive, FileSpreadsheet, FileText, Link as LinkIcon } from "lucide-react";
import { Attachment, Filling } from "@/data/mock";
import { format } from "date-fns";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PDFViewerModal } from "@/components/PDFViewerModal";

export type FilingWithAttachments = Filling & { attachments: Attachment[] };

type Props = {
  filings: FilingWithAttachments[];
};

export const FilingsList = ({ filings }: Props) => {
  const [orgFilter, setOrgFilter] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [active, setActive] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ filingId: string; index: number } | null>(null);

  const organizations = useMemo(() => {
    const set = new Set<string>();
    filings.forEach((f) => f.organization_author_strings.forEach((o) => set.add(o)));
    return Array.from(set).sort();
  }, [filings]);

  const filtered = useMemo(() => {
    let list = [...filings];
    if (orgFilter) list = list.filter((f) => f.organization_author_strings.includes(orgFilter));
    list.sort((a, b) =>
      sortDir === "desc"
        ? new Date(b.filed_date).getTime() - new Date(a.filed_date).getTime()
        : new Date(a.filed_date).getTime() - new Date(b.filed_date).getTime()
    );
    return list;
  }, [filings, orgFilter, sortDir]);

  useEffect(() => {
    // Close viewer if active filing disappears (filter changed)
    if (viewer && !filtered.find(f => f.uuid === viewer.filingId)) {
      setViewer(null);
    }
  }, [filtered, viewer]);

  return (
    <section className="mt-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="text-sm text-muted-foreground">Filter:</div>
        <div className="flex flex-wrap gap-2">
          <Button variant={orgFilter === null ? "default" : "outline"} size="sm" onClick={() => setOrgFilter(null)}>All</Button>
          {organizations.map((o) => (
            <Button key={o} variant={orgFilter === o ? "default" : "outline"} size="sm" onClick={() => setOrgFilter(o)}>
              {o}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort:</span>
          <Button variant="outline" size="sm" onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}>
            Date {sortDir === "desc" ? "↓" : "↑"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((f) => {
          const isOpen = active === f.uuid;
          return (
            <article key={f.uuid} className="rounded-lg border bg-card p-3">
              <button
                className="w-full flex items-center gap-3 text-left"
                onClick={() => setActive(isOpen ? null : f.uuid)}
                aria-expanded={isOpen}
              >
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium leading-tight">{f.filling_name ?? f.filling_type ?? "Filing"}</h3>
                    {f.filling_type && <Badge variant="secondary">{f.filling_type}</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2">
                    <span>{format(new Date(f.filed_date), "PPP")}</span>
                    <span>•</span>
                    <span className="truncate">{f.organization_author_strings.join(", ")}</span>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="mt-3 grid gap-2">
                  {f.attachments.length === 0 && (
                    <div className="text-sm text-muted-foreground">No attachments.</div>
                  )}
                  {f.attachments.map((a, idx) => {
                    const isPdf = a.attachment_file_extension.toLowerCase() === "pdf";
                    return isPdf ? (
                      <button
                        key={a.uuid}
                        type="button"
                        onClick={() => setViewer({ filingId: f.uuid, index: idx })}
                        className="group flex items-center justify-between w-full rounded-md border bg-background px-3 py-2 hover:bg-accent hover:border-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileIcon ext={a.attachment_file_extension} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{a.attachment_title}</div>
                            <div className="text-xs text-muted-foreground truncate">{a.attachment_file_name}</div>
                          </div>
                        </div>
                        <span
                          className={[buttonVariants({ size: "sm" }), "pointer-events-none", "group-hover:bg-primary/90"].join(" ")}
                        >
                          Open
                        </span>
                      </button>
                    ) : (
                      <a
                        key={a.uuid}
                        href={a.attachment_url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between w-full rounded-md border bg-background px-3 py-2 hover:bg-accent hover:border-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileIcon ext={a.attachment_file_extension} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{a.attachment_title}</div>
                            <div className="text-xs text-muted-foreground truncate">{a.attachment_file_name}</div>
                          </div>
                        </div>
                        <span
                          className={[buttonVariants({ size: "sm", variant: "outline" }), "pointer-events-none", "group-hover:bg-accent", "group-hover:text-accent-foreground", "flex", "items-center", "gap-2"].join(" ")}
                        >
                          <LinkIcon size={16} /> Download
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}

              {viewer && viewer.filingId === f.uuid && (
                <PDFViewerModal
                  open={!!viewer}
                  onOpenChange={(o) => !o && setViewer(null)}
                  attachments={f.attachments.filter(a => a.attachment_file_extension.toLowerCase() === 'pdf')}
                  startIndex={(() => {
                    const onlyPdfs = f.attachments.filter(a => a.attachment_file_extension.toLowerCase() === 'pdf');
                    const target = onlyPdfs.findIndex(a => a.uuid === f.attachments[viewer.index]?.uuid);
                    return target >= 0 ? target : 0;
                  })()}
                />
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};

const FileIcon = ({ ext }: { ext: string }) => {
  const e = ext.toLowerCase();
  if (e === "pdf") return <FileText className="text-foreground/80" size={18} />;
  if (e === "xlsx" || e === "xls") return <FileSpreadsheet className="text-foreground/80" size={18} />;
  if (e === "zip") return <FileArchive className="text-foreground/80" size={18} />;
  return <FileText className="text-foreground/80" size={18} />;
};
