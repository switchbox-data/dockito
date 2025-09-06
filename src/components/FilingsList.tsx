import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, FileArchive, FileSpreadsheet, FileText, Link as LinkIcon, Check, X, Eye, Users, Shapes, Calendar,
  Mail, FileBarChart, DollarSign, Heart, Gavel, ArrowRight, MessageSquare, 
  Bell, Scale, FileCheck, Presentation, ClipboardList, Megaphone, 
  FileType, Scale3D, FileSignature, Handshake, Paperclip, 
  AlertCircle, BookOpen, Lightbulb, Shield, MapPin, Settings, Search, Lock, HelpCircle, Mic, Play } from "lucide-react";
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

  // Default dates are the full range
  const defaultStartDate = useMemo(() => (months.length ? months[0] : undefined), [months]);
  const defaultEndDate = useMemo(() => (months.length ? months[months.length - 1] : undefined), [months]);
  
  // Check if current dates differ from defaults
  const isStartDateModified = useMemo(() => {
    if (!range || !months.length || !defaultStartDate) return false;
    const currentStart = months[range[0]];
    return currentStart.getTime() !== defaultStartDate.getTime();
  }, [range, months, defaultStartDate]);
  
  const isEndDateModified = useMemo(() => {
    if (!range || !months.length || !defaultEndDate) return false;
    const currentEnd = months[range[1]];
    return currentEnd.getTime() !== defaultEndDate.getTime();
  }, [range, months, defaultEndDate]);

  // Keyboard selection state
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedAttachmentIdx, setSelectedAttachmentIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const filingRefs = useRef<(HTMLDivElement | null)[]>([]);
  const attachmentRefs = useRef<Record<string, (HTMLButtonElement | HTMLAnchorElement | null)[]>>({});
  const didInitRef = useRef(false);

  const organizations = useMemo(() => {
    const set = new Set<string>();
    filings.forEach((f) => {
      f.organization_author_strings?.forEach((o) => set.add(o));
    });
    return Array.from(set).sort();
  }, [filings]);

  const types = useMemo(() => {
    const set = new Set<string>();
    filings.forEach((f) => {
      if (f.filling_type) set.add(f.filling_type);
    });
    return Array.from(set).sort();
  }, [filings]);

  const typePalette = [
    "bg-primary/10 text-primary", 
    "bg-destructive/10 text-destructive", 
    "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400", 
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400", 
    "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400", 
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400", 
    "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400", 
    "bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400", 
    "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
  ];

  const filtered = useMemo(() => {
    let list = [...filings];
    if (selectedOrgs.length)
      list = list.filter((f) => f.organization_author_strings?.some((o) => selectedOrgs.includes(o)));
    if (selectedTypes.length)
      list = list.filter((f) => f.filling_type && selectedTypes.includes(f.filling_type));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((f) => {
        const inFiling =
          (f.filling_name?.toLowerCase().includes(q) ?? false) ||
          (f.filling_description?.toLowerCase().includes(q) ?? false) ||
          (f.filling_type?.toLowerCase().includes(q) ?? false) ||
          f.organization_author_strings?.some((o) => o.toLowerCase().includes(q));

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
  useEffect(() => {
    setSelectedIndex(prev => Math.min(prev, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  const getFilingTypeColor = (type: string) => {
    const index = types.indexOf(type);
    return typePalette[index % typePalette.length];
  };

  return (
    <div className="space-y-4">
      <section ref={containerRef} className="space-y-4 focus-visible:outline-none">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <Input
            ref={searchRef}
            type="text"
            placeholder="Search filings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 min-w-0"
          />
          
          <Popover open={orgOpen} onOpenChange={setOrgOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="shrink-0 justify-between hover:border-primary/30" disabled={!organizations.length}>
                <span className="inline-flex items-center gap-2">
                  <Users size={16} className="text-muted-foreground" />
                  Organizations
                </span>
                <ChevronDown size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 z-50 bg-popover border" align="start">
              <Command>
                <CommandInput placeholder="Search organizations..." />
                <CommandList>
                  <CommandEmpty>No organizations found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="__clear__"
                      onSelect={() => {
                        setSelectedOrgs([]);
                        setOrgOpen(false);
                      }}
                      className="border-b"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <X size={14} className="text-muted-foreground" />
                        <span className="font-medium">Clear all</span>
                      </div>
                    </CommandItem>
                    {organizations.map((o) => {
                      const selected = selectedOrgs.includes(o);
                      return (
                        <CommandItem
                          key={o}
                          value={o}
                          onSelect={() => {
                            setSelectedOrgs(prev => 
                              prev.includes(o) ? prev.filter(v => v !== o) : [...prev, o]
                            );
                          }}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <Check size={14} className={selected ? "opacity-100 text-primary" : "opacity-0"} />
                            <Users size={14} className="text-muted-foreground flex-shrink-0" />
                            <span className="flex-1 truncate">{o}</span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Popover open={typeOpen} onOpenChange={setTypeOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="shrink-0 justify-between hover:border-primary/30" disabled={!types.length}>
                <span className="inline-flex items-center gap-2">
                  <Shapes size={16} className="text-muted-foreground" />
                  Types
                </span>
                <ChevronDown size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4 z-50 bg-popover border" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Filing Types</h4>
                  <Button size="sm" onClick={() => setTypeOpen(false)}>Done</Button>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {types.map((t) => {
                    const Icon = FileText;
                    const selected = selectedTypes.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => setSelectedTypes(prev => prev.includes(t) ? prev.filter(v => v !== t) : [...prev, t])}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md border transition-colors text-left",
                          selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        )}
                      >
                         <Icon className={cn("h-4 w-4 flex-shrink-0", getFilingTypeColor(t))} />
                         <div className="min-w-0 flex-1">
                           <div className="font-medium text-sm truncate">{t}</div>
                         </div>
                       </button>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Date range (months) */}
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[180px] justify-between shrink-0 hover:border-primary/30" disabled={months.length <= 1}>
                <span className="inline-flex items-center gap-2">
                  <Calendar size={16} className="text-muted-foreground" />
                  Dates
                </span>
                <ChevronDown size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-4 z-50 bg-popover border" align="end">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Select month range</h4>
                <div className="space-y-3">
                  {/* Year ticks when crossing year boundaries */}
                  {(() => {
                    if (!months.length || months.length <= 1) return null;
                    
                    // Calculate year span to determine label frequency
                    const years = months.map(m => m.getFullYear());
                    const minYear = Math.min(...years);
                    const maxYear = Math.max(...years);
                    const yearSpan = maxYear - minYear;
                    
                    // Determine interval based on span to avoid overcrowding
                    let interval: number;
                    if (yearSpan <= 2) return null; // Too small, no labels needed
                    else if (yearSpan <= 5) interval = 1; // Show every year
                    else if (yearSpan <= 15) interval = 2; // Show every 2 years
                    else if (yearSpan <= 30) interval = 5; // Show every 5 years
                    else interval = 10; // Show every 10 years for very large ranges
                    
                    // Find January positions for years that should be labeled
                    const labelPositions: { year: number; position: number }[] = [];
                    for (let i = 0; i < months.length; i++) {
                      const d = months[i];
                      if (d.getMonth() === 0) { // January
                        const year = d.getFullYear();
                        // Only show if year is on our interval
                        if ((year - minYear) % interval === 0) {
                          labelPositions.push({
                            year,
                            position: (i / (months.length - 1)) * 100,
                          });
                        }
                      }
                    }
                    
                    if (!labelPositions.length) return null;

                    return (
                      <div className="relative h-6 mb-2">
                        {labelPositions.map(({ year, position }) => (
                          <div
                            key={year}
                            className="absolute text-xs text-muted-foreground font-mono transform -translate-x-1/2"
                            style={{ left: `${position}%`, top: 0 }}
                          >
                            {year}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Range:</span>
                    <Slider
                      value={range || [0, Math.max(0, months.length - 1)]}
                      onValueChange={(v) => setRange([v[0], v[1]])}
                      max={Math.max(0, months.length - 1)}
                      step={1}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{months.length && range ? format(months[range[0]], "MMM yyyy") : "–"}</span>
                    <span>{months.length && range ? format(months[range[1]], "MMM yyyy") : "–"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={() => setRange([0, months.length - 1])}>Reset</Button>
                  <Button size="sm" onClick={() => setDateOpen(false)}>Done</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="shrink-0">
          <Button variant="outline" className="hover:border-primary/30" onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}>
            {sortDir === "desc" ? "↓" : "↑"} Date
          </Button>
        </div>
      </div>
      </section>

      <section aria-label="Filters" className="space-y-2">
      {/* Active filter chips */}
      <div className="flex flex-wrap items-center gap-2 text-sm px-1">
        {selectedOrgs.map((o) => (
          <Badge key={`org-${o}`} variant="secondary" className="px-2 py-1">
            <div className="flex items-center gap-1.5 mr-1">
              <Users size={12} className="text-muted-foreground" />
              <span>Organization: {o}</span>
            </div>
            <button
              type="button"
              aria-label={`Remove organization ${o}`}
              onClick={() => setSelectedOrgs((prev) => prev.filter((v) => v !== o))}
              className="inline-flex"
            >
              <X size={12} />
            </button>
          </Badge>
        ))}
        {selectedTypes.map((t) => (
          <Badge key={`type-${t}`} variant="secondary" className="px-2 py-1">
            <div className="flex items-center gap-1.5 mr-1">
              <Shapes size={12} className="text-muted-foreground" />
              <span>Type: {t}</span>
            </div>
            <button
              type="button"
              aria-label={`Remove type ${t}`}
              onClick={() => setSelectedTypes((prev) => prev.filter((v) => v !== t))}
              className="inline-flex"
            >
              <X size={12} />
            </button>
          </Badge>
        ))}
        {query.trim() && (
          <Badge variant="secondary" className="px-2 py-1">
            <div className="flex items-center gap-1.5 mr-1">
              <Search size={12} className="text-muted-foreground" />
              <span>Search: {query}</span>
            </div>
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="inline-flex"
            >
              <X size={12} />
            </button>
          </Badge>
        )}
        {isStartDateModified && (
          <Badge variant="secondary" className="px-2 py-1">
            <div className="flex items-center gap-1.5 mr-1">
              <Calendar size={12} className="text-muted-foreground" />
              <span>Started after: {range && months.length ? format(months[range[0]], "MMM yyyy") : "–"}</span>
            </div>
            <button
              type="button"
              aria-label="Reset start date"
              onClick={() => setRange(prev => prev && months.length ? [0, prev[1]] : null)}
              className="inline-flex"
            >
              <X size={12} />
            </button>
          </Badge>
        )}
        {isEndDateModified && (
          <Badge variant="secondary" className="px-2 py-1">
            <div className="flex items-center gap-1.5 mr-1">
              <Calendar size={12} className="text-muted-foreground" />
              <span>Started before: {range && months.length ? format(months[range[1]], "MMM yyyy") : "–"}</span>
            </div>
            <button
              type="button"
              aria-label="Reset end date"
              onClick={() => setRange(prev => prev && months.length ? [prev[0], months.length - 1] : null)}
              className="inline-flex"
            >
              <X size={12} />
            </button>
          </Badge>
        )}
      </div>
    </section>

    <section className="space-y-4">
      <div className="space-y-2">
        {filtered.map((f, idx) => {
          const isOpen = openIds.has(f.uuid);
          const isSelected = selectedIndex === idx;
          return (
            <article ref={(el: HTMLDivElement | null) => { filingRefs.current[idx] = el; }} key={f.uuid} className={cn("rounded-lg border p-3 transition-colors hover:border-primary/30 group", isSelected ? "bg-muted" : "bg-card")}>
              <div className="relative">
                <button
                  className={cn(
                    "w-full flex items-center gap-3 text-left rounded-md px-2 py-1 transition-colors relative z-10"
                  )}
                  onClick={() => { 
                    setSelectedIndex(idx); 
                    setSelectedAttachmentIdx(isOpen ? null : (f.attachments.length ? 0 : null)); 
                    setOpenIds((prev) => { 
                      const next = new Set(prev); 
                      if (isOpen) next.delete(f.uuid); 
                      else next.add(f.uuid); 
                      return next; 
                    }); 
                  }}
                  aria-expanded={isOpen}
                >
                  {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {f.organization_author_strings?.slice(0, 2).map((org, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-background border-gray-300">
                            {org}
                          </Badge>
                        )) || <span>—</span>}
                      </div>
                      <span className="text-sm text-muted-foreground">{format(new Date(f.filed_date), "PPP")}</span>
                    </div>
                    <h3 className="font-medium leading-tight mb-3">{f.filling_name ?? f.filling_type ?? "Filing"}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {f.filling_type && (
                        <Badge variant="outline" className={cn("text-xs", getFilingTypeColor(f.filling_type))}>
                          {f.filling_type}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {f.attachments.length} attachment{f.attachments.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Divider when expanded */}
                {isOpen && f.attachments.length > 0 && (
                  <div className="mt-3 mb-3 mx-2 border-t border-border/30"></div>
                )}

                {/* Attachments */}
                {isOpen && (
                  <div className="space-y-2 mx-2">
                    {f.attachments.length === 0 && (
                      <div className="text-sm text-muted-foreground">No attachments.</div>
                    )}
                    {f.attachments.map((a: any, idx) => {
                      const isSelectedAtt = selectedIndex === idx && selectedAttachmentIdx === idx;
                      const isPdf = a.attachment_file_extension.toLowerCase() === 'pdf';
                      
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
                              "group/att flex items-start justify-between w-full text-left rounded-md border bg-background px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                              isSelectedAtt ? "border-primary" : "hover:border-primary/30"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <FileIcon ext={a.attachment_file_extension} />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-normal leading-snug text-foreground break-words">{a.attachment_title}</div>
                              </div>
                            </div>
                            <span className={[buttonVariants({ size: "sm", variant: "outline" }), "pointer-events-none flex items-center gap-2 leading-none shrink-0 ml-3", "group-hover/att:border-primary/30", isSelectedAtt ? "bg-muted text-foreground border-muted-foreground/20" : ""].join(" ")}>
                              <Eye size={16} aria-hidden="true" />
                              <span>Open</span>
                            </span>
                          </button>
                        );
                      }

                      return (
                        <a
                          key={a.uuid}
                          href={a.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          ref={(el) => {
                            if (!attachmentRefs.current[f.uuid]) attachmentRefs.current[f.uuid] = [];
                            attachmentRefs.current[f.uuid][idx] = el;
                          }}
                          data-selected={isSelectedAtt}
                          className={cn(
                            "group/att flex items-start justify-between w-full text-left rounded-md border bg-background px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                            isSelectedAtt ? "border-primary" : "hover:border-primary/30"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileIcon ext={a.attachment_file_extension} />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-normal leading-snug text-foreground break-words">{a.attachment_title}</div>
                            </div>
                          </div>
                          <span className={[buttonVariants({ size: "sm", variant: "outline" }), "pointer-events-none flex items-center gap-2 shrink-0 ml-3", "group-hover/att:border-primary/30", isSelectedAtt ? "bg-primary text-primary-foreground border-primary" : ""].join(" ")}>
                            <LinkIcon size={16} /> Download
                          </span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>

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
    </div>
  );
};

const FileIcon = ({ ext }: { ext: string }) => {
  const e = ext.toLowerCase();
  if (e === "pdf") return <FileText className="text-foreground/80" size={18} />;
  if (e === "xlsx" || e === "xls") return <FileSpreadsheet className="text-foreground/80" size={18} />;
  if (e === "zip") return <FileArchive className="text-foreground/80" size={18} />;
  return <FileText className="text-foreground/80" size={18} />;
};