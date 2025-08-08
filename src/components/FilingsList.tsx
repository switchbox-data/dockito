import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FileArchive, FileSpreadsheet, FileText, Link as LinkIcon, Check, X } from "lucide-react";
import { Attachment, Filling } from "@/data/mock";
import { format } from "date-fns";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PDFViewerModal } from "@/components/PDFViewerModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";

export type FilingWithAttachments = Filling & { attachments: Attachment[] };

type Props = {
  filings: FilingWithAttachments[];
};

export const FilingsList = ({ filings }: Props) => {
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [active, setActive] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ filingId: string; index: number } | null>(null);
  const [orgOpen, setOrgOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  const organizations = useMemo(() => {
    const set = new Set<string>();
    filings.forEach((f) => f.organization_author_strings.forEach((o) => set.add(o)));
    return Array.from(set).sort();
  }, [filings]);

  const types = useMemo(() => {
    const set = new Set<string>();
    filings.forEach((f) => {
      if (f.filling_type) set.add(f.filling_type);
    });
    return Array.from(set).sort();
  }, [filings]);

  const filtered = useMemo(() => {
    let list = [...filings];
    if (selectedOrgs.length)
      list = list.filter((f) => f.organization_author_strings.some((o) => selectedOrgs.includes(o)));
    if (selectedTypes.length)
      list = list.filter((f) => f.filling_type && selectedTypes.includes(f.filling_type));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((f) =>
        (f.filling_name?.toLowerCase().includes(q) ?? false) ||
        (f.filling_description?.toLowerCase().includes(q) ?? false)
      );
    }
    list.sort((a, b) =>
      sortDir === "desc"
        ? new Date(b.filed_date).getTime() - new Date(a.filed_date).getTime()
        : new Date(a.filed_date).getTime() - new Date(b.filed_date).getTime()
    );
    return list;
  }, [filings, selectedOrgs, selectedTypes, query, sortDir]);

  useEffect(() => {
    // Close viewer if active filing disappears (filter changed)
    if (viewer && !filtered.find(f => f.uuid === viewer.filingId)) {
      setViewer(null);
    }
  }, [filtered, viewer]);

  return (
    <section className="mt-6">
      <div className="sticky top-0 z-40 bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur border-b mb-3 space-y-2 py-2">
        {/* Row 1: controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm text-muted-foreground">Filter:</div>

          {/* Organization filter (searchable) */}
          <Popover open={orgOpen} onOpenChange={setOrgOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[200px] justify-between">
                {selectedOrgs.length ? `Organizations (${selectedOrgs.length})` : "Organizations"}
                <ChevronDown size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 z-50">
              <Command>
                <CommandInput placeholder="Search organizations..." />
                <CommandList>
                  <CommandEmpty>No results.</CommandEmpty>
                  <CommandGroup heading="Organizations">
                    <CommandItem onSelect={() => setSelectedOrgs([])}>Clear</CommandItem>
                    <CommandItem onSelect={() => setSelectedOrgs(organizations)}>Select all</CommandItem>
                    {organizations.map((o) => {
                      const selected = selectedOrgs.includes(o);
                      return (
                        <CommandItem
                          key={o}
                          onSelect={() =>
                            setSelectedOrgs((prev) =>
                              prev.includes(o) ? prev.filter((v) => v !== o) : [...prev, o]
                            )
                          }
                        >
                          <div className="flex items-center gap-2">
                            <Check size={14} className={selected ? "opacity-100" : "opacity-0"} />
                            <span>{o}</span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Filing type filter (searchable) */}
          <Popover open={typeOpen} onOpenChange={setTypeOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[160px] justify-between">
                {selectedTypes.length ? `Types (${selectedTypes.length})` : "Types"}
                <ChevronDown size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 z-50">
              <Command>
                <CommandInput placeholder="Search types..." />
                <CommandList>
                  <CommandEmpty>No results.</CommandEmpty>
                  <CommandGroup heading="Types">
                    <CommandItem onSelect={() => setSelectedTypes([])}>Clear</CommandItem>
                    <CommandItem onSelect={() => setSelectedTypes(types)}>Select all</CommandItem>
                    {types.map((t) => {
                      const selected = selectedTypes.includes(t);
                      return (
                        <CommandItem
                          key={t}
                          onSelect={() =>
                            setSelectedTypes((prev) =>
                              prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]
                            )
                          }
                        >
                          <div className="flex items-center gap-2">
                            <Check size={14} className={selected ? "opacity-100" : "opacity-0"} />
                            <span>{t}</span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <div className="ml-auto flex items-center gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search filings..."
              className="w-56 md:w-72"
            />
            {(selectedOrgs.length > 0 || selectedTypes.length > 0 || !!query) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedOrgs([]);
                  setSelectedTypes([]);
                  setQuery("");
                }}
              >
                Clear
              </Button>
            )}
            <span className="text-sm text-muted-foreground">Sort:</span>
            <Button variant="outline" size="sm" onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}>
              Date {sortDir === "desc" ? "↓" : "↑"}
            </Button>
          </div>
        </div>

        {/* Row 2: selected chips */}
        {(selectedOrgs.length > 0 || selectedTypes.length > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            {selectedOrgs.map((o) => (
              <Badge key={`org-${o}`} variant="secondary" className="px-2 py-1">
                <span className="mr-1">{o}</span>
                <button
                  type="button"
                  onClick={() => setSelectedOrgs((prev) => prev.filter((v) => v !== o))}
                  aria-label={`Remove ${o}`}
                  className="inline-flex"
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
            {selectedTypes.map((t) => (
              <Badge key={`type-${t}`} variant="secondary" className="px-2 py-1">
                <span className="mr-1">{t}</span>
                <button
                  type="button"
                  onClick={() => setSelectedTypes((prev) => prev.filter((v) => v !== t))}
                  aria-label={`Remove ${t}`}
                  className="inline-flex"
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
        )}
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
                        className="group flex items-center justify-between w-full rounded-md border bg-background px-3 py-2 hover:bg-gradient-primary hover:border-accent/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileIcon ext={a.attachment_file_extension} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{a.attachment_title}</div>
                            <div className="text-xs text-muted-foreground truncate">{a.attachment_file_name}</div>
                          </div>
                        </div>
                        <span
                          className={[buttonVariants({ size: "sm" }), "pointer-events-none", "group-hover:bg-gradient-primary"].join(" ")}
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
                        className="group flex items-center justify-between w-full rounded-md border bg-background px-3 py-2 hover:bg-gradient-primary hover:border-accent/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileIcon ext={a.attachment_file_extension} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{a.attachment_title}</div>
                            <div className="text-xs text-muted-foreground truncate">{a.attachment_file_name}</div>
                          </div>
                        </div>
                        <span
                          className={[buttonVariants({ size: "sm", variant: "outline" }), "pointer-events-none", "group-hover:bg-gradient-primary", "flex", "items-center", "gap-2"].join(" ")}
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
