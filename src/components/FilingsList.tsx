import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, FileArchive, FileSpreadsheet, FileText, Link as LinkIcon, Check, X, Eye, Users, Shapes, Calendar } from "lucide-react";
import { Attachment, Filling } from "@/data/mock";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PDFViewerModal } from "@/components/PDFViewerModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
export type FilingWithAttachments = Filling & { attachments: Attachment[] };

type Props = {
  filings: FilingWithAttachments[];
};

export const FilingsList = ({ filings }: Props) => {
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [viewer, setViewer] = useState<{ filingId: string; index: number } | null>(null);
  const [orgOpen, setOrgOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const location = useLocation();
const navigate = useNavigate();

  const searchRef = useRef<HTMLInputElement>(null);
const [dateOpen, setDateOpen] = useState(false);
const [range, setRange] = useState<[number, number] | null>(null);
const months = useMemo(() => {
  if (!filings?.length) return [] as Date[];
  const times = filings
    .map((f) => new Date(f.filed_date))
    .filter((d) => !isNaN(d.getTime()));
  if (!times.length) return [] as Date[];
  let min = times[0], max = times[0];
  for (const d of times) { if (d < min) min = d; if (d > max) max = d; }
  const out: Date[] = [];
  let d = startOfMonth(min);
  const end = startOfMonth(max);
  while (d <= end) { out.push(d); d = addMonths(d, 1); }
  return out;
}, [filings]);
useEffect(() => { if (months.length && !range) setRange([0, months.length - 1]); }, [months, range]);
const isFullRange = useMemo(() => !!(range && months.length && range[0] === 0 && range[1] === months.length - 1), [range, months]);

  // Keyboard selection state
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedAttachmentIdx, setSelectedAttachmentIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const filingRefs = useRef<(HTMLDivElement | null)[]>([]);
  const attachmentRefs = useRef<Record<string, (HTMLButtonElement | HTMLAnchorElement | null)[]>>({});

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

  const typePalette = ["bg-accent/10 text-accent", "bg-accent/15 text-accent", "bg-accent/20 text-accent", "bg-accent/25 text-accent"];
  const typeClass = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) { hash = (hash + name.charCodeAt(i)) % 1000; }
    return typePalette[hash % typePalette.length];
  };

  const filtered = useMemo(() => {
    let list = [...filings];
    if (selectedOrgs.length)
      list = list.filter((f) => f.organization_author_strings.some((o) => selectedOrgs.includes(o)));
    if (selectedTypes.length)
      list = list.filter((f) => f.filling_type && selectedTypes.includes(f.filling_type));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((f) => {
        const inFiling =
          (f.filling_name?.toLowerCase().includes(q) ?? false) ||
          (f.filling_description?.toLowerCase().includes(q) ?? false) ||
          (f.filling_type?.toLowerCase().includes(q) ?? false) ||
          f.organization_author_strings.some((o) => o.toLowerCase().includes(q));

        const inAttachments = f.attachments.some((a: any) =>
          (a.attachment_title?.toLowerCase().includes(q) ?? false) ||
          (a.attachment_file_name?.toLowerCase().includes(q) ?? false) ||
          (a.attachment_file_extension?.toLowerCase().includes(q) ?? false) ||
          (a.attachment_type?.toLowerCase().includes(q) ?? false) ||
          (a.attachment_subtype?.toLowerCase().includes(q) ?? false)
        );

        return inFiling || inAttachments;
      });
    }
    // Month range filter
    if (range && months.length) {
      const from = startOfMonth(months[range[0]]);
      const to = endOfMonth(months[range[1]]);
      list = list.filter((f) => {
        const t = new Date(f.filed_date).getTime();
        return t >= from.getTime() && t <= to.getTime();
      });
    }
    list.sort((a, b) =>
      sortDir === "desc"
        ? new Date(b.filed_date).getTime() - new Date(a.filed_date).getTime()
        : new Date(a.filed_date).getTime() - new Date(b.filed_date).getTime()
    );
    return list;
  }, [filings, selectedOrgs, selectedTypes, query, sortDir, range, months]);

  useEffect(() => {
    // Close viewer if active filing disappears (filter changed)
    if (viewer && !filtered.find(f => f.uuid === viewer.filingId)) {
      setViewer(null);
    }
  }, [filtered, viewer]);

  // Focus and clamp selection
  useEffect(() => { containerRef.current?.focus(); }, []);
  useEffect(() => {
    if (!filtered.length) { setSelectedIndex(0); setSelectedAttachmentIdx(null); return; }
    if (selectedIndex > filtered.length - 1) setSelectedIndex(filtered.length - 1);
    const filing = filtered[Math.min(selectedIndex, filtered.length - 1)];
    const attCount = filing ? filing.attachments.length : 0;
    if (selectedAttachmentIdx !== null && selectedAttachmentIdx >= attCount) setSelectedAttachmentIdx(attCount ? attCount - 1 : null);
  }, [filtered, selectedIndex, selectedAttachmentIdx]);

  // Refocus the keyboard container after the PDF modal closes
  useEffect(() => {
    if (!viewer) containerRef.current?.focus();
  }, [viewer]);

  const scrollFilingIntoView = (idx: number) => {
    const el = filingRefs.current[idx];
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  const scrollAttachmentIntoView = (filingId: string, attIdx: number) => {
    const el = attachmentRefs.current[filingId]?.[attIdx];
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (viewer) return;
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    // Quick keys
    if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); return; }
    if (e.key.toLowerCase() === 'o') { e.preventDefault(); setOrgOpen(true); return; }
    if (e.key.toLowerCase() === 't') { e.preventDefault(); setTypeOpen(true); return; }
    if (e.key.toLowerCase() === 's') { e.preventDefault(); setSortDir((d) => (d === 'desc' ? 'asc' : 'desc')); return; }
    if (e.key.toLowerCase() === 'd') { e.preventDefault(); setDateOpen(true); return; }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectedAttachmentIdx !== null) {
        if (selectedAttachmentIdx > 0) {
          setSelectedAttachmentIdx(selectedAttachmentIdx - 1);
          const filing = filtered[selectedIndex];
          if (filing) scrollAttachmentIntoView(filing.uuid, selectedAttachmentIdx - 1);
        } else if (selectedIndex > 0) {
          const prev = filtered[selectedIndex - 1];
          setSelectedIndex(selectedIndex - 1);
          if (prev && openIds.has(prev.uuid) && prev.attachments.length) {
            const last = prev.attachments.length - 1;
            setSelectedAttachmentIdx(last);
            scrollAttachmentIntoView(prev.uuid, last);
          } else {
            setSelectedAttachmentIdx(null);
            scrollFilingIntoView(selectedIndex - 1);
          }
        }
      } else if (selectedIndex > 0) {
        const prev = filtered[selectedIndex - 1];
        setSelectedIndex(selectedIndex - 1);
        if (prev && openIds.has(prev.uuid) && prev.attachments.length) {
          const last = prev.attachments.length - 1;
          setSelectedAttachmentIdx(last);
          scrollAttachmentIntoView(prev.uuid, last);
        } else {
          setSelectedAttachmentIdx(null);
          scrollFilingIntoView(selectedIndex - 1);
        }
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const filing = filtered[selectedIndex];
      if (filing && openIds.has(filing.uuid)) {
        const total = filing.attachments.length;
        if (selectedAttachmentIdx === null) {
          if (total) {
            setSelectedAttachmentIdx(0);
            scrollAttachmentIntoView(filing.uuid, 0);
          } else if (selectedIndex < filtered.length - 1) {
            const nextF = filtered[selectedIndex + 1];
            setSelectedIndex(selectedIndex + 1);
            if (nextF && openIds.has(nextF.uuid) && nextF.attachments.length) {
              setSelectedAttachmentIdx(0);
              scrollAttachmentIntoView(nextF.uuid, 0);
            } else {
              setSelectedAttachmentIdx(null);
              scrollFilingIntoView(selectedIndex + 1);
            }
          }
        } else {
          if (selectedAttachmentIdx < total - 1) {
            setSelectedAttachmentIdx(selectedAttachmentIdx + 1);
            scrollAttachmentIntoView(filing.uuid, selectedAttachmentIdx + 1);
          } else if (selectedIndex < filtered.length - 1) {
            const nextF = filtered[selectedIndex + 1];
            setSelectedIndex(selectedIndex + 1);
            if (nextF && openIds.has(nextF.uuid) && nextF.attachments.length) {
              setSelectedAttachmentIdx(0);
              scrollAttachmentIntoView(nextF.uuid, 0);
            } else {
              setSelectedAttachmentIdx(null);
              scrollFilingIntoView(selectedIndex + 1);
            }
          }
        }
      } else if (selectedIndex < filtered.length - 1) {
        const nextF = filtered[selectedIndex + 1];
        setSelectedIndex(selectedIndex + 1);
        if (nextF && openIds.has(nextF.uuid) && nextF.attachments.length) {
          setSelectedAttachmentIdx(0);
          scrollAttachmentIntoView(nextF.uuid, 0);
        } else {
          setSelectedAttachmentIdx(null);
          scrollFilingIntoView(selectedIndex + 1);
        }
      }
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const filing = filtered[selectedIndex];
      if (filing) {
        setOpenIds((prev) => {
          const next = new Set(prev);
          next.add(filing.uuid);
          return next;
        });
        const total = filing.attachments.length;
        setSelectedAttachmentIdx(total ? 0 : null);
        if (total) scrollAttachmentIntoView(filing.uuid, 0);
      }
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const filing = filtered[selectedIndex];
      if (filing && openIds.has(filing.uuid)) {
        setSelectedAttachmentIdx(null);
        setOpenIds((prev) => {
          const next = new Set(prev);
          next.delete(filing.uuid);
          return next;
        });
        scrollFilingIntoView(selectedIndex);
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const filing = filtered[selectedIndex];
      if (!filing) return;
      if (selectedAttachmentIdx !== null) {
        const att = filing.attachments[selectedAttachmentIdx];
        if (att) {
          const isPdf = att.attachment_file_extension.toLowerCase() === 'pdf';
          if (isPdf) {
            setViewer({ filingId: filing.uuid, index: selectedAttachmentIdx });
          } else {
            const el = attachmentRefs.current[filing.uuid]?.[selectedAttachmentIdx] as HTMLAnchorElement | undefined;
            el?.click?.();
          }
        }
      } else {
        setOpenIds((prev) => {
          const next = new Set(prev);
          next.add(filing.uuid);
          return next;
        });
        const total = filing.attachments.length;
        setSelectedAttachmentIdx(total ? 0 : null);
        if (total) scrollAttachmentIntoView(filing.uuid, 0);
      }
      return;
    }
  };

  return (
    <section ref={containerRef} tabIndex={0} onKeyDown={onKeyDown} className="mt-6 outline-none">
      <div className="sticky top-0 z-40 bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur border-b mb-3 space-y-2 py-2">
        {/* Row 1: controls */}
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search filings..."
            className="flex-1 w-40 md:w-56 transition-[width] duration-200 focus:w-72 md:focus:w-[36rem] hover:border-primary/30"
            onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); (e.currentTarget as HTMLInputElement).blur(); containerRef.current?.focus(); } }}
          />

          <span className="ml-auto text-sm text-muted-foreground">Filter:</span>
          <Popover open={orgOpen} onOpenChange={setOrgOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[160px] justify-between hover:border-primary/30">
                <span className="inline-flex items-center gap-2">
                  <Users size={16} className="text-muted-foreground" />
                  {selectedOrgs.length ? `Organizations (${selectedOrgs.length})` : "Organizations"}
                </span>
                <ChevronDown size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 z-50 bg-popover border">
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
              <Button variant="outline" size="sm" className="min-w-[160px] justify-between hover:border-primary/30">
                <span className="inline-flex items-center gap-2">
                  <Shapes size={16} className="text-muted-foreground" />
                  {selectedTypes.length ? `Types (${selectedTypes.length})` : "Types"}
                </span>
                <ChevronDown size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 z-50 bg-popover border">
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
                              <Badge variant="outline" className={cn("px-2 py-0.5", typeClass(t))}>{t}</Badge>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Date range (months) */}
          <Dialog open={dateOpen} onOpenChange={setDateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[180px] justify-between shrink-0 hover:border-primary/30" disabled={months.length <= 1}>
                <span className="inline-flex items-center gap-2">
                  <Calendar size={16} className="text-muted-foreground" />
                  {months.length === 1 ? format(months[0], "MMM yyyy") : months.length && range ? `${format(months[range[0]], "MMM yyyy")} – ${format(months[range[1]], "MMM yyyy")}` : "–"}
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[620px]">
              <DialogHeader>
                <DialogTitle>Select month range</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Slider
                  value={range ?? [0, Math.max(0, (months.length || 1) - 1)]}
                  min={0}
                  max={Math.max(0, (months.length || 1) - 1)}
                  step={1}
                  onValueChange={(v) => setRange([v[0], v[1]] as [number, number])}
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{months.length && range ? format(months[range[0]], "MMM yyyy") : "–"}</span>
                  <span>{months.length && range ? format(months[range[1]], "MMM yyyy") : "–"}</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setRange(months.length ? [0, months.length - 1] : null)}>Reset</Button>
                <Button onClick={() => setDateOpen(false)}>Done</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="ml-2 flex items-center gap-2">
            {(selectedOrgs.length > 0 || selectedTypes.length > 0 || !!query || !isFullRange) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedOrgs([]);
                  setSelectedTypes([]);
                  setQuery("");
                  setRange(months.length ? [0, months.length - 1] : null);
                }}
              >
                Clear
              </Button>
            )}
            <span className="text-sm text-muted-foreground">Sort:</span>
            <Button variant="outline" size="sm" className="hover:border-primary/30" onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}>
              {sortDir === "desc" ? "↓" : "↑"} Date
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
              <Badge key={`type-${t}`} variant="outline" className={cn("px-2 py-1", typeClass(t))}>
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
        {filtered.map((f, idx) => {
          const isOpen = openIds.has(f.uuid);
          const isSelected = selectedIndex === idx;
          return (
            <article ref={(el: HTMLDivElement | null) => { filingRefs.current[idx] = el; }} key={f.uuid} className={cn("rounded-lg border p-3 transition-colors hover:border-primary/30", isSelected ? "bg-muted" : "bg-card")}>
              <button
              className={cn(
                "w-full flex items-center gap-3 text-left rounded-md px-2 py-1 transition-colors"
              )}
                onClick={() => { setSelectedIndex(idx); setSelectedAttachmentIdx(isOpen ? null : (f.attachments.length ? 0 : null)); setOpenIds((prev) => { const next = new Set(prev); if (isOpen) next.delete(f.uuid); else next.add(f.uuid); return next; }); }}
                aria-expanded={isOpen}
              >
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium leading-tight">{f.filling_name ?? f.filling_type ?? "Filing"}</h3>
                    {f.filling_type && <Badge variant="outline" className={cn("px-2 py-0.5", typeClass(f.filling_type))}>{f.filling_type}</Badge>}
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
                    const isSelectedAtt = isSelected && selectedAttachmentIdx === idx;
                    if (isPdf) {
                      return (
                        <button
                          key={a.uuid}
                          type="button"
                          ref={(el) => {
                            if (!attachmentRefs.current[f.uuid]) attachmentRefs.current[f.uuid] = [];
                            attachmentRefs.current[f.uuid][idx] = el;
                          }}
                          onClick={() => setViewer({ filingId: f.uuid, index: idx })}
                          data-selected={isSelectedAtt}
                          className={cn(
                              "group flex items-center justify-between w-full rounded-md border bg-background px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background hover:border-primary/30",
                              isSelectedAtt ? "border-primary" : undefined
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileIcon ext={a.attachment_file_extension} />
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{a.attachment_title}</div>
                              <div className="text-xs text-muted-foreground truncate">{a.attachment_file_name}</div>
                            </div>
                          </div>
                          <span className={[buttonVariants({ size: "sm", variant: "outline" }), "pointer-events-none flex items-center gap-2 leading-none", "group-hover:border-primary/30", isSelectedAtt ? "bg-primary text-primary-foreground border-primary" : ""].join(" ")}> <Eye size={16} aria-hidden="true" /><span>Open</span></span>
                        </button>
                      );
                    }
                    return (
                      <a
                        key={a.uuid}
                        ref={(el) => {
                          if (!attachmentRefs.current[f.uuid]) attachmentRefs.current[f.uuid] = [];
                          attachmentRefs.current[f.uuid][idx] = el;
                        }}
                          href={a.attachment_url ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                            data-selected={isSelectedAtt}
                            className={cn(
                              "group flex items-center justify-between w-full rounded-md border bg-background px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background hover:border-primary/30",
                              isSelectedAtt ? "border-primary" : undefined
                            )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileIcon ext={a.attachment_file_extension} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{a.attachment_title}</div>
                            <div className="text-xs text-muted-foreground truncate">{a.attachment_file_name}</div>
                          </div>
                        </div>
                          <span className={[buttonVariants({ size: "sm", variant: "outline" }), "pointer-events-none flex items-center gap-2", "group-hover:border-primary/30", isSelectedAtt ? "bg-primary text-primary-foreground border-primary" : ""].join(" ")}>
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
