import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronDown, Check, X } from "lucide-react";

const PAGE_SIZE = 30;

type Docket = {
  uuid: string;
  docket_govid: string;
  docket_title: string | null;
  docket_description: string | null;
  industry: string | null;
  petitioner: string | null;
  opened_date: string;
  docket_subtype: string | null;
  current_status: string | null;
};

const sanitize = (s: string) => s.replace(/[,%]/g, " ").trim();

function useDateBounds() {
  return useQuery({
    queryKey: ["dockets-date-bounds"],
    queryFn: async () => {
      const [{ data: minRow, error: minErr }, { data: maxRow, error: maxErr }] = await Promise.all([
        supabase.from("dockets").select("opened_date").order("opened_date", { ascending: true }).limit(1).maybeSingle(),
        supabase.from("dockets").select("opened_date").order("opened_date", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (minErr) throw minErr;
      if (maxErr) throw maxErr;
      const min = minRow?.opened_date ? new Date(minRow.opened_date) : null;
      const max = maxRow?.opened_date ? new Date(maxRow.opened_date) : null;
      return { min, max } as { min: Date | null; max: Date | null };
    },
  });
}

function monthsBetween(min: Date, max: Date) {
  const out: Date[] = [];
  let d = startOfMonth(min);
  const end = startOfMonth(max);
  while (d <= end) {
    out.push(d);
    d = addMonths(d, 1);
  }
  return out;
}

export default function DocketsPage() {
  const [search, setSearch] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [industryOpen, setIndustryOpen] = useState(false);
  const [docketTypes, setDocketTypes] = useState<string[]>([]);
  const [petitioners, setPetitioners] = useState<string[]>([]);
  const [typeOpen, setTypeOpen] = useState(false);
  const [petOpen, setPetOpen] = useState(false);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>();
  const [dateOpen, setDateOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const navigate = useNavigate();

  // Date slider uses month indices
  const { data: bounds } = useDateBounds();
  const months = useMemo(() => {
    if (!bounds?.min || !bounds?.max) return [] as Date[];
    return monthsBetween(bounds.min, bounds.max);
  }, [bounds]);
  const [range, setRange] = useState<[number, number] | null>(null);

  // Initialize range once bounds are known
  useEffect(() => {
    if (months.length && !range) {
      setRange([Math.max(0, months.length - Math.min(12, months.length)), months.length - 1]);
    }
  }, [months, range]);

  const startDate = useMemo(() => (range && months.length ? months[range[0]] : undefined), [range, months]);
  const endDate = useMemo(() => (range && months.length ? months[range[1]] : undefined), [range, months]);

  const normalizedSearch = useMemo(() => sanitize(search), [search]);

  const { data: industries = [] } = useQuery<string[]>({
    queryKey: ["docket-industries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dockets").select("industry").not("industry", "is", null);
      if (error) throw error;
      const set = new Set<string>();
      (data as { industry: string | null }[]).forEach((r) => {
        if (r.industry) set.add(r.industry);
      });
      return Array.from(set).sort();
    },
    staleTime: 60_000,
  });

  const { data: docketTypeOptions = [] } = useQuery<string[]>({
    queryKey: ["docket-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dockets")
        .select("docket_subtype")
        .not("docket_subtype", "is", null);
      if (error) throw error;
      const set = new Set<string>();
      (data as { docket_subtype: string | null }[]).forEach((r) => {
        if (r.docket_subtype) set.add(r.docket_subtype);
      });
      return Array.from(set).sort();
    },
    staleTime: 60_000,
  });

  const { data: petitionerOptions = [] } = useQuery<{ name: string; count: number }[]>({
    queryKey: [
      "petitioners-ranked",
      {
        industries: selectedIndustries.join(","),
        docketTypes: docketTypes.join(","),
        start: startDate?.toISOString(),
        end: endDate?.toISOString(),
        search: normalizedSearch,
      },
    ],
    queryFn: async () => {
      let q: any = supabase
        .from("dockets")
        .select("petitioner")
        .not("petitioner", "is", null);

      if (normalizedSearch) {
        q = q.or(
          `docket_govid.ilike.%${normalizedSearch}%,docket_description.ilike.%${normalizedSearch}%,petitioner.ilike.%${normalizedSearch}%`
        );
      }
      if (selectedIndustries.length) q = q.in("industry", selectedIndustries);
      if (docketTypes.length) q = q.in("docket_subtype", docketTypes);
      if (startDate) q = q.gte("opened_date", format(startOfMonth(startDate), "yyyy-MM-dd"));
      if (endDate) q = q.lte("opened_date", format(endOfMonth(endDate!), "yyyy-MM-dd"));

      const { data, error } = await q.limit(10000);
      if (error) throw error;
      const counts = new Map<string, number>();
      ((data ?? []) as { petitioner: string | null }[]).forEach((r) => {
        if (r.petitioner) counts.set(r.petitioner, (counts.get(r.petitioner) ?? 0) + 1);
      });
      return Array.from(counts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name));
    },
    staleTime: 30_000,
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<Docket[], Error>({
    queryKey: [
      "dockets-list",
      { search: normalizedSearch, industries: selectedIndustries.join(","), docketTypes: docketTypes.join(","), petitioners: petitioners.join(","), sortDir, start: startDate?.toISOString(), end: endDate?.toISOString() },
    ],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage?.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined),
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      let q = supabase
        .from("dockets")
        .select("uuid,docket_govid,docket_title,docket_description,industry,petitioner,opened_date,docket_subtype,current_status")
        .order("opened_date", { ascending: sortDir === "asc" })
        .range(offset, offset + PAGE_SIZE - 1);

      if (normalizedSearch) {
        q = q.or(
          `docket_govid.ilike.%${normalizedSearch}%,docket_description.ilike.%${normalizedSearch}%,petitioner.ilike.%${normalizedSearch}%`
        );
      }
      if (selectedIndustries.length) q = q.in("industry", selectedIndustries);
      if (docketTypes.length) q = q.in("docket_subtype", docketTypes);
      if (petitioners.length) q = q.in("petitioner", petitioners);
      if (startDate) q = q.gte("opened_date", format(startOfMonth(startDate), "yyyy-MM-dd"));
      if (endDate) q = q.lte("opened_date", format(endOfMonth(endDate!), "yyyy-MM-dd"));

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Docket[];
    },
    enabled: !!(range && months.length),
    staleTime: 30_000,
  });

  // Prefetch logic: load page 2 immediately after first page, then keep one page ahead after user-triggered fetches
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const userTriggeredRef = useRef(false);

  useEffect(() => {
    if (!isLoading && data?.pages?.length === 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage(); // prefetch page 2
    }
  }, [isLoading, data?.pages?.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && hasNextPage && !isFetchingNextPage) {
          userTriggeredRef.current = true;
          fetchNextPage();
        }
      });
    }, { rootMargin: "800px" }); // trigger early to feel instant
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    // After a user-triggered fetch completes, prefetch one more if available
    if (userTriggeredRef.current && !isFetchingNextPage && hasNextPage) {
      userTriggeredRef.current = false;
      fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  useEffect(() => {
    document.title = "NY PSC Dockets | Dockito";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Browse and filter New York PSC dockets by industry, type, dates, and more.");
  }, []);

  const pages = (data?.pages ?? []) as Docket[][];
  const items = pages.flat();

  // Focus container on mount
  useEffect(() => { containerRef.current?.focus(); }, []);

  // Keep selection in range
  useEffect(() => {
    if (selectedIdx > items.length - 1) setSelectedIdx(items.length ? items.length - 1 : 0);
  }, [items, selectedIdx]);

  const scrollSelectedIntoView = (idx: number) => {
    const el = cardRefs.current[idx];
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    // quick keys
    if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); return; }
    if (e.key.toLowerCase() === 'p') { e.preventDefault(); setPetOpen(true); return; }
    if (e.key.toLowerCase() === 'i') { e.preventDefault(); setIndustryOpen(true); return; }
    if (e.key.toLowerCase() === 't') { e.preventDefault(); setTypeOpen(true); return; }
    if (e.key.toLowerCase() === 's') { e.preventDefault(); setSortDir((d) => (d === 'desc' ? 'asc' : 'desc')); return; }
    if (e.key.toLowerCase() === 'd') { e.preventDefault(); setDateOpen(true); return; }

    const cols = window.matchMedia('(min-width: 768px)').matches ? 2 : 1;
    if (e.key === 'ArrowLeft') { e.preventDefault(); setSelectedIdx((i) => { const ni = Math.max(0, i - 1); scrollSelectedIntoView(ni); return ni; }); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); setSelectedIdx((i) => { const ni = Math.min(items.length - 1, i + 1); scrollSelectedIntoView(ni); return ni; }); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((i) => { const ni = Math.max(0, i - cols); scrollSelectedIntoView(ni); return ni; }); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => { const ni = Math.min(items.length - 1, i + cols); scrollSelectedIntoView(ni); return ni; }); return; }
    if (e.key === 'Enter') { e.preventDefault(); const d = items[selectedIdx]; if (d) navigate(`/docket/${d.docket_govid}`); return; }
  };

  return (
    <main ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown} className="container py-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">New York PSC Dockets</h1>
        <p className="text-muted-foreground">Public Service Commission • State: NY • Explore and filter dockets</p>
      </header>
      <div className="sticky top-0 z-50">
        <div className="relative border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 shadow-[var(--shadow-elegant)] rounded-md">
          <div className="absolute inset-0 pointer-events-none opacity-60" style={{ background: "var(--gradient-subtle)" }} />
          <div className="relative z-10 flex items-center gap-2 md:gap-3 p-2 md:p-3 overflow-x-auto">
              {/* Search (compact, expands on focus) */}
              <Input
                id="search"
                placeholder="Search docket ID, description, or petitioner"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[10rem] md:w-[16rem] focus:w-[20rem] md:focus:w-[28rem] transition-[width] duration-300 hover:border-primary/30"
                ref={searchRef}
                onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); (e.currentTarget as HTMLInputElement).blur(); containerRef.current?.focus(); } }}
              />

              {/* Industry multi-select */}
              <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="shrink-0 justify-between hover:border-primary/30">
                    {selectedIndustries.length ? `Industries (${selectedIndustries.length})` : "Industries"}
                    <ChevronDown size={14} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 z-50 bg-popover border">
                  <Command>
                    <CommandInput placeholder="Search industries..." />
                    <CommandList>
                      <CommandEmpty>No results.</CommandEmpty>
                      <CommandGroup heading="Industries">
                        <CommandItem onSelect={() => setSelectedIndustries([])}>Clear</CommandItem>
                        <CommandItem onSelect={() => setSelectedIndustries(industries)}>Select all</CommandItem>
                        {industries.map((ind) => {
                          const selected = selectedIndustries.includes(ind);
                          return (
                            <CommandItem
                              key={ind}
                              onSelect={() =>
                                setSelectedIndustries((prev) =>
                                  prev.includes(ind) ? prev.filter((v) => v !== ind) : [...prev, ind]
                                )
                              }
                            >
                              <div className="flex items-center gap-2">
                                <Check size={14} className={selected ? "opacity-100" : "opacity-0"} />
                                <span>{ind}</span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Docket types multi-select */}
              <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="shrink-0 justify-between hover:border-primary/30">
                    {docketTypes.length ? `Types (${docketTypes.length})` : "Types"}
                    <ChevronDown size={14} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 z-50 bg-popover border">
                  <Command>
                    <CommandInput placeholder="Search types..." />
                    <CommandList>
                      <CommandEmpty>No results.</CommandEmpty>
                      <CommandGroup heading="Types">
                        <CommandItem onSelect={() => setDocketTypes([])}>Clear</CommandItem>
                        <CommandItem onSelect={() => setDocketTypes(docketTypeOptions)}>Select all</CommandItem>
                        {docketTypeOptions.map((t) => {
                          const selected = docketTypes.includes(t);
                          return (
                            <CommandItem
                              key={t}
                              onSelect={() =>
                                setDocketTypes((prev) =>
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

              {/* Petitioners multi-select (ranked by frequency within current filters) */}
              <Popover open={petOpen} onOpenChange={setPetOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="shrink-0 justify-between hover:border-primary/30">
                    {petitioners.length ? `Petitioners (${petitioners.length})` : "Petitioners"}
                    <ChevronDown size={14} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 z-50 bg-popover border">
                  <Command>
                    <CommandInput placeholder="Search petitioners..." />
                    <CommandList>
                      <CommandEmpty>No results.</CommandEmpty>
                      <CommandGroup heading="Petitioners">
                        <CommandItem onSelect={() => setPetitioners([])}>Clear</CommandItem>
                        <CommandItem onSelect={() => setPetitioners(petitionerOptions.map(p => p.name))}>Select all</CommandItem>
                        {petitionerOptions.map(({ name, count }) => {
                          const selected = petitioners.includes(name);
                          return (
                            <CommandItem
                              key={name}
                              onSelect={() =>
                                setPetitioners((prev) =>
                                  prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
                                )
                              }
                            >
                              <div className="flex items-center gap-2">
                                <Check size={14} className={selected ? "opacity-100" : "opacity-0"} />
                                <span>{name}</span>
                                <span className="ml-1 text-muted-foreground text-xs">({count})</span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Date range (month) in a modal dialog) */}
              <Dialog open={dateOpen} onOpenChange={setDateOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="shrink-0 hover:border-primary/30">
                    {startDate ? format(startDate, "MMM yyyy") : "–"} – {endDate ? format(endDate, "MMM yyyy") : "–"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[620px]">
                  <DialogHeader>
                    <DialogTitle>Select date range</DialogTitle>
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
                      <span>{startDate ? format(startDate, "MMM yyyy") : "–"}</span>
                      <span>{endDate ? format(endDate, "MMM yyyy") : "–"}</span>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setRange([0, Math.max(0, (months.length || 1) - 1)] as [number, number])}>Reset</Button>
                    <Button onClick={() => setDateOpen(false)}>Done</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Sort */}
              <div className="shrink-0">
                <Button variant="outline" className="hover:border-primary/30" onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}>
                  Date {sortDir === "desc" ? "↓" : "↑"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      <section aria-label="Filters" className="space-y-2">
        {/* Active filter chips */}
        <div className="flex flex-wrap gap-2 text-sm px-1">
          {selectedIndustries.map((ind) => (
            <Badge key={`ind-${ind}`} variant="secondary" className="px-2 py-1">
              <span className="mr-1">Industry: {ind}</span>
              <button
                type="button"
                aria-label={`Remove industry ${ind}`}
                onClick={() => setSelectedIndustries((prev) => prev.filter((v) => v !== ind))}
                className="inline-flex"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
          {docketTypes.map((t) => (
            <Badge key={`type-${t}`} variant="secondary" className="px-2 py-1">
              <span className="mr-1">Type: {t}</span>
              <button
                type="button"
                aria-label={`Remove type ${t}`}
                onClick={() => setDocketTypes((prev) => prev.filter((v) => v !== t))}
                className="inline-flex"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
          {petitioners.map((p) => (
            <Badge key={`pet-${p}`} variant="secondary" className="px-2 py-1">
              <span className="mr-1">Petitioner: {p}</span>
              <button
                type="button"
                aria-label={`Remove petitioner ${p}`}
                onClick={() => setPetitioners((prev) => prev.filter((v) => v !== p))}
                className="inline-flex"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
          {normalizedSearch && (
            <Badge variant="secondary" className="px-2 py-1">
              <span className="mr-1">Search: {normalizedSearch}</span>
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="inline-flex"
              >
                <X size={12} />
              </button>
            </Badge>
          )}
        </div>
      </section>

      <Separator />

      <section aria-label="Results" className="space-y-4">
        {isLoading && items.length === 0 ? (
          <div className="text-muted-foreground">Loading dockets…</div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground">No dockets found.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((d, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <Link
                  key={d.uuid}
                  to={`/docket/${d.docket_govid}`}
                  aria-label={`Open docket ${d.docket_govid}`}
                  className="group block focus-visible:outline-none"
                  ref={(el) => { cardRefs.current[idx] = el; }}
                >
                  <Card className={cn("transition-colors hover:border-primary/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background", isSelected ? "bg-muted" : "")}
                  >
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between gap-3">
                        <span className="underline-offset-2 group-hover:underline">{d.docket_govid}</span>
                        <div className="flex flex-col items-end gap-1">
                          {d.industry && <Badge variant="outline">{d.industry}</Badge>}
                          <span className="text-xs text-muted-foreground">Opened: {format(new Date(d.opened_date), "MMM d, yyyy")}</span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="font-medium">{d.docket_title ?? "Untitled docket"}</div>
                      {d.docket_description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">{d.docket_description}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {d.docket_subtype && <Badge variant="outline">{d.docket_subtype}</Badge>}
                        {d.petitioner && <Badge variant="outline">{d.petitioner}</Badge>}
                        {d.current_status && <Badge variant="secondary">{d.current_status}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} />

        {isFetchingNextPage && (
          <div className="text-center text-muted-foreground">Loading more…</div>
        )}
        {!hasNextPage && items.length > 0 && (
          <div className="text-center text-muted-foreground">You've reached the end.</div>
        )}
      </section>
    </main>
  );
}
