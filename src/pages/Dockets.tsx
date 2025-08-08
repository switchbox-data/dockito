import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronDown, Check } from "lucide-react";

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
  const [docketType, setDocketType] = useState<string | undefined>();
  const [petitioner, setPetitioner] = useState<string | undefined>();
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

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
      { search: normalizedSearch, industries: selectedIndustries.join(","), docketType, petitioner, sortDir, start: startDate?.toISOString(), end: endDate?.toISOString() },
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
      if (docketType) q = q.eq("docket_subtype", docketType);
      if (petitioner) q = q.eq("petitioner", petitioner);
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

  return (
    <main className="container py-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">New York PSC Dockets</h1>
        <p className="text-muted-foreground">Public Service Commission • State: NY • Explore and filter dockets</p>
      </header>
      <section aria-label="Filters" className="grid gap-4 md:grid-cols-5">
        <div className="md:col-span-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search docket ID, description, or petitioner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <Label>Industry</Label>
          <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedIndustries.length ? `Industries (${selectedIndustries.length})` : "Select industries"}
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
        </div>
        <div>
          <Label>Docket type</Label>
          <Input placeholder="e.g., Petition" value={docketType ?? ""} onChange={(e) => setDocketType(e.target.value || undefined)} />
        </div>
        <div>
          <Label>Petitioner</Label>
          <Input placeholder="e.g., Con Edison" value={petitioner ?? ""} onChange={(e) => setPetitioner(e.target.value || undefined)} />
        </div>
        <div className="md:col-span-5">
          <Label>Date range</Label>
          <div className="space-y-2">
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
        </div>
        <div className="md:col-span-5 flex items-end justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-sm">
            {selectedIndustries.map((ind) => (
              <Badge key={`ind-${ind}`} variant="secondary">Industry: {ind}</Badge>
            ))}
            {docketType && <Badge variant="secondary">Type: {docketType}</Badge>}
            {petitioner && <Badge variant="secondary">Petitioner: {petitioner}</Badge>}
            {normalizedSearch && <Badge variant="secondary">Search: {normalizedSearch}</Badge>}
          </div>
          <div className="w-48">
            <Label>Sort by opened date</Label>
            <Select value={sortDir} onValueChange={(v: any) => setSortDir(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest first</SelectItem>
                <SelectItem value="asc">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
            {items.map((d) => (
              <Card key={d.uuid} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between gap-3">
                    <Link to={`/docket/${d.docket_govid}`} className="underline-offset-2 hover:underline">
                      {d.docket_govid}
                    </Link>
                    <span className="text-sm text-muted-foreground">{format(new Date(d.opened_date), "MMM d, yyyy")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="font-medium">{d.docket_title ?? "Untitled docket"}</div>
                  {d.docket_description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{d.docket_description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {d.industry && <Badge variant="outline">{d.industry}</Badge>}
                    {d.docket_subtype && <Badge variant="outline">{d.docket_subtype}</Badge>}
                    {d.petitioner && <Badge variant="outline">{d.petitioner}</Badge>}
                    {d.current_status && <Badge variant="secondary">{d.current_status}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} />

        {isFetchingNextPage && (
          <div className="text-center text-muted-foreground">Loading more…</div>
        )}
        {!hasNextPage && items.length > 0 && (
          <div className="text-center text-muted-foreground">You’ve reached the end.</div>
        )}
      </section>
    </main>
  );
}
