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
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { ExpandingSearchInput } from "@/components/ExpandingSearchInput";
import { useResponsiveLabels } from "@/hooks/use-responsive-labels";
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

  // Toolbar measurement refs
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sortBtnRef = useRef<HTMLButtonElement>(null);
  const { sortLabelRef, filterLabelRef, showSortLabel, showFilterLabel } = useResponsiveLabels({
    containerRef: scrollerRef,
    sortButtonRef: sortBtnRef,
  });


  const typePalette = [
    "bg-primary/10 text-primary", 
    "bg-destructive/10 text-destructive", 
    "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400", 
    "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
    "bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400",
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
    "bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400",
    "bg-lime-100 text-lime-700 dark:bg-lime-900/20 dark:text-lime-400"
  ];
  const typeClass = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) { hash = (hash + name.charCodeAt(i)) % 1000; }
    return typePalette[hash % typePalette.length];
  };

  // Helper function to get appropriate icon for filing types
  const getFilingTypeIcon = (type: string) => {
    const typeKey = type?.toLowerCase().trim();
    switch (typeKey) {
      case 'correspondence':
        return Mail; // Email/mail for correspondence
      case 'reports':
        return FileBarChart; // Chart report for reports
      case 'tariff':
      case 'tariffs':
        return DollarSign; // Rate changes
      case 'petitions':
        return Heart; // Prayer/thank you hands - someone asking for something
      case 'orders':
        return Gavel; // Legal orders
      case 'motions':
        return Play; // Taking action, making a move in the case
      case 'letters':
        return Mail; // Letters are similar to correspondence
      case 'comments':
      case 'public comments':
        return MessageSquare; // Public comments
      case 'notices':
        return Bell; // Notifications/notices
      case 'rulings':
        return Scale; // Justice/legal rulings
      case 'plans and proposals':
        return FileCheck; // Planning documents
      case 'exhibits':
        return Presentation; // Display/presentation materials
      case 'contract':
        return Lock; // Lock for contracts
      case 'press releases':
        return Megaphone; // Announcements
      case 'transcripts':
        return FileType; // Text documents
      case 'testimony':
        return Mic; // Microphone for oral testimony
      case 'joint proposals and stipulations':
        return Handshake; // Agreements/handshakes
      case 'briefs':
        return FileSignature; // Legal documents
      case 'attachment':
        return Paperclip; // Attachments
      case 'complaints':
        return AlertCircle; // Complaints/issues
      case 'memorandum':
      case 'memorandum and resolution':
        return BookOpen; // Internal memos
      case 'application':
        return ClipboardList; // Applications
      case 'protective order':
        return Shield; // Protection/security
      case 'consumer complaint determinations':
        return Scale; // Decisions/determinations
      case 'active party lists':
        return Users; // Lists of people
      case 'declaratory ruling':
        return Gavel; // Official rulings
      case 'session item':
        return Settings; // Session/meeting items
      case 'workpapers':
        return FileSpreadsheet; // Work documents
      case 'resource determination':
        return Search; // Research/determination
      case 'maps and figures':
        return MapPin; // Maps and visuals
      case '753 evidence':
        return FileCheck; // Evidence
      case 'affidavit of service':
        return FileSignature; // Legal affidavits
      case 'recommended decisions':
        return Lightbulb; // Recommendations
      case 'compliance':
        return Shield; // Compliance
      case 'discovery':
        return Search; // Legal discovery
      case 'permit':
        return Lock; // Permits/authorization
      case 'esco application':
        return ClipboardList; // Applications
      case 'municipal statement of local law compliance':
        return FileCheck; // Compliance statements
      case 'guidance documents/policy statements':
        return BookOpen; // Guidance documents
      case 'petition for party status':
        return Heart; // Petition/request
      case 'applicant statement of issues':
        return MessageSquare; // Statements
      case 'citation':
        return FileText; // Citations
      case 'migrated internal document':
        return Settings; // Internal/system documents
      default:
        return HelpCircle; // Miscellaneous and others
    }
  };

  // Helper function to get semantic colors for filing types
  const getFilingTypeColor = (type: string) => {
    const typeKey = type?.toLowerCase().trim();
    switch (typeKey) {
      case 'correspondence':
        return 'text-blue-600'; // Blue for communication
      case 'reports':
        return 'text-green-600'; // Green for reports/data
      case 'tariff':
      case 'tariffs':
        return 'text-emerald-600'; // Emerald for rates/money
      case 'petitions':
        return 'text-purple-600'; // Purple for requests
      case 'orders':
        return 'text-red-700'; // Dark red for official orders
      case 'motions':
        return 'text-cyan-600'; // Cyan for movement/motions
      case 'letters':
        return 'text-blue-500'; // Light blue for letters
      case 'comments':
      case 'public comments':
        return 'text-orange-600'; // Orange for public input
      case 'notices':
        return 'text-yellow-600'; // Yellow for notifications
      case 'rulings':
        return 'text-red-600'; // Red for legal decisions
      case 'plans and proposals':
        return 'text-purple-600'; // Purple for planning
      case 'exhibits':
        return 'text-pink-600'; // Pink for displays
      case 'contract':
        return 'text-purple-700'; // Dark purple for contracts
      case 'press releases':
        return 'text-amber-600'; // Amber for announcements
      case 'transcripts':
        return 'text-slate-600'; // Slate for transcripts
      case 'testimony':
        return 'text-rose-600'; // Rose for testimony
      case 'joint proposals and stipulations':
        return 'text-lime-600'; // Lime for agreements
      case 'briefs':
        return 'text-indigo-700'; // Dark indigo for legal briefs
      case 'attachment':
        return 'text-gray-600'; // Gray for attachments
      case 'complaints':
        return 'text-red-500'; // Red for complaints
      case 'memorandum':
      case 'memorandum and resolution':
        return 'text-blue-700'; // Dark blue for memos
      case 'application':
        return 'text-green-700'; // Dark green for applications
      case 'protective order':
        return 'text-orange-700'; // Dark orange for protection
      case 'consumer complaint determinations':
        return 'text-red-700'; // Dark red for determinations
      case 'active party lists':
        return 'text-cyan-700'; // Dark cyan for lists
      case 'declaratory ruling':
        return 'text-purple-800'; // Dark purple for rulings
      case 'session item':
        return 'text-gray-700'; // Dark gray for sessions
      case 'workpapers':
        return 'text-amber-700'; // Dark amber for work docs
      case 'resource determination':
        return 'text-teal-700'; // Dark teal for research
      case 'maps and figures':
        return 'text-pink-700'; // Dark pink for visuals
      case '753 evidence':
        return 'text-green-800'; // Dark green for evidence
      case 'affidavit of service':
        return 'text-indigo-800'; // Dark indigo for affidavits
      case 'recommended decisions':
        return 'text-yellow-700'; // Dark yellow for recommendations
      case 'compliance':
        return 'text-emerald-700'; // Dark emerald for compliance
      case 'discovery':
        return 'text-orange-800'; // Dark orange for discovery
      case 'permit':
        return 'text-purple-900'; // Dark purple for permits
      case 'esco application':
        return 'text-green-900'; // Dark green for ESCO apps
      case 'municipal statement of local law compliance':
        return 'text-blue-800'; // Dark blue for municipal docs
      case 'guidance documents/policy statements':
        return 'text-slate-700'; // Dark slate for guidance
      case 'petition for party status':
        return 'text-purple-500'; // Medium purple for petitions
      case 'applicant statement of issues':
        return 'text-orange-500'; // Medium orange for statements
      case 'citation':
        return 'text-gray-800'; // Dark gray for citations
      case 'migrated internal document':
        return 'text-slate-500'; // Medium slate for internal docs
      default:
        return 'text-muted-foreground'; // Default muted color
    }
  };

  // Helper function to get subtle background and border colors for filing type badges
  const getFilingTypeBadgeColors = (type: string) => {
    const typeKey = type?.toLowerCase().trim();
    switch (typeKey) {
      case 'correspondence':
        return 'bg-blue-50 border-blue-200'; // Blue theme
      case 'reports':
        return 'bg-green-50 border-green-200'; // Green theme
      case 'tariff':
      case 'tariffs':
        return 'bg-emerald-50 border-emerald-200'; // Emerald theme
      case 'petitions':
        return 'bg-purple-50 border-purple-200'; // Purple theme
      case 'orders':
        return 'bg-red-50 border-red-200'; // Dark red theme
      case 'motions':
        return 'bg-cyan-50 border-cyan-200'; // Cyan theme
      case 'letters':
        return 'bg-blue-50 border-blue-300'; // Light blue theme
      case 'comments':
      case 'public comments':
        return 'bg-orange-50 border-orange-200'; // Orange theme
      case 'notices':
        return 'bg-yellow-50 border-yellow-200'; // Yellow theme
      case 'rulings':
        return 'bg-red-50 border-red-200'; // Red theme
      case 'plans and proposals':
        return 'bg-purple-50 border-purple-200'; // Purple theme
      case 'exhibits':
        return 'bg-pink-50 border-pink-200'; // Pink theme
      case 'contract':
        return 'bg-purple-50 border-purple-300'; // Dark purple theme
      case 'press releases':
        return 'bg-amber-50 border-amber-200'; // Amber theme
      case 'transcripts':
        return 'bg-slate-50 border-slate-200'; // Slate theme
      case 'testimony':
        return 'bg-rose-50 border-rose-200'; // Rose theme
      case 'joint proposals and stipulations':
        return 'bg-lime-50 border-lime-200'; // Lime theme
      case 'briefs':
        return 'bg-indigo-50 border-indigo-300'; // Dark indigo theme
      case 'attachment':
        return 'bg-gray-50 border-gray-200'; // Gray theme
      case 'complaints':
        return 'bg-red-50 border-red-300'; // Red theme (different border)
      case 'memorandum':
      case 'memorandum and resolution':
        return 'bg-blue-50 border-blue-300'; // Dark blue theme
      case 'application':
        return 'bg-green-50 border-green-300'; // Dark green theme
      case 'protective order':
        return 'bg-orange-50 border-orange-300'; // Dark orange theme
      default:
        return 'bg-gray-50 border-gray-200'; // Default theme
    }
  };

  // Helper function to get darker border colors for filing type badge hover
  const getFilingTypeHoverBorderColors = (type: string) => {
    const typeKey = type?.toLowerCase().trim();
    switch (typeKey) {
      case 'correspondence':
        return 'group-hover:border-blue-600'; // Blue theme
      case 'reports':
        return 'group-hover:border-green-600'; // Green theme
      case 'tariff':
      case 'tariffs':
        return 'group-hover:border-emerald-600'; // Emerald theme
      case 'petitions':
        return 'group-hover:border-purple-600'; // Purple theme
      case 'orders':
        return 'group-hover:border-red-600'; // Dark red theme
      case 'motions':
        return 'group-hover:border-cyan-600'; // Cyan theme
      case 'letters':
        return 'group-hover:border-blue-600'; // Light blue theme
      case 'comments':
      case 'public comments':
        return 'group-hover:border-orange-600'; // Orange theme
      case 'notices':
        return 'group-hover:border-yellow-600'; // Yellow theme
      case 'rulings':
        return 'group-hover:border-red-600'; // Red theme
      case 'plans and proposals':
        return 'group-hover:border-purple-600'; // Purple theme
      case 'exhibits':
        return 'group-hover:border-pink-600'; // Pink theme
      case 'contract':
        return 'group-hover:border-purple-600'; // Dark purple theme
      case 'press releases':
        return 'group-hover:border-amber-600'; // Amber theme
      case 'transcripts':
        return 'group-hover:border-slate-600'; // Slate theme
      case 'testimony':
        return 'group-hover:border-rose-600'; // Rose theme
      case 'joint proposals and stipulations':
        return 'group-hover:border-lime-600'; // Lime theme
      case 'briefs':
        return 'group-hover:border-indigo-600'; // Dark indigo theme
      case 'attachment':
        return 'group-hover:border-gray-600'; // Gray theme
      case 'complaints':
        return 'group-hover:border-red-600'; // Red theme (different border)
      case 'memorandum':
      case 'memorandum and resolution':
        return 'group-hover:border-blue-600'; // Dark blue theme
      case 'application':
        return 'group-hover:border-green-600'; // Dark green theme
      case 'protective order':
        return 'group-hover:border-orange-600'; // Dark orange theme
      default:
        return 'group-hover:border-gray-600'; // Default theme
    }
  };

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

  // Organizations that appear in the currently filtered result set
  const organizations = useMemo(() => {
    const set = new Set<string>();
    filtered.forEach((f) => {
      f.organization_author_strings?.forEach((o) => set.add(o));
    });
    return Array.from(set).sort();
  }, [filtered]);

  // Filing types - show all available types from original data, not filtered
  const types = useMemo(() => {
    const set = new Set<string>();
    filings.forEach((f) => {
      if (f.filling_type) set.add(f.filling_type);
    });
    return Array.from(set).sort();
  }, [filings]);

  useEffect(() => {
    // Close viewer if active filing disappears (filter changed)
    if (viewer && !filtered.find(f => f.uuid === viewer.filingId)) {
      setViewer(null);
    }
  }, [filtered, viewer]);

  // Focus and clamp selection
  // Removed automatic focus on mount to avoid scroll snapping when filings load
  useEffect(() => {
    if (!filtered.length) { setSelectedIndex(0); setSelectedAttachmentIdx(null); return; }
    if (selectedIndex > filtered.length - 1) setSelectedIndex(filtered.length - 1);
    const filing = filtered[Math.min(selectedIndex, filtered.length - 1)];
    const attCount = filing ? filing.attachments.length : 0;
    if (selectedAttachmentIdx !== null && selectedAttachmentIdx >= attCount) setSelectedAttachmentIdx(attCount ? attCount - 1 : null);
  }, [filtered, selectedIndex, selectedAttachmentIdx]);

  // Refocus the keyboard container after the PDF modal closes (but not on initial mount)
  useEffect(() => {
    if (!didInitRef.current) { didInitRef.current = true; return; }
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
      <div className="sticky top-14 z-30">
        <div className="relative border border-gray-300 bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/75 shadow-[var(--shadow-elegant)] rounded-md mb-3">
          <div className="absolute inset-0 pointer-events-none opacity-60" style={{ background: "var(--gradient-subtle)" }} />
          <div ref={scrollerRef} className="relative z-10 p-2 md:p-3 overflow-x-auto min-w-0">
            {/* Single flowing container - no justify-between so everything can be pushed */}
            <div className="flex items-center gap-2 md:gap-3 min-w-0 overflow-x-auto">
              <ExpandingSearchInput
                ref={searchRef}
                value={query}
                onChange={setQuery}
                placeholder="Search filings..."
                containerRef={containerRef}
              />

              {/* Filter label - dynamic: appears only when there's space (after Sort) */}
              <span
                ref={filterLabelRef}
                className={cn(
                  "text-sm text-muted-foreground font-medium whitespace-nowrap",
                  showFilterLabel ? "inline-block" : "absolute -z-10 opacity-0 pointer-events-none"
                )}
                style={showFilterLabel ? { marginLeft: "clamp(0rem, 5vw - 2rem, 3rem)" } : undefined}
              >
                Filter:
              </span>

              <Popover open={orgOpen} onOpenChange={setOrgOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="shrink-0 justify-between hover:border-primary/30">
                      <span className="inline-flex items-center gap-2">
                        <Users size={16} className="text-muted-foreground" />
                        {selectedOrgs.length ? `Organizations (${selectedOrgs.length})` : "Organizations"}
                      </span>
                      <ChevronDown size={14} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0 z-[60] bg-popover border max-h-[500px]" align="start">
                    <Command className="h-full">
                      <CommandInput placeholder="Search organizations..." className="text-sm" />
                      <CommandList className="max-h-[420px]">
                        <CommandEmpty>No results.</CommandEmpty>
                        <CommandGroup heading="Organizations">
                          <CommandItem onSelect={() => setSelectedOrgs([])} className="py-2">
                            <div className="flex items-center gap-2">
                              <X size={14} className="text-muted-foreground" />
                              <span className="font-medium">Clear all</span>
                            </div>
                          </CommandItem>
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
                                className="py-2"
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
                    <Button variant="outline" className="shrink-0 justify-between hover:border-primary/30">
                      <span className="inline-flex items-center gap-2">
                        <Shapes size={16} className="text-muted-foreground" />
                        {selectedTypes.length ? `Types (${selectedTypes.length})` : "Types"}
                      </span>
                      <ChevronDown size={14} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[700px] p-0 z-[60] bg-popover border max-h-[600px] overflow-y-auto" align="start">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold">Filing Types</h3>
                        <div className="flex items-center gap-2">
                          {selectedTypes.length > 0 && (
                            <Button variant="outline" size="sm" onClick={() => setSelectedTypes([])}>Clear</Button>
                          )}
                          <Button size="sm" onClick={() => setTypeOpen(false)}>Done</Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {types.map((t) => {
                          const isSelected = selectedTypes.includes(t);
                          const Icon = getFilingTypeIcon(t);
                          return (
                            <button
                              key={t}
                              onClick={() => {
                                setSelectedTypes((prev) => prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]);
                              }}
                              className={cn(
                                "flex items-center gap-2 p-3 rounded-md border transition-colors text-left",
                                isSelected ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50 border-border"
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
              <DateRangeFilter
                months={months}
                range={range}
                onRangeChange={(r) => setRange(r)}
                open={dateOpen}
                onOpenChange={setDateOpen}
              />

              {/* Sort section - now flows naturally, can be pushed by expanding search */}
              {/* Sort label - dynamic: appears only when there's space */}
              <span
                ref={sortLabelRef}
                className={cn(
                  "text-sm text-muted-foreground font-medium whitespace-nowrap",
                  showSortLabel ? "inline-block" : "absolute -z-10 opacity-0 pointer-events-none"
                )}
                style={showSortLabel ? { marginLeft: "clamp(0rem, 5vw - 2rem, 3rem)" } : undefined}
              >
                Sort:
              </span>
              <Button ref={sortBtnRef} variant="outline" className="hover:border-primary/30" onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}>
                {sortDir === "desc" ? "↓" : "↑"} Date
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter badges section - separate from sticky bar, matches Dockets page architecture */}
      {(selectedOrgs.length > 0 || selectedTypes.length > 0 || !!query || !isFullRange) && (
        <section aria-label="Active filters" className="mb-4">
          <div className="relative flex flex-wrap items-center gap-2 text-sm px-1">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Results count - only show when filters are active */}
              {(selectedOrgs.length > 0 || selectedTypes.length > 0 || query || !isFullRange) && (
                <span className="text-muted-foreground font-medium">
                  {filtered.length === 1 ? "1 filing found with:" : `${filtered.length} filings found with:`}
                </span>
              )}
              {selectedOrgs.map((o) => (
                <Badge key={`org-${o}`} variant="secondary" className="px-2 py-1">
                  <div className="flex items-center gap-1.5 mr-1">
                    <Users size={12} className="text-muted-foreground" />
                    <span>Organization: {o}</span>
                  </div>
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
                <div className="flex items-center gap-1.5 mr-1">
                  <Shapes size={12} className="text-muted-foreground" />
                  <span>Type: {t}</span>
                </div>
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
            {query && (
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
                  <span>Filed on or after: {range && months.length ? format(months[range[0]], "MMM yyyy") : "–"}</span>
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
                  <span>Filed on or before: {range && months.length ? format(months[range[1]], "MMM yyyy") : "–"}</span>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedOrgs([]);
                setSelectedTypes([]);
                setQuery("");
                if (months.length) {
                  setRange([0, months.length - 1]);
                }
              }}
              className="text-xs text-muted-foreground px-2 py-1 h-auto"
            >
              Clear all
            </Button>
          </div>
        </section>
      )}

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
                  onClick={() => { setSelectedIndex(idx); setSelectedAttachmentIdx(isOpen ? null : (f.attachments.length ? 0 : null)); setOpenIds((prev) => { const next = new Set(prev); if (isOpen) next.delete(f.uuid); else next.add(f.uuid); return next; }); }}
                  aria-expanded={isOpen}
                >
                  {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {f.filling_type && (
                          <Badge variant="outline" className={`inline-flex items-center gap-1.5 transition-colors ${getFilingTypeBadgeColors(f.filling_type)} ${getFilingTypeHoverBorderColors(f.filling_type)}`}>
                            {(() => {
                              const TypeIcon = getFilingTypeIcon(f.filling_type);
                              const typeColor = getFilingTypeColor(f.filling_type);
                              return <TypeIcon size={12} className={typeColor} />;
                            })()}
                            {f.filling_type}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{format(new Date(f.filed_date), "PPP")}</span>
                    </div>
                    <h3 className="font-medium leading-tight mb-3">{f.filling_name ?? f.filling_type ?? "Filing"}</h3>
                    <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                      <span>Filed by:</span>
                      {f.organization_author_strings?.map((org, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="bg-background border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/org/${encodeURIComponent(org)}`); }}
                        >
                          {org}
                        </Badge>
                      )) || <span>—</span>}
                    </div>
                  </div>
                </button>
                
                {/* Subtle separator line between filing details and attachments */}
                {isOpen && f.attachments.length > 0 && (
                  <div className="mt-3 mb-3 mx-2 border-t border-border/30"></div>
                )}

              {isOpen && (
                <div className={cn("grid gap-2 relative", f.attachments.length > 0 ? "ml-[41px]" : "mt-3 text-sm text-muted-foreground ml-2")}>
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
                          <span className={[buttonVariants({ size: "sm", variant: "outline" }), "pointer-events-none flex items-center gap-2 leading-none shrink-0 ml-3", "group-hover/att:border-primary/30", isSelectedAtt ? "bg-muted text-foreground border-muted-foreground/20" : ""].join(" ")}> <Eye size={16} aria-hidden="true" /><span>Open</span></span>
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
  );
};

const FileIcon = ({ ext }: { ext: string }) => {
  const e = ext.toLowerCase();
  if (e === "pdf") return <FileText className="text-foreground/80" size={18} />;
  if (e === "xlsx" || e === "xls") return <FileSpreadsheet className="text-foreground/80" size={18} />;
  if (e === "zip") return <FileArchive className="text-foreground/80" size={18} />;
  return <FileText className="text-foreground/80" size={18} />;
};
