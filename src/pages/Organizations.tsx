import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Users, Search, FolderOpen, Building } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { SortDropdown } from "@/components/SortDropdown";

const PAGE_SIZE = 30;

type Organization = {
  uuid: string;
  name: string;
  docket_count?: number;
};

const sanitize = (s: string) => s.replace(/[,%]/g, " ").trim();

export default function OrganizationsPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "dockets">("dockets");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sortOpen, setSortOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const navigate = useNavigate();

  const normalizedSearch = useMemo(() => sanitize(search), [search]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery<Organization[], Error>({
    queryKey: ["organizations-list", { search: normalizedSearch, sortBy, sortDir }],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage?.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined),
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      
      let query = supabase
        .from("organizations")
        .select("uuid, name")
        .range(offset, offset + PAGE_SIZE - 1);

      if (normalizedSearch) {
        query = query.ilike("name", `%${normalizedSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let organizations = (data ?? []) as Organization[];

      // Get docket counts for each organization
      if (organizations.length) {
        const orgUuids = organizations.map(org => org.uuid);
        const { data: rels } = await supabase
          .from("docket_petitioned_by_org")
          .select("petitioner_uuid")
          .in("petitioner_uuid", orgUuids);
        
        const counts = new Map<string, number>();
        (rels ?? []).forEach((r: any) => {
          if (r.petitioner_uuid) {
            counts.set(r.petitioner_uuid, (counts.get(r.petitioner_uuid) ?? 0) + 1);
          }
        });

        organizations = organizations.map(org => ({
          ...org,
          docket_count: counts.get(org.uuid) ?? 0
        }));

        // Apply sorting after getting counts
        if (sortBy === "dockets") {
          organizations.sort((a, b) => {
            const countDiff = (b.docket_count ?? 0) - (a.docket_count ?? 0);
            if (sortDir === "asc") return -countDiff;
            return countDiff;
          });
        } else {
          organizations.sort((a, b) => {
            const nameCompare = a.name.localeCompare(b.name);
            return sortDir === "asc" ? nameCompare : -nameCompare;
          });
        }
      } else {
        organizations = organizations.map(org => ({
          ...org,
          docket_count: 0
        }));

        // Sort by name when no docket data
        if (sortBy === "name") {
          organizations.sort((a, b) => {
            const nameCompare = a.name.localeCompare(b.name);
            return sortDir === "asc" ? nameCompare : -nameCompare;
          });
        }
      }

      return organizations;
    },
    staleTime: 30_000,
  });

  // Prefetch logic
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
    }, { rootMargin: "800px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (userTriggeredRef.current && !isFetchingNextPage && hasNextPage) {
      userTriggeredRef.current = false;
      fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  useEffect(() => {
    document.title = "NY PSC Organizations | Dockito";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Browse organizations that petition the New York PSC.");
  }, []);

  const pages = (data?.pages ?? []) as Organization[][];
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
    if (e.key.toLowerCase() === 's') { 
      e.preventDefault(); 
      setSortOpen(true);
      return; 
    }

    const cols = window.matchMedia('(min-width: 768px)').matches ? 2 : 1;
    if (e.key === 'ArrowLeft') { e.preventDefault(); setSelectedIdx((i) => { const ni = Math.max(0, i - 1); scrollSelectedIntoView(ni); return ni; }); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); setSelectedIdx((i) => { const ni = Math.min(items.length - 1, i + 1); scrollSelectedIntoView(ni); return ni; }); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((i) => { const ni = Math.max(0, i - cols); scrollSelectedIntoView(ni); return ni; }); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => { const ni = Math.min(items.length - 1, i + cols); scrollSelectedIntoView(ni); return ni; }); return; }
    if (e.key === 'Enter') { e.preventDefault(); const org = items[selectedIdx]; if (org) navigate(`/org/${encodeURIComponent(org.name)}`); return; }
  };

  return (
    <main ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown} className="container py-7">
      <header className="space-y-3 mb-6">
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
          <Building className="h-8 w-8 text-muted-foreground" />
          Organizations
        </h1>
        <p className="text-muted-foreground">New York Public Service Commission</p>
      </header>

      <div className="sticky top-14 z-30 mb-4">
        <div className="relative border border-gray-300 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-[var(--shadow-elegant)] rounded-md">
          <div className="relative z-10 flex items-center gap-2 md:gap-3 p-2 md:p-3">
            {/* Search */}
            <Input
              id="search"
              placeholder="Search organization names..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border-gray-300 hover:border-gray-400 bg-white hover:bg-muted/50"
              ref={searchRef}
              onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); (e.currentTarget as HTMLInputElement).blur(); containerRef.current?.focus(); } }}
            />

            {/* Sort */}
            <div className="shrink-0">
              <SortDropdown
                isOpen={sortOpen}
                onOpenChange={setSortOpen}
                currentSortBy={sortBy}
                currentSortDir={sortDir}
                onSortChange={(newSortBy, newSortDir) => {
                  setSortBy(newSortBy as "name" | "dockets");
                  setSortDir(newSortDir);
                }}
                groups={[
                  {
                    heading: "By Name",
                    options: [
                      { value: "a-z", label: "A-Z", sortBy: "name", sortDir: "asc" },
                      { value: "z-a", label: "Z-A", sortBy: "name", sortDir: "desc" }
                    ]
                  },
                  {
                    heading: "By Activity", 
                    options: [
                      { value: "most-dockets", label: "Most dockets", sortBy: "dockets", sortDir: "desc" },
                      { value: "least-dockets", label: "Least dockets", sortBy: "dockets", sortDir: "asc" }
                    ]
                  }
                ]}
                buttonMinWidth="min-w-[140px]"
              />
            </div>
          </div>
        </div>
      </div>

      {normalizedSearch && (
        <section aria-label="Filters" className="space-y-2">
          <div className="relative flex flex-wrap items-center gap-2 text-sm px-1">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <Badge variant="secondary" className="px-2 py-1">
                <div className="flex items-center gap-1.5 mr-1">
                  <Search size={12} className="text-muted-foreground" />
                  <span>Search: {normalizedSearch}</span>
                </div>
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="inline-flex"
                >
                  <span className="text-xs">✕</span>
                </button>
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearch("")}
              className="text-xs text-muted-foreground px-2 py-1 h-auto"
            >
              Clear all
            </Button>
          </div>
        </section>
      )}

      <section aria-label="Results" className="space-y-4">
        {isLoading && items.length === 0 ? (
          <div className="text-muted-foreground">Loading organizations…</div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground">No organizations found.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((org, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <Link
                  key={org.uuid}
                  to={`/org/${encodeURIComponent(org.name)}`}
                  aria-label={`View dockets for ${org.name}`}
                  className="group block focus-visible:outline-none"
                  ref={(el) => { cardRefs.current[idx] = el; }}
                >
                  <Card className={cn("transition-colors hover:border-primary/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background bg-white/95", isSelected ? "bg-muted" : "")}
                  >
                    <CardContent className="p-4 space-y-3">
                       <div className="flex items-start justify-between gap-3">
                         <div className="flex items-center gap-2">
                           <h3 className="font-medium leading-snug text-foreground">{org.name}</h3>
                         </div>
                       </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users size={14} />
                        <span>{org.docket_count} docket{org.docket_count !== 1 ? 's' : ''} petitioned</span>
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
      </section>
    </main>
  );
}
