import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronDown, Check, Calendar as CalendarIcon, Factory, Shapes, Users, ArrowUpDown, Link2,
  Heart, DollarSign, Frown, FileCheck, Search, 
  BarChart3, Gavel, Flame, Lock, HelpCircle, Book, EyeOff, 
  FileSpreadsheet, TrendingUp, Microscope, Clipboard, CheckCircle, MessageCircle, Lightbulb, UserCheck } from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth, startOfDay, endOfDay, isSameMonth } from "date-fns";
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
import { DocketCardSkeleton } from "@/components/DocketCardSkeleton";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { ExpandingSearchInput } from "@/components/ExpandingSearchInput";

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
      return 'bg-blue-50 border-blue-200'; // Blue theme
    case 'tariff':
      return 'bg-green-50 border-green-200'; // Green theme
    case 'complaint':
      return 'bg-red-50 border-red-200'; // Red theme
    case 'contract':
      return 'bg-purple-50 border-purple-200'; // Purple theme
    case 'audit':
      return 'bg-orange-50 border-orange-200'; // Orange theme
    case 'incident':
      return 'bg-red-50 border-red-300'; // Red theme (slightly different border)
    case 'compliance':
      return 'bg-emerald-50 border-emerald-200'; // Emerald theme
    case 'commission instituted new case proceeding':
      return 'bg-indigo-50 border-indigo-200'; // Indigo theme
    case 'rulemaking':
      return 'bg-slate-50 border-slate-200'; // Slate theme
    case 'exception from disclosure':
      return 'bg-gray-50 border-gray-200'; // Gray theme
    case 'company workpapers':
      return 'bg-amber-50 border-amber-200'; // Amber theme
    case 'analysis':
      return 'bg-cyan-50 border-cyan-200'; // Cyan theme
    case 'investigation':
      return 'bg-pink-50 border-pink-200'; // Pink theme
    case 'office policy and procedures':
      return 'bg-teal-50 border-teal-200'; // Teal theme
    case 'authorization':
      return 'bg-lime-50 border-lime-200'; // Lime theme
    case 'complaint and inquiry':
      return 'bg-rose-50 border-rose-200'; // Rose theme
    case 'policy initiative':
      return 'bg-yellow-50 border-yellow-200'; // Yellow theme
    default:
      return 'bg-gray-50 border-gray-200'; // Default theme
  }
};

// Helper function to get darker border colors for docket type badge hover (on card hover)
const getDocketTypeHoverBorderColors = (type: string) => {
  const typeKey = type?.toLowerCase().trim();
  switch (typeKey) {
    case 'petition':
      return 'group-hover:border-blue-600'; // Blue theme
    case 'tariff':
      return 'group-hover:border-green-600'; // Green theme
    case 'complaint':
      return 'group-hover:border-red-600'; // Red theme
    case 'contract':
      return 'group-hover:border-purple-600'; // Purple theme
    case 'audit':
      return 'group-hover:border-orange-600'; // Orange theme
    case 'incident':
      return 'group-hover:border-red-600'; // Red theme (matching incident color)
    case 'compliance':
      return 'group-hover:border-emerald-600'; // Emerald theme
    case 'commission instituted new case proceeding':
      return 'group-hover:border-indigo-600'; // Indigo theme
    case 'rulemaking':
      return 'group-hover:border-slate-600'; // Slate theme
    case 'exception from disclosure':
      return 'group-hover:border-gray-600'; // Gray theme
    case 'company workpapers':
      return 'group-hover:border-amber-600'; // Amber theme
    case 'analysis':
      return 'group-hover:border-cyan-600'; // Cyan theme
    case 'investigation':
      return 'group-hover:border-pink-600'; // Pink theme
    case 'office policy and procedures':
      return 'group-hover:border-teal-600'; // Teal theme
    case 'authorization':
      return 'group-hover:border-lime-600'; // Lime theme
    case 'complaint and inquiry':
      return 'group-hover:border-rose-600'; // Rose theme
    case 'policy initiative':
      return 'group-hover:border-yellow-600'; // Yellow theme
    default:
      return 'group-hover:border-gray-600'; // Default theme
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
  
  const [docketTypes, setDocketTypes] = useState<string[]>([]);
  const [docketSubtypes, setDocketSubtypes] = useState<string[]>([]);
  const [petitioners, setPetitioners] = useState<string[]>([]);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [industryMenuOpen, setIndustryMenuOpen] = useState(false);
  const [subtypeSearch, setSubtypeSearch] = useState("");
  const [petOpen, setPetOpen] = useState(false);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>();
  const [dateOpen, setDateOpen] = useState(false);
  const [relationshipTypes, setRelationshipTypes] = useState<string[]>([]);
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

  // Reset filters when navigating between different organization contexts
  useEffect(() => {
    // Reset all filter states when the organization context changes
    setSelectedIndustries([]);
    setDocketTypes([]);
    setDocketSubtypes([]);
    setPetitioners([]);
    setSearch("");
    setDateRange(undefined);
    setRange(null);
    // Note: relationshipTypes intentionally kept as it's org-specific setting
  }, [lockedOrg]);

  // Initialize/reset range when context changes
  useEffect(() => {
    if (months.length) {
      // Always show full range for all pages
      setRange([0, months.length - 1]);
    }
  }, [months, lockedOrg]); // Reset whenever months or lockedOrg changes

  const startDate = useMemo(() => (range && months.length ? months[range[0]] : undefined), [range, months]);
  const endDate = useMemo(() => (range && months.length ? months[range[1]] : undefined), [range, months]);
  
  // Default dates are the full range
  const defaultStartDate = useMemo(() => (months.length ? months[0] : undefined), [months]);
  const defaultEndDate = useMemo(() => (months.length ? months[months.length - 1] : undefined), [months]);
  
  // Check if current dates differ from defaults
  const isStartDateModified = useMemo(() => {
    if (!startDate || !defaultStartDate) return false;
    return startDate.getTime() !== defaultStartDate.getTime();
  }, [startDate, defaultStartDate]);
  
  const isEndDateModified = useMemo(() => {
    if (!endDate || !defaultEndDate) return false;
    return endDate.getTime() !== defaultEndDate.getTime();
  }, [endDate, defaultEndDate]);

  const normalizedSearch = useMemo(() => sanitize(search), [search]);

  // Get static organization stats (never filtered)
  const { data: orgStats, isLoading: isOrgStatsLoading } = useQuery({
    queryKey: ["org-stats", { org: lockedOrg ?? null }],
    queryFn: async () => {
      if (!lockedOrg) return null;
      
      const { data, error } = await supabase.functions.invoke('get-org-dockets', {
        body: {
          orgName: lockedOrg,
          filters: {}, // No filters for static stats
          aggregateOnly: true
        }
      });
      
      if (error) {
        console.error('Error fetching org stats:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!lockedOrg,
  });

  // Get filtered aggregate data for counting results
  const { data: orgAggregateData, isLoading: isAggregateLoading } = useQuery({
    queryKey: ["org-aggregate-data", { 
      org: lockedOrg ?? null, 
      relationshipTypes: relationshipTypes.join(","),
      industries: selectedIndustries.join(","),
      docketTypes: docketTypes.join(","),
      subtypes: docketSubtypes.join(","),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sortDir
    }],
    queryFn: async () => {
      if (!lockedOrg) return null;
      
      const { data, error } = await supabase.functions.invoke('get-org-dockets', {
        body: {
          orgName: lockedOrg,
          filters: {
            relationshipTypes: relationshipTypes.length ? relationshipTypes : undefined,
            industries: selectedIndustries.length ? selectedIndustries : undefined,
            docketTypes: docketTypes.length ? docketTypes : undefined,
            docketSubtypes: docketSubtypes.length ? docketSubtypes : undefined,
            startDate: startDate ? format(startOfMonth(startDate), "yyyy-MM-dd") : undefined,
            endDate: endDate ? format(endOfMonth(endDate), "yyyy-MM-dd") : undefined,
            sortBy: 'opened_date',
            sortOrder: sortDir
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

  // Fetch subtypes data
  const { data: subtypesByType = {} } = useQuery<Record<string, { name: string; count: number }[]>>({
    queryKey: ["docket-subtypes", { org: lockedOrg ?? null }],
    queryFn: async () => {
      if (lockedOrg) {
        // For org pages, get from aggregate data
        if (orgAggregateData?.subtypes) {
          const grouped: Record<string, { name: string; count: number }[]> = {};
          orgAggregateData.subtypes.forEach((item: any) => {
            if (!grouped[item.docket_type]) grouped[item.docket_type] = [];
            grouped[item.docket_type].push({ name: item.docket_subtype, count: item.count });
          });
          return grouped;
        }
        return {};
      } else {
        // For main page: get all subtypes grouped by type
        const { data, error } = await supabase
          .from("dockets")
          .select("docket_type, docket_subtype")
          .not("docket_type", "is", null)
          .not("docket_subtype", "is", null)
          .neq("docket_type", "")
          .neq("docket_subtype", "");
        
        if (error) throw error;
        
        const grouped: Record<string, { name: string; count: number }[]> = {};
        const counts: Record<string, Record<string, number>> = {};
        
        data.forEach((row: any) => {
          const type = row.docket_type?.trim();
          const subtype = row.docket_subtype?.trim();
          if (type && subtype) {
            if (!counts[type]) counts[type] = {};
            counts[type][subtype] = (counts[type][subtype] || 0) + 1;
          }
        });
        
        Object.entries(counts).forEach(([type, subtypeCounts]) => {
          grouped[type] = Object.entries(subtypeCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
        });
        
        return grouped;
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
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<any[], Error>({
    queryKey: [
      "dockets-list",
      { org: lockedOrg ?? null, search: normalizedSearch, industries: selectedIndustries.join(","), docketTypes: docketTypes.join(","), docketSubtypes: docketSubtypes.join(","), petitioners: petitioners.join(","), sortDir, start: startDate?.toISOString(), end: endDate?.toISOString(), relationshipTypes: relationshipTypes.join(",") },
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
              startDate: startDate && !isNaN(startDate.getTime()) ? format(startOfMonth(startDate), "yyyy-MM-dd") : undefined,
              endDate: endDate && !isNaN(endDate.getTime()) ? format(endOfMonth(endDate), "yyyy-MM-dd") : undefined,
              sortBy: 'opened_date',
              sortOrder: sortDir,
              industries: selectedIndustries.length ? selectedIndustries : undefined,
              docketTypes: docketTypes.length ? docketTypes : undefined,
               docketSubtypes: docketSubtypes.length ? docketSubtypes : undefined,
               relationshipTypes: relationshipTypes.length ? relationshipTypes : undefined
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
      if (docketTypes.length) query = query.in("docket_type", docketTypes);
      if (docketSubtypes.length) query = query.in("docket_subtype", docketSubtypes);
      if (startDate && !isNaN(startDate.getTime())) query = query.gte("opened_date", format(startOfMonth(startDate), "yyyy-MM-dd"));
      if (endDate && !isNaN(endDate.getTime())) query = query.lte("opened_date", format(endOfMonth(endDate), "yyyy-MM-dd"));
      // Add petitioner filtering - use contains operator for array
      if (petitioners.length) {
        // For multiple petitioners, we need to check if any of them are in the petitioner_strings array
        const petitionerConditions = petitioners.map(p => `petitioner_strings.cs.{${p}}`).join(',');
        query = query.or(petitionerConditions);
      }

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
      // (docketTypes filtering is now handled server-side)

      // Client-side petitioner filtering is no longer needed since it's now handled server-side

      return dockets;
    },
    enabled: !!(range && months.length),
    staleTime: 5 * 60 * 1000, // 5 minutes for better performance
  });

  // Get exact count when filters are applied (for main dockets page)
  const hasActiveFilters = selectedIndustries.length > 0 || docketTypes.length > 0 || docketSubtypes.length > 0 || petitioners.length > 0 || !!normalizedSearch || isStartDateModified || isEndDateModified;
  const { data: exactCount } = useQuery({
    queryKey: ["dockets-count", { 
      search: normalizedSearch, 
      industries: selectedIndustries.sort().join(","), 
      types: docketTypes.sort().join(","),
      subtypes: docketSubtypes.sort().join(","),
      petitioners: petitioners.sort().join(","),
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    }],
    queryFn: async () => {
      if (lockedOrg) return null; // Not needed for org pages
      
      let query = supabase.from("dockets").select("*", { count: 'exact', head: true });

      // Apply same filters as main query
      if (normalizedSearch) {
        query = query.or(`docket_govid.ilike.%${normalizedSearch}%,docket_title.ilike.%${normalizedSearch}%,docket_description.ilike.%${normalizedSearch}%,petitioner_strings.cs.{${normalizedSearch}}`);
      }
      if (selectedIndustries.length) {
        query = query.in("industry", selectedIndustries);
      }
      if (docketTypes.length) {
        query = query.in("docket_type", docketTypes);
      }
      if (docketSubtypes.length) {
        query = query.in("docket_subtype", docketSubtypes);
      }
      // Add petitioner filtering - use contains operator for array
      if (petitioners.length) {
        // For multiple petitioners, we need to check if any of them are in the petitioner_strings array
        const petitionerConditions = petitioners.map(p => `petitioner_strings.cs.{${p}}`).join(',');
        query = query.or(petitionerConditions);
      }
      if (startDate && !isNaN(startDate.getTime())) {
        query = query.gte("opened_date", format(startOfMonth(startDate), "yyyy-MM-dd"));
      }
      if (endDate && !isNaN(endDate.getTime())) {
        query = query.lte("opened_date", format(endOfMonth(endDate), "yyyy-MM-dd"));
      }

      const { count, error } = await query;
      if (error) throw error;
      
      return count || 0;
    },
    enabled: !lockedOrg && hasActiveFilters && !!(range && months.length),
    staleTime: 30 * 1000, // 30 seconds for count queries
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

  // Derived loading states to prevent flicker
  const hasAnyPage = pages.length > 0;
  const showCardSkeletons = lockedOrg
    ? items.length === 0 && (isLoading || isFetching || isAggregateLoading || !orgAggregateData)
    : items.length === 0 && (isLoading || isFetching);
  const showNoDockets = lockedOrg
    ? !!orgAggregateData && orgAggregateData.totalCount === 0 && !isLoading && !isFetching
    : !isLoading && !isFetching && items.length === 0;

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
    if (e.key.toLowerCase() === 'i') { e.preventDefault(); setIndustryMenuOpen(true); return; }
    if (e.key.toLowerCase() === 't') { e.preventDefault(); setTypeMenuOpen(true); return; }
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
          docketCount={orgStats?.totalCount}
          petitionedCount={orgStats?.petitionedCount}
          filedCount={orgStats?.filedCount}
          dateBounds={orgStats?.dateBounds}
          isLoading={isOrgStatsLoading}
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
          <div className="relative z-10 p-2 md:p-3 overflow-x-auto min-w-0">
            {/* Single flowing container - no justify-between so everything can be pushed */}
            <div className="flex items-center gap-2 md:gap-3 min-w-0 overflow-x-auto">
              <ExpandingSearchInput
                ref={searchRef}
                value={search}
                onChange={setSearch}
                placeholder="Search docket ID, description, or petitioner"
                containerRef={containerRef}
              />

              {/* Filter label - shows on wide screens with generous spacing */}
              <span className="hidden lg:inline-block text-sm text-muted-foreground font-medium ml-8">
                Filter:
              </span>

              {/* Industry Filter */}
              <Popover open={industryMenuOpen} onOpenChange={setIndustryMenuOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="shrink-0 justify-between hover:border-primary/30 lg:ml-0 ml-6">
                    <span className="inline-flex items-center gap-2">
                      <Factory size={16} className="text-muted-foreground" />
                      {selectedIndustries.length ? `Industries (${selectedIndustries.length})` : "Industries"}
                    </span>
                    <ChevronDown size={14} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[600px] p-0 z-50 bg-popover border max-h-[500px] overflow-y-auto" align="start">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">Industries</h3>
                      <div className="flex items-center gap-2">
                        {selectedIndustries.length > 0 && (
                          <Button variant="outline" size="sm" onClick={() => setSelectedIndustries([])}>Clear all</Button>
                        )}
                        <Button size="sm" onClick={() => setIndustryMenuOpen(false)}>Done</Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {industries.map((industry) => {
                        const isSelected = selectedIndustries.includes(industry.name);
                        const Icon = getIndustryIcon(industry.name);
                        return (
                          <button
                            key={industry.name}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedIndustries(prev => prev.filter(i => i !== industry.name));
                              } else {
                                setSelectedIndustries(prev => [...prev, industry.name]);
                              }
                            }}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-md border transition-colors text-left",
                              isSelected 
                                ? "bg-primary text-primary-foreground border-primary" 
                                : "hover:bg-muted/50 border-border"
                            )}
                          >
                            <Icon className={cn("h-4 w-4 flex-shrink-0", getIndustryColor(industry.name))} />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">{industry.name}</div>
                              {lockedOrg && industry.count > 0 && (
                                <div className="text-xs opacity-70">{industry.count}</div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>


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
                  <PopoverContent className="w-[500px] p-0 z-50 bg-popover border max-h-[500px]" align="start">
                    <Command className="h-full">
                      <CommandInput placeholder="Search petitioners..." className="text-sm" />
                      <CommandList className="max-h-[420px]">
                        <CommandEmpty>No results.</CommandEmpty>
                        <CommandGroup heading="Petitioners">
                          <CommandItem onSelect={() => setPetitioners([])} className="py-2">
                            <div className="flex items-center gap-2">
                              <X size={14} className="text-muted-foreground" />
                              <span className="font-medium">Clear all</span>
                            </div>
                          </CommandItem>
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
                                className="py-2"
                              >
                                <div className="flex items-center gap-2 w-full">
                                  <Check size={14} className={selected ? "opacity-100 text-primary" : "opacity-0"} />
                                  <Users size={14} className="text-muted-foreground flex-shrink-0" />
                                  <span className="flex-1 truncate">{name}</span>
                                  <span className="text-muted-foreground text-xs flex-shrink-0">({count})</span>
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

              {/* Types Menu */}
              <Popover open={typeMenuOpen} onOpenChange={setTypeMenuOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="shrink-0 justify-between hover:border-primary/30">
                    <span className="inline-flex items-center gap-2">
                      <Shapes size={16} className="text-muted-foreground" />
                      {docketTypes.length || docketSubtypes.length ? `Types (${docketTypes.length + docketSubtypes.length})` : "Types"}
                    </span>
                    <ChevronDown size={14} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[800px] p-0 z-50 bg-popover border max-h-[600px] overflow-y-auto" align="start">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">Docket Types</h3>
                      <div className="flex items-center gap-2">
                        {(docketTypes.length > 0 || docketSubtypes.length > 0) && (
                          <Button variant="outline" size="sm" onClick={() => { setDocketTypes([]); setDocketSubtypes([]); setSubtypeSearch(""); }}>Clear types</Button>
                        )}
                        <Button size="sm" onClick={() => setTypeMenuOpen(false)}>Done</Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        
                        <div className="grid grid-cols-4 gap-2">
                          {docketTypeOptions.map((type) => {
                            const isSelected = docketTypes.includes(type.name);
                            const Icon = getDocketTypeIcon(type.name);
                            return (
                              <button
                                key={type.name}
                                onClick={() => {
                                  const allowed = ['tariff','petition','contract','complaint'];
                                  const hasSubtypes = allowed.includes(type.name.toLowerCase());
                                  const typeSubtypes = hasSubtypes ? (subtypesByType[type.name] || []) : [];
                                  
                                  if (isSelected) {
                                    setDocketTypes(prev => prev.filter(t => t !== type.name));
                                    // clear its subtypes when unselected
                                    if (hasSubtypes) {
                                      setDocketSubtypes(prev => prev.filter(s => !typeSubtypes.some(ts => ts.name === s)));
                                    }
                                  } else {
                                    setDocketTypes(prev => [...prev, type.name]);
                                  }
                                }}
                                className={cn(
                                  "flex items-center gap-2 p-3 rounded-md border transition-colors text-left",
                                  isSelected 
                                    ? "bg-primary text-primary-foreground border-primary" 
                                    : "hover:bg-muted/50 border-border"
                                )}
                              >
                                <Icon className={cn("h-4 w-4 flex-shrink-0", getDocketTypeColor(type.name))} />
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-sm truncate">{type.name}</div>
                                  {lockedOrg && type.count > 0 && (
                                    <div className="text-xs opacity-70">{type.count}</div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Subtypes Section - only show if any selected types have subtypes */}
                      {(() => {
                        const allowed = ['tariff','petition','contract','complaint'];
                        const selectedTypesWithSubtypes = docketTypes.filter(type => 
                          allowed.includes(type.toLowerCase()) && (subtypesByType[type] || []).length > 0
                        );
                        
                        if (selectedTypesWithSubtypes.length === 0) return null;
                        
                        return (
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground mb-2">SUBTYPES</h4>
                            <div className="space-y-3">
                              {selectedTypesWithSubtypes.map(typeName => {
                                const typeSubtypes = subtypesByType[typeName] || [];
                                const isPetition = typeName.toLowerCase() === 'petition';
                                const filteredSubtypes = isPetition && subtypeSearch
                                  ? typeSubtypes.filter(st => st.name.toLowerCase().includes(subtypeSearch.toLowerCase()))
                                  : typeSubtypes;
                                
                                return (
                                  <div key={typeName} className="border rounded-md p-3">
                                    <div className="flex items-center gap-2 mb-3">
                                      {(() => {
                                        const Icon = getDocketTypeIcon(typeName);
                                        return <Icon className={cn("h-4 w-4", getDocketTypeColor(typeName))} />;
                                      })()}
                                      <span className="font-medium text-sm">{typeName}</span>
                                      {isPetition && typeSubtypes.length > 10 && (
                                        <Input
                                          placeholder="Search subtypes..."
                                          value={subtypeSearch}
                                          onChange={(e) => setSubtypeSearch(e.target.value)}
                                          className="h-7 text-xs ml-auto w-48"
                                        />
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                      {filteredSubtypes.map(st => {
                                        const selected = docketSubtypes.includes(st.name);
                                        return (
                                          <button
                                            key={st.name}
                                            onClick={() => {
                                              if (selected) {
                                                setDocketSubtypes(prev => prev.filter(s => s !== st.name));
                                              } else {
                                                setDocketSubtypes(prev => [...prev, st.name]);
                                              }
                                            }}
                                            className={cn(
                                              "flex items-center gap-2 p-2 rounded text-xs transition-colors text-left",
                                              selected 
                                                ? "bg-secondary text-secondary-foreground" 
                                                : "hover:bg-muted/50"
                                            )}
                                          >
                                            <span className="truncate">{st.name}</span>
                                            {lockedOrg && st.count > 0 && (
                                              <span className="ml-auto text-xs opacity-70">{st.count}</span>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Role filter (only for org pages) */}
              {lockedOrg && (
                <Popover open={relationshipOpen} onOpenChange={setRelationshipOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="shrink-0 justify-between hover:border-primary/30">
                      <span className="inline-flex items-center gap-2">
                        <UserCheck size={16} className="text-muted-foreground" />
                        {relationshipTypes.length === 0 ? "Role" : `Role (${relationshipTypes.length})`}
                      </span>
                      <ChevronDown size={14} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 z-50 bg-popover border" align="start">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          <CommandItem onSelect={() => setRelationshipTypes([])}>
                            <div className="flex items-center gap-2">
                              <X size={14} className="text-muted-foreground" />
                              <span className="font-medium">Clear all</span>
                            </div>
                          </CommandItem>
                          <CommandItem onSelect={() => {
                            if (relationshipTypes.includes("petitioned")) {
                              setRelationshipTypes(prev => prev.filter(r => r !== "petitioned"));
                            } else {
                              setRelationshipTypes(prev => [...prev, "petitioned"]);
                            }
                          }}>
                            <div className="flex items-center gap-2">
                              <Check size={14} className={relationshipTypes.includes("petitioned") ? "opacity-100" : "opacity-0"} />
                              <span>Docket petitioner</span>
                            </div>
                          </CommandItem>
                          <CommandItem onSelect={() => {
                            if (relationshipTypes.includes("filed")) {
                              setRelationshipTypes(prev => prev.filter(r => r !== "filed"));
                            } else {
                              setRelationshipTypes(prev => [...prev, "filed"]);
                            }
                          }}>
                            <div className="flex items-center gap-2">
                              <Check size={14} className={relationshipTypes.includes("filed") ? "opacity-100" : "opacity-0"} />
                              <span>Docket filer</span>
                            </div>
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}

              {/* Date range (months) */}
              <DateRangeFilter
                months={months}
                range={range}
                onRangeChange={(r) => setRange(r)}
                open={dateOpen}
                onOpenChange={setDateOpen}
              />

              {/* Sort section - now flows naturally, can be pushed by expanding search */}
              {/* Sort label - shows only on wider screens */}
              <span className="hidden lg:inline-block text-sm text-muted-foreground font-medium ml-8">
                Sort:
              </span>

              {/* Sort */}
              <Button variant="outline" className="hover:border-primary/30" onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}>
                {sortDir === "desc" ? "↓" : "↑"} Date
              </Button>
            </div>
            </div>
          </div>
        </div>
      <section aria-label="Filters" className="space-y-2">
        {/* Active filter chips with count */}
        <div className="relative flex flex-wrap items-center gap-2 text-sm px-1">
          {/* Results count and filter badges group */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Results count - only show when filters are active */}
            {(selectedIndustries.length > 0 || docketTypes.length > 0 || docketSubtypes.length > 0 || petitioners.length > 0 || normalizedSearch || relationshipTypes.length > 0 || isStartDateModified || isEndDateModified) && (
              <span className="text-muted-foreground font-medium">
                {showCardSkeletons ? (
                  "Loading..."
                ) : lockedOrg ? (
                  orgAggregateData?.totalCount ? (
                    `${orgAggregateData.totalCount.toLocaleString()} docket${orgAggregateData.totalCount === 1 ? '' : 's'} found with:`
                  ) : (
                    "No dockets found with:"
                  )
                ) : exactCount !== undefined ? (
                  exactCount > 0 ? (
                    `${exactCount.toLocaleString()} docket${exactCount === 1 ? '' : 's'} found with:`
                  ) : (
                    "No dockets found with:"
                  )
                ) : (
                  items.length > 0 ? (
                    `${items.length.toLocaleString()}${hasNextPage ? '+' : ''} docket${items.length === 1 ? '' : 's'} found with:`
                  ) : (
                    "No dockets found with:"
                  )
                )}
              </span>
            )}
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
                <Shapes size={12} className="text-muted-foreground" />
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
          {docketSubtypes.map((st) => (
            <Badge key={`subtype-${st}`} variant="secondary" className="px-2 py-1">
              <div className="flex items-center gap-1.5 mr-1">
                <Shapes size={12} className="text-muted-foreground" />
                <span>Subtype: {st}</span>
              </div>
              <button
                type="button"
                onClick={() => setDocketSubtypes((prev) => prev.filter((v) => v !== st))}
                aria-label={`Remove ${st}`}
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
          {lockedOrg && relationshipTypes.includes("petitioned") && (
            <Badge variant="secondary" className="px-2 py-1">
              <span className="mr-1">Showing: Petitioned dockets</span>
              <button
                type="button"
                aria-label="Remove petitioned filter"
                onClick={() => setRelationshipTypes(prev => prev.filter(r => r !== "petitioned"))}
                className="inline-flex"
              >
                <X size={12} />
              </button>
            </Badge>
          )}
          {lockedOrg && relationshipTypes.includes("filed") && (
            <Badge variant="secondary" className="px-2 py-1">
              <span className="mr-1">Showing: Filed dockets</span>
              <button
                type="button"
                aria-label="Remove filed filter"
                onClick={() => setRelationshipTypes(prev => prev.filter(r => r !== "filed"))}
                className="inline-flex"
              >
                <X size={12} />
              </button>
            </Badge>
          )}
          {isStartDateModified && (
            <Badge variant="secondary" className="px-2 py-1">
              <div className="flex items-center gap-1.5 mr-1">
                <CalendarIcon size={12} className="text-muted-foreground" />
                <span>Started after: {startDate ? format(startDate, "MMM yyyy") : "–"}</span>
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
                <CalendarIcon size={12} className="text-muted-foreground" />
                <span>Started before: {endDate ? format(endDate, "MMM yyyy") : "–"}</span>
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
          {/* Clear all button on the right */}
          {(selectedIndustries.length > 0 || docketTypes.length > 0 || docketSubtypes.length > 0 || petitioners.length > 0 || normalizedSearch || relationshipTypes.length > 0 || isStartDateModified || isEndDateModified) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setSelectedIndustries([]);
                setDocketTypes([]);
                setDocketSubtypes([]);
                setPetitioners([]);
                setRelationshipTypes([]);
                setDateRange(undefined);
                if (months.length) {
                  setRange([0, months.length - 1]);
                }
              }}
              className="text-xs text-muted-foreground px-2 py-1 h-auto"
            >
              Clear all
            </Button>
          )}
        </div>
      </section>

      <section aria-label="Results" className="space-y-4">
        {showCardSkeletons ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <DocketCardSkeleton key={i} />
            ))}
          </div>
        ) : showNoDockets ? (
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
                  <Card className={cn("transition-colors hover:border-primary/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background group", isSelected ? "bg-muted" : "")}
                  >
                       <CardContent className="p-4 space-y-1">
                         <div className="flex items-start justify-between gap-3 mb-1 pb-2">
                         <div className="flex flex-wrap gap-1">
                             {d.docket_type && (
                               <Badge variant="outline" className={`inline-flex items-center gap-1.5 transition-colors ${getDocketTypeBadgeColors(d.docket_type)} ${getDocketTypeHoverBorderColors(d.docket_type)}`}>
                                 {(() => {
                                   const TypeIcon = getDocketTypeIcon(d.docket_type);
                                   const typeColor = getDocketTypeColor(d.docket_type);
                                   return <TypeIcon size={12} className={typeColor} />;
                                 })()}
                                 {d.docket_type}
                               </Badge>
                             )}
                           {d.docket_subtype && <Badge variant="outline" className="border-gray-300 bg-background group-hover:border-primary/30 transition-colors">{d.docket_subtype}</Badge>}
                         </div>
                         <div className="flex flex-col items-end gap-1">
                           {d.industry && (
                             <Badge variant="outline" className="inline-flex items-center gap-1.5 border-gray-300 bg-background group-hover:border-primary/30 transition-colors">
                               {(() => {
                                 const IndustryIcon = getIndustryIcon(d.industry);
                                 return <IndustryIcon size={12} className={getIndustryColor(d.industry)} />;
                               })()}
                               {d.industry}
                             </Badge>
                             )}
                            </div>
                          </div>
                         
                          <div className="border-t border-border/50 pt-3">
                           <div className="space-y-2 pb-2">
                           <div className="flex items-center justify-between">
                             <div className="text-sm text-foreground font-semibold">{d.docket_govid}</div>
                             <span className="text-xs text-muted-foreground">Opened: {d.opened_date && !isNaN(new Date(d.opened_date).getTime()) ? format(new Date(d.opened_date), "MMM d, yyyy") : "—"}</span>
                           </div>
                            <h3 className="text-sm font-normal leading-snug text-foreground">{d.docket_title ?? "Untitled docket"}</h3>
                          </div>
                          
                          <div className="border-t border-border/50 pt-3">
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
                          </div>
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
