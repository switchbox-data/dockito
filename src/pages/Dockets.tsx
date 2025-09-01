import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronDown, Check, Calendar as CalendarIcon, Factory, Shapes, Users, ArrowUpDown, Link2,
  Heart, DollarSign, Frown, FileCheck, Search, 
  BarChart3, Gavel, Flame, Lock, HelpCircle, Book, EyeOff, 
  FileSpreadsheet, TrendingUp, Microscope, Clipboard, CheckCircle, MessageCircle, Lightbulb } from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getIndustryIcon, getIndustryColor } from "@/utils/industryIcons";
import { OrganizationHeader } from "@/components/OrganizationHeader";

import { X } from "lucide-react";

const PAGE_SIZE = 50;

type Docket = {
  uuid: string;
  docket_govid: string;
  docket_title: string | null;
  docket_description: string | null;
  industry: string | null;
  docket_type: string | null;
  petitioner_strings: string[] | null;
  opened_date: string;
  docket_subtype: string | null;
  current_status: string | null;
  petitioners?: { name: string }[];
};

const sanitize = (s: string) => s.replace(/[,%]/g, " ").trim();

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

// Helper function to get subtle background and border colors for docket type badges
const getDocketTypeBadgeColors = (type: string) => {
  const typeKey = type?.toLowerCase().trim();
  switch (typeKey) {
    case 'petition':
      return 'bg-blue-50 border-blue-200 hover:bg-blue-100'; // Blue theme
    case 'tariff':
      return 'bg-green-50 border-green-200 hover:bg-green-100'; // Green theme
    case 'complaint':
      return 'bg-red-50 border-red-200 hover:bg-red-100'; // Red theme
    case 'contract':
      return 'bg-purple-50 border-purple-200 hover:bg-purple-100'; // Purple theme
    case 'audit':
      return 'bg-orange-50 border-orange-200 hover:bg-orange-100'; // Orange theme
    case 'incident':
      return 'bg-red-50 border-red-300 hover:bg-red-100'; // Red theme (slightly different border)
    case 'compliance':
      return 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'; // Emerald theme
    case 'commission instituted new case proceeding':
      return 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'; // Indigo theme
    case 'rulemaking':
      return 'bg-slate-50 border-slate-200 hover:bg-slate-100'; // Slate theme
    case 'exception from disclosure':
      return 'bg-gray-50 border-gray-200 hover:bg-gray-100'; // Gray theme
    case 'company workpapers':
      return 'bg-amber-50 border-amber-200 hover:bg-amber-100'; // Amber theme
    case 'analysis':
      return 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100'; // Cyan theme
    case 'investigation':
      return 'bg-pink-50 border-pink-200 hover:bg-pink-100'; // Pink theme
    case 'office policy and procedures':
      return 'bg-teal-50 border-teal-200 hover:bg-teal-100'; // Teal theme
    case 'authorization':
      return 'bg-lime-50 border-lime-200 hover:bg-lime-100'; // Lime theme
    case 'complaint and inquiry':
      return 'bg-rose-50 border-rose-200 hover:bg-rose-100'; // Rose theme
    case 'policy initiative':
      return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'; // Yellow theme
    default:
      return 'bg-gray-50 border-gray-200 hover:bg-gray-100'; // Default theme
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

function useDateBounds(lockedOrg?: string | null) {
  return useQuery({
    queryKey: ["dockets-date-bounds", { org: lockedOrg ?? null }],
    queryFn: async () => {
      // If an organization is locked, use the edge function
      if (lockedOrg) {
        const { data, error } = await supabase.functions.invoke('get-org-dockets', {
          body: {
            orgName: lockedOrg,
            aggregateOnly: true
          }
        });
        
        if (error) {
          console.error('Error fetching org date bounds:', error);
          throw error;
        }
        
        return {
          min: data.dateBounds.min ? new Date(data.dateBounds.min) : null,
          max: data.dateBounds.max ? new Date(data.dateBounds.max) : null
        } as { min: Date | null; max: Date | null };
      }

      // Global bounds
      const [{ data: minRow, error: minErr }, { data: maxRow, error: maxErr }] = await Promise.all([
        supabase.from("dockets").select("opened_date").order("opened_date", { ascending: true }).limit(1).maybeSingle(),
        supabase.from("dockets").select("opened_date").order("opened_date", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (minErr) throw minErr;
      if (maxErr) throw maxErr;
      const min = (minRow as any)?.opened_date ? new Date((minRow as any).opened_date) : null;
      const max = (maxRow as any)?.opened_date ? new Date((maxRow as any).opened_date) : null;
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
  const [relationshipTypes, setRelationshipTypes] = useState<string[]>(["petitioned", "filed"]);
  const [relationshipOpen, setRelationshipOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const navigate = useNavigate();
  const { orgName } = useParams();
  const lockedOrg = useMemo(() => (orgName ? decodeURIComponent(orgName) : null), [orgName]);
  
  // Date slider uses month indices
  const { data: bounds } = useDateBounds(lockedOrg);
  const months = useMemo(() => {
    if (!bounds?.min || !bounds?.max) return [] as Date[];
    return monthsBetween(bounds.min, bounds.max);
  }, [bounds]);
  const [range, setRange] = useState<[number, number] | null>(null);

  // Initialize/reset range when context changes
  useEffect(() => {
    if (months.length) {
      if (lockedOrg) {
        // For org pages: show full range of that org's activity
        setRange([0, months.length - 1]);
      } else {
        // For main dockets page: default to last 10 years (120 months)
        setRange([Math.max(0, months.length - Math.min(120, months.length)), months.length - 1]);
      }
    }
  }, [months, lockedOrg]); // Reset whenever months or lockedOrg changes

  const startDate = useMemo(() => (range && months.length ? months[range[0]] : undefined), [range, months]);
  const endDate = useMemo(() => (range && months.length ? months[range[1]] : undefined), [range, months]);

  const normalizedSearch = useMemo(() => sanitize(search), [search]);

  // Get aggregate data (including total count) for org pages
  const { data: orgAggregateData } = useQuery({
    queryKey: ["org-aggregate-data", { org: lockedOrg ?? null, relationshipTypes: relationshipTypes.join(",") }],
    queryFn: async () => {
      if (!lockedOrg) return null;
      
      const { data, error } = await supabase.functions.invoke('get-org-dockets', {
        body: {
          orgName: lockedOrg,
          filters: {
            relationshipTypes
          },
          aggregateOnly: true
        }
      });
      
      if (error) {
        console.error('Error fetching org aggregate data:', error);
        throw error;
      }
      
      console.log('Received org aggregate data:', data);
      console.log('Total count from edge function:', data?.totalCount);
      return data;
    },
    enabled: !!lockedOrg,
    staleTime: 5 * 60 * 1000,
  });

  const { data: industries = [] } = useQuery<{ name: string; count: number }[]>({
    queryKey: ["docket-industries", { org: lockedOrg ?? null }],
    queryFn: async () => {
      if (lockedOrg) {
        // Use the aggregate data we already fetched
        if (orgAggregateData) {
          return orgAggregateData.industries.map((i: any) => ({ name: i.industry, count: i.count }))
            .sort((a: any, b: any) => (b.count - a.count) || a.name.localeCompare(b.name));
        }
        return [];
      } else {
        // For main page: get all industries without counts (fetch in batches to avoid default 1000 limit)
        const batchSize = 1000;
        let from = 0;
        const set = new Set<string>();
        // Loop through pages until we've fetched all rows
        // Note: react-query will cache the result; staleTime controls refetching
        while (true) {
          const { data, error } = await supabase
            .from("dockets")
            .select("industry")
            .not("industry", "is", null)
            .neq("industry", "")
            .range(from, from + batchSize - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          (data as { industry: string | null }[]).forEach((r) => {
            if (r.industry && r.industry.trim()) set.add(r.industry.trim());
          });
          if (data.length < batchSize) break;
          from += batchSize;
        }
        return Array.from(set).sort().map((name) => ({ name, count: 0 }));
      }
    },
    enabled: !lockedOrg || !!orgAggregateData,
    staleTime: 60_000,
  });

  const { data: docketTypeOptions = [] } = useQuery<{ name: string; count: number }[]>({
    queryKey: ["docket-types", { org: lockedOrg ?? null }],
    queryFn: async () => {
      if (lockedOrg) {
        // Use the aggregate data we already fetched
        if (orgAggregateData) {
          return (orgAggregateData.docketTypes || []).map((item: any) => ({ 
            name: item.docket_type, 
            count: item.count 
          }));
        }
        return [];
      } else {
        // For main page: get all types without counts (fetch in batches to avoid default 1000 limit)
        const batchSize = 1000;
        let from = 0;
        const set = new Set<string>();
        while (true) {
          const { data, error } = await supabase
            .from("dockets")
            .select("docket_type")
            .not("docket_type", "is", null)
            .neq("docket_type", "")
            .range(from, from + batchSize - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          (data as any[]).forEach((r) => {
            if (r.docket_type && r.docket_type.trim()) set.add(r.docket_type.trim());
          });
          if (data.length < batchSize) break;
          from += batchSize;
        }
        return Array.from(set).sort().map(name => ({ name, count: 0 }));
      }
    },
    enabled: !lockedOrg || !!orgAggregateData,
    staleTime: 60_000,
  });

  const { data: petitionerOptions = [] } = useQuery<{ id: string; name: string; count: number }[]>({
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
      const { data: rels, error: relErr } = await supabase
        .from("docket_petitioned_by_org")
        .select("petitioner_uuid");
      if (relErr) throw relErr;
      const uuids = Array.from(new Set((rels ?? []).map((r: any) => r.petitioner_uuid).filter(Boolean)));
      if (!uuids.length) return [];
      const { data: orgs, error: orgErr } = await supabase
        .from("organizations")
        .select("uuid,name")
        .in("uuid", uuids);
      if (orgErr) throw orgErr;
      const nameById = new Map<string, string>();
      (orgs ?? []).forEach((o: any) => nameById.set(o.uuid, o.name));
      const counts = new Map<string, number>();
      (rels ?? []).forEach((r: any) => {
        if (r.petitioner_uuid) counts.set(r.petitioner_uuid, (counts.get(r.petitioner_uuid) ?? 0) + 1);
      });
      return Array.from(counts.entries())
        .map(([id, count]) => ({ id, name: nameById.get(id) ?? id, count }))
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
  } = useInfiniteQuery<any[], Error>({
    queryKey: [
      "dockets-list",
      { org: lockedOrg ?? null, search: normalizedSearch, industries: selectedIndustries.join(","), docketTypes: docketTypes.join(","), petitioners: petitioners.join(","), sortDir, start: startDate?.toISOString(), end: endDate?.toISOString(), relationshipTypes: relationshipTypes.join(",") },
    ],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage?.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined),
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      
      // For organization pages, use the edge function with server-side pagination
      if (lockedOrg) {
        const page = Math.floor(offset / PAGE_SIZE) + 1;
        
        const { data, error } = await supabase.functions.invoke('get-org-dockets', {
          body: {
            orgName: lockedOrg,
            filters: {
              startDate: startDate ? format(startOfMonth(startDate), "yyyy-MM-dd") : undefined,
              endDate: endDate ? format(endOfMonth(endDate), "yyyy-MM-dd") : undefined,
              sortBy: 'opened_date',
              sortOrder: sortDir,
              industries: selectedIndustries.length ? selectedIndustries : undefined,
              docketTypes: docketTypes.length ? docketTypes : undefined,
              relationshipTypes
            },
            pagination: {
              page,
              limit: PAGE_SIZE
            }
          }
        });
        
        if (error) {
          console.error('Error fetching org dockets:', error);
          throw error;
        }
        
        // Apply client-side search filter since it's not supported server-side yet
        let filteredDockets = data?.dockets || [];
        
        if (normalizedSearch) {
          filteredDockets = filteredDockets.filter((d: any) => 
            d.docket_govid?.toLowerCase().includes(normalizedSearch.toLowerCase()) ||
            d.docket_title?.toLowerCase().includes(normalizedSearch.toLowerCase()) ||
            d.docket_description?.toLowerCase().includes(normalizedSearch.toLowerCase())
          );
        }
        
        return filteredDockets;
      }
      
      // For main page, use regular query
      let query = supabase
        .from("dockets")
        .select("*")
        .order("opened_date", { ascending: sortDir === "asc" })
        .range(offset, offset + PAGE_SIZE - 1);

      if (normalizedSearch) {
        query = query.or(
          `docket_govid.ilike.%${normalizedSearch}%,docket_description.ilike.%${normalizedSearch}%,docket_title.ilike.%${normalizedSearch}%`
        );
      }
      if (selectedIndustries.length) query = query.in("industry", selectedIndustries);
      if (startDate) query = query.gte("opened_date", format(startOfMonth(startDate), "yyyy-MM-dd"));
      if (endDate) query = query.lte("opened_date", format(endOfMonth(endDate!), "yyyy-MM-dd"));

      const { data, error } = await query;
      if (error) throw error;
      
      let dockets = (data ?? []) as any[];

      // Attach petitioners via relation table
      const docketUuids = dockets.map((d: any) => d.uuid).filter(Boolean);
      if (docketUuids.length) {
        const { data: rels } = await supabase
          .from("docket_petitioned_by_org")
          .select("docket_uuid,petitioner_uuid")
          .in("docket_uuid", docketUuids);
        const petUuids = Array.from(new Set((rels ?? []).map((r: any) => r.petitioner_uuid).filter(Boolean)));
        let orgs: any[] = [];
        if (petUuids.length) {
          const { data: orgRows } = await supabase
            .from("organizations")
            .select("uuid,name")
            .in("uuid", petUuids);
          orgs = orgRows ?? [];
        }
        const nameById = new Map<string, string>();
        orgs.forEach((o: any) => nameById.set(o.uuid, o.name));
        const namesByDocket = new Map<string, string[]>();
        (rels ?? []).forEach((r: any) => {
          if (!r.docket_uuid) return;
          const arr = namesByDocket.get(r.docket_uuid) ?? [];
          const n = nameById.get(r.petitioner_uuid);
          if (n && !arr.includes(n)) arr.push(n);
          namesByDocket.set(r.docket_uuid, arr);
        });
        dockets = dockets.map((d: any) => ({ ...d, petitioner_strings: namesByDocket.get(d.uuid) ?? [] }));
      }

      // Apply client-side filters that couldn't be done in the query
      if (docketTypes.length) {
        dockets = dockets.filter((d: any) => d.docket_type && docketTypes.includes(d.docket_type));
      }

      // Filter by petitioners if selected
      if (petitioners.length) {
        dockets = dockets.filter((d: any) => 
          d.petitioner_strings && d.petitioner_strings.some((p: string) => petitioners.includes(p))
        );
      }

      return dockets;
    },
    enabled: !!(range && months.length),
    staleTime: 5 * 60 * 1000, // 5 minutes for better performance
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
    if (lockedOrg) {
      document.title = `${lockedOrg}  NY PSC Dockets | Dockito`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", `Dockets petitioned by ${lockedOrg} at the NY PSC.`);
    } else {
      document.title = "NY PSC Dockets | Dockito";
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", "Browse and filter New York PSC dockets by industry, type, dates, and more.");
    }
  }, [lockedOrg]);

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
    if (e.key.toLowerCase() === 'p') { if (lockedOrg) return; e.preventDefault(); setPetOpen(true); return; }
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
      {lockedOrg ? (
        <OrganizationHeader 
          orgName={lockedOrg} 
          docketCount={orgAggregateData?.totalCount || items.length}
          petitionedCount={orgAggregateData?.petitionedCount}
          filedCount={orgAggregateData?.filedCount}
          dateRange={{ start: startDate, end: endDate }}
        />
      ) : (
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">New York PSC Dockets</h1>
          <p className="text-muted-foreground">Public Service Commission • State: NY • Explore and filter dockets</p>
        </header>
      )}
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
                className="w-[10rem] md:w-[16rem] focus:w-[24rem] md:focus:w-[36rem] transition-[width] duration-300 hover:border-primary/30"
                ref={searchRef}
                onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); (e.currentTarget as HTMLInputElement).blur(); containerRef.current?.focus(); } }}
              />

              {/* Industry multi-select */}
              <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="shrink-0 justify-between hover:border-primary/30">
                    <span className="inline-flex items-center gap-2">
                      <Factory size={16} className="text-muted-foreground" />
                      {selectedIndustries.length ? `Industries (${selectedIndustries.length})` : "Industries"}
                    </span>
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
                        <CommandItem onSelect={() => setSelectedIndustries(industries.map(i => i.name))}>Select all</CommandItem>
                        {industries.map(({ name, count }) => {
                          const selected = selectedIndustries.includes(name);
                          return (
                            <CommandItem
                              key={name}
                              onSelect={() =>
                                setSelectedIndustries((prev) =>
                                  prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
                                )
                              }
                            >
                              <div className="flex items-center gap-2">
                                <Check size={14} className={selected ? "opacity-100" : "opacity-0"} />
                                {(() => {
                                  const IndustryIcon = getIndustryIcon(name);
                                  return <IndustryIcon size={14} className={getIndustryColor(name)} />;
                                })()}
                                <span>{name}</span>
                                {lockedOrg && <span className="ml-1 text-muted-foreground text-xs">({count})</span>}
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
                    <span className="inline-flex items-center gap-2">
                      <Shapes size={16} className="text-muted-foreground" />
                      {docketTypes.length ? `Types (${docketTypes.length})` : "Types"}
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
                        <CommandItem onSelect={() => setDocketTypes([])}>Clear</CommandItem>
                        <CommandItem onSelect={() => setDocketTypes(docketTypeOptions.map(t => t.name))}>Select all</CommandItem>
                        {docketTypeOptions.map(({ name, count }) => {
                          const selected = docketTypes.includes(name);
                          return (
                            <CommandItem
                              key={name}
                              onSelect={() =>
                                setDocketTypes((prev) =>
                                  prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
                                )
                              }
                             >
                               <div className="flex items-start gap-2">
                                 <Check size={14} className={cn("opacity-0 mt-0.5 shrink-0", selected && "opacity-100")} />
                                  {(() => {
                                    const TypeIcon = getDocketTypeIcon(name);
                                    const typeColor = getDocketTypeColor(name);
                                    return <TypeIcon size={14} className={`${typeColor} mt-0.5 shrink-0`} />;
                                  })()}
                                 <span className="leading-tight">{name?.trim()}</span>
                                 {lockedOrg && <span className="ml-1 text-muted-foreground text-xs">({count})</span>}
                               </div>
                             </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Relationship Type filter (only for org pages) */}
              {lockedOrg && (
                <Popover open={relationshipOpen} onOpenChange={setRelationshipOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="shrink-0 justify-between hover:border-primary/30">
                      <span className="inline-flex items-center gap-2">
                        <Link2 size={16} className="text-muted-foreground" />
                        {relationshipTypes.length === 2 ? "Both" : relationshipTypes.length === 1 ? (relationshipTypes[0] === "petitioned" ? "Petitioned" : "Filed") : "None"}
                      </span>
                      <ChevronDown size={14} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 z-50 bg-popover border">
                    <Command>
                      <CommandList>
                        <CommandGroup heading="Relationship Type">
                          <CommandItem onSelect={() => setRelationshipTypes(["petitioned", "filed"])}>Both</CommandItem>
                          <CommandItem onSelect={() => setRelationshipTypes(["petitioned"])}>
                            <div className="flex items-center gap-2">
                              <Check size={14} className={relationshipTypes.includes("petitioned") && !relationshipTypes.includes("filed") ? "opacity-100" : "opacity-0"} />
                              <span>Petitioned Only</span>
                            </div>
                          </CommandItem>
                          <CommandItem onSelect={() => setRelationshipTypes(["filed"])}>
                            <div className="flex items-center gap-2">
                              <Check size={14} className={relationshipTypes.includes("filed") && !relationshipTypes.includes("petitioned") ? "opacity-100" : "opacity-0"} />
                              <span>Filed Only</span>
                            </div>
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}

              {/* Petitioners multi-select (ranked by frequency within current filters) */}
              {!lockedOrg && (
                <Popover open={petOpen} onOpenChange={setPetOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="shrink-0 justify-between hover:border-primary/30">
                      <span className="inline-flex items-center gap-2">
                        <Users size={16} className="text-muted-foreground" />
                        {petitioners.length ? `Petitioners (${petitioners.length})` : "Petitioners"}
                      </span>
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
              )}

              {/* Date range (month) in a modal dialog) */}
              <Dialog open={dateOpen} onOpenChange={setDateOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="shrink-0 hover:border-primary/30">
                    <span className="inline-flex items-center gap-2">
                      <CalendarIcon size={16} className="text-muted-foreground" />
                      {startDate ? format(startDate, "MMM yyyy") : "–"} – {endDate ? format(endDate, "MMM yyyy") : "–"}
                    </span>
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
                  {sortDir === "desc" ? "↓" : "↑"} Date
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
              <div className="flex items-center gap-1.5 mr-1">
                <Factory size={12} className="text-muted-foreground" />
                <span>Industry: {ind}</span>
              </div>
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
              <div className="flex items-center gap-1.5 mr-1">
                {(() => {
                  const TypeIcon = getDocketTypeIcon(t);
                  const typeColor = getDocketTypeColor(t);
                  return <TypeIcon size={12} className={typeColor} />;
                })()}
                <span>Type: {t}</span>
              </div>
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
          {lockedOrg ? null : (
            petitioners.map((p) => (
              <Badge key={`pet-${p}`} variant="secondary" className="px-2 py-1">
                <div className="flex items-center gap-1.5 mr-1">
                  <Users size={12} className="text-muted-foreground" />
                  <span>Petitioner: {p}</span>
                </div>
                <button
                  type="button"
                  aria-label={`Remove petitioner ${p}`}
                  onClick={() => setPetitioners((prev) => prev.filter((v) => v !== p))}
                  className="inline-flex"
                >
                  <X size={12} />
                </button>
              </Badge>
            ))
          )}
          {lockedOrg && relationshipTypes.length < 2 && (
            <Badge variant="secondary" className="px-2 py-1">
              <span className="mr-1">Showing: {relationshipTypes[0] === "petitioned" ? "Petitioned dockets" : "Filed dockets"}</span>
              <button
                type="button"
                aria-label="Show both relationship types"
                onClick={() => setRelationshipTypes(["petitioned", "filed"])}
                className="inline-flex"
              >
                <X size={12} />
              </button>
            </Badge>
          )}
          {normalizedSearch && (
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
                <X size={12} />
              </button>
            </Badge>
          )}
        </div>
      </section>

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
                     <CardContent className="p-4 space-y-1">
                       <div className="flex items-start justify-between gap-3 mb-1">
                         <div className="flex flex-wrap gap-1">
                             {d.docket_type && (
                               <Badge variant="outline" className={`inline-flex items-center gap-1.5 ${getDocketTypeBadgeColors(d.docket_type)}`}>
                                 {(() => {
                                   const TypeIcon = getDocketTypeIcon(d.docket_type);
                                   const typeColor = getDocketTypeColor(d.docket_type);
                                   return <TypeIcon size={12} className={typeColor} />;
                                 })()}
                                 {d.docket_type}
                               </Badge>
                             )}
                           {d.docket_subtype && <Badge variant="outline">{d.docket_subtype}</Badge>}
                         </div>
                         <div className="flex flex-col items-end gap-1">
                           {d.industry && (
                             <Badge variant="outline" className="inline-flex items-center gap-1.5">
                               {(() => {
                                 const IndustryIcon = getIndustryIcon(d.industry);
                                 return <IndustryIcon size={12} className={getIndustryColor(d.industry)} />;
                               })()}
                               {d.industry}
                             </Badge>
                           )}
                           <span className="text-xs text-muted-foreground">Opened: {format(new Date(d.opened_date), "MMM d, yyyy")}</span>
                         </div>
                       </div>
                       
                       <div className="space-y-2">
                         <div className="text-sm text-foreground font-semibold">{d.docket_govid}</div>
                         <h3 className="text-sm font-normal leading-snug text-foreground">{d.docket_title ?? "Untitled docket"}</h3>
                       </div>
                       
                        <div className="flex flex-wrap gap-2">
                          {d.petitioner_strings?.slice(0, 2).map(p => (
                             <Badge
                               key={p}
                               variant="outline"
                               className="text-xs cursor-pointer bg-background border-gray-300 hover:border-gray-400 transition-colors"
                               onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/org/${encodeURIComponent(p)}`); }}
                             >
                              {p}
                            </Badge>
                          ))}
                          {d.petitioner_strings && d.petitioner_strings.length > 2 && (
                            <Badge variant="secondary" className="text-xs">+{d.petitioner_strings.length - 2} more</Badge>
                          )}
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
        {!hasNextPage && items.length > 0 && !lockedOrg && (
          <div className="text-center text-muted-foreground">You've reached the end.</div>
        )}
      </section>
    </main>
  );
}
