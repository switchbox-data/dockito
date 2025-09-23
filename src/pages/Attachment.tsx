import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, ChevronUp, ChevronDown, Loader2, Calendar, User, FileText, Building, ChevronLeft, 
         Heart, DollarSign, Frown, Lock, Search, Flame, FileCheck, Gavel, Book, EyeOff, 
         FileSpreadsheet, TrendingUp, Microscope, Clipboard, CheckCircle, MessageCircle, 
         Lightbulb, HelpCircle, ZoomIn, ZoomOut, Sidebar, Maximize, Minimize, Folder, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Document, Page, pdfjs } from "react-pdf";
import { supabase } from "@/integrations/supabase/client";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

// Cache Blob URLs per attachment
const blobCache = new Map<string, string>();

// Loading component
const LoadingGlyph = ({ size = 28 }: { size?: number }) => (
  <div className="flex items-center justify-center p-4">
    <Loader2 size={size} className="text-muted-foreground animate-spin" />
  </div>
);

const AttachmentPage = () => {
  const { docket_govid, attachment_uuid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const safeDocket = docket_govid || location.pathname.split('/docket/')[1]?.split('/')[0] || "";
  
  const [attachment, setAttachment] = useState<any>(null);
  const [docket, setDocket] = useState<any>(null);
  const [filing, setFiling] = useState<any>(null);
  const [allAttachments, setAllAttachments] = useState<any[]>([]);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // PDF viewer state
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [scale, setScale] = useState(0.8);
  const viewerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [probing, setProbing] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch attachment, docket, and filing data
  useEffect(() => {
    const fetchData = async () => {
      if (!attachment_uuid || !docket_govid) return;
      
      try {
        setLoading(true);
        
        // Fetch attachment
        const { data: attachmentData, error: attachmentError } = await supabase
          .from('attachments')
          .select('*')
          .eq('uuid', attachment_uuid)
          .single();
        
        if (attachmentError) throw attachmentError;
        setAttachment(attachmentData);
        
        // Fetch docket
        const { data: docketData, error: docketError } = await supabase
          .from('dockets')
          .select('*')
          .eq('docket_govid', docket_govid)
          .single();
        
        if (docketError) throw docketError;
        setDocket(docketData);
        
        // Fetch filing info
        const { data: filingData, error: filingError } = await supabase
          .from('fillings')
          .select('*')
          .eq('uuid', attachmentData.parent_filling_uuid)
          .single();
        
        if (filingError) throw filingError;
        setFiling(filingData);
        
        // Fetch all attachments in this filing for navigation
        const { data: allAttachmentsData, error: attachmentsError } = await supabase
          .from('attachments')
          .select('*')
          .eq('parent_filling_uuid', attachmentData.parent_filling_uuid)
          .order('created_at');
        
        if (attachmentsError) throw attachmentsError;
        setAllAttachments(allAttachmentsData || []);
        
        // Find current attachment index
        const currentIndex = (allAttachmentsData || []).findIndex(att => att.uuid === attachment_uuid);
        setCurrentAttachmentIndex(currentIndex >= 0 ? currentIndex : 0);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load attachment');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [attachment_uuid, docket_govid]);

  // Helper function to get icon for filing types
  const getFilingTypeIcon = (type: string) => {
    const typeKey = type?.toLowerCase().trim();
    switch (typeKey) {
      case 'petition': return Heart;
      case 'tariff': return DollarSign;
      case 'complaint': return Frown;
      case 'contract': return Lock;
      case 'audit': return Search;
      case 'incident': return Flame;
      case 'compliance': return FileCheck;
      case 'commission instituted new case proceeding': return Gavel;
      case 'rulemaking': return Book;
      case 'exception from disclosure': return EyeOff;
      case 'company workpapers': return FileSpreadsheet;
      case 'analysis': return TrendingUp;
      case 'investigation': return Microscope;
      case 'office policy and procedures': return Clipboard;
      case 'authorization': return CheckCircle;
      case 'complaint and inquiry': return MessageCircle;
      case 'policy initiative': return Lightbulb;
      default: return HelpCircle;
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
        return 'text-red-600'; // Dark red for commands
      case 'motions':
        return 'text-cyan-600'; // Cyan for movements/actions
      case 'letters':
        return 'text-blue-500'; // Light blue for correspondence
      case 'comments':
      case 'public comments':
        return 'text-orange-600'; // Orange for public input
      case 'notices':
        return 'text-yellow-600'; // Yellow for announcements
      case 'rulings':
        return 'text-red-700'; // Dark red for judicial decisions
      case 'plans and proposals':
        return 'text-purple-600'; // Purple for future planning
      case 'exhibits':
        return 'text-pink-600'; // Pink for evidence/displays
      case 'contract':
        return 'text-purple-700'; // Dark purple for agreements
      case 'press releases':
        return 'text-amber-600'; // Amber for announcements
      case 'transcripts':
        return 'text-slate-600'; // Slate for recorded proceedings
      case 'testimony':
        return 'text-rose-600'; // Rose for witness statements
      case 'joint proposals and stipulations':
        return 'text-lime-600'; // Lime for collaborative agreements
      case 'briefs':
        return 'text-indigo-600'; // Dark indigo for legal documents
      case 'attachment':
        return 'text-gray-600'; // Gray for supporting documents
      case 'complaints':
        return 'text-red-600'; // Red for grievances
      case 'memorandum':
      case 'memorandum and resolution':
        return 'text-blue-700'; // Dark blue for official memos
      case 'application':
        return 'text-green-700'; // Dark green for formal requests
      case 'protective order':
        return 'text-orange-700'; // Dark orange for protective measures
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

  // Navigation functions
  const goToPrevAttachment = () => {
    if (currentAttachmentIndex > 0) {
      const prevAttachment = allAttachments[currentAttachmentIndex - 1];
      navigate(`/docket/${safeDocket}/attachment/${prevAttachment.uuid}`);
    }
  };

  const goToNextAttachment = () => {
    if (currentAttachmentIndex < allAttachments.length - 1) {
      const nextAttachment = allAttachments[currentAttachmentIndex + 1];
      navigate(`/docket/${safeDocket}/attachment/${nextAttachment.uuid}`);
    }
  };

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      try {
        const pdfContainer = document.getElementById('pdf-container');
        if (pdfContainer) {
          await pdfContainer.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (err) {
        console.error('Failed to enter fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('Failed to exit fullscreen:', err);
      }
    }
  };

  const downloadPDF = () => {
    if (!attachment || !blobUrl) return;
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = attachment.attachment_title || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const buildFileUrl = (a: any, useOriginal = false) => {
    const hash = a?.blake2b_hash?.toString().trim();
    if (hash && !useOriginal) {
      return `https://temporary-openscrapersapi-x6wb2.ondigitalocean.app/public/raw_attachments/${encodeURIComponent(hash)}/raw`;
    }
    return a?.attachment_url!;
  };

  // Pre-fetch PDF and cache Blob URLs
  useEffect(() => {
    if (!attachment) return;
    const url = buildFileUrl(attachment);
    setLoadErr(null);
    setProbing(true);
    setBlobUrl(null);
    setNumPages(0);

    // Use cached Blob URL if available
    const cached = blobCache.get(attachment.uuid);
    if (cached) {
      setBlobUrl(cached);
      setProbing(false);
      return;
    }

    let aborted = false;

    fetch(url, { method: 'GET', mode: 'cors' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }
        const blob = await res.blob();
        if (aborted) return;
        const objectUrl = URL.createObjectURL(blob);
        blobCache.set(attachment.uuid, objectUrl);
        setBlobUrl(objectUrl);
      })
      .catch(async (err) => {
        if (aborted) return;
        
        // Try the original URL as fallback
        const hasHash = attachment?.blake2b_hash?.toString().trim();
        if (hasHash && url.includes('temporary-openscrapersapi')) {
          const originalUrl = buildFileUrl(attachment, true);
          
          try {
            const fallbackRes = await fetch(originalUrl, { method: 'GET', mode: 'cors' });
            if (fallbackRes.ok) {
              const blob = await fallbackRes.blob();
              if (!aborted) {
                const objectUrl = URL.createObjectURL(blob);
                blobCache.set(attachment.uuid, objectUrl);
                setBlobUrl(objectUrl);
                return;
              }
            }
          } catch (fallbackErr) {
            console.error('Fallback fetch also failed:', fallbackErr);
          }
        }
        
        setLoadErr('Failed to load PDF');
      })
      .finally(() => {
        if (!aborted) setProbing(false);
      });

    return () => {
      aborted = true;
    };
  }, [attachment?.uuid]);

  const onDocumentLoadSuccess = async (doc: any) => {
    const { numPages } = doc || {};
    setNumPages(numPages || 0);

    // Auto-fit to viewer
    try {
      if (viewerRef.current) {
        const firstPage = await doc.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 });
        const available = viewerRef.current.clientWidth || 0;
        if (viewport?.width && available > 0) {
          const autoFitScale = Math.max(0.5, Math.min(2, available / viewport.width));
          setScale(autoFitScale * 0.6); // More zoomed out - reduced from 0.9 to 0.6
        }
      }
    } catch (e) {
      // ignore failures to compute fit
    }
  };

  const scrollToPage = (p: number) => {
    const target = Math.min(Math.max(p, 1), numPages || 1);
    const el = pageRefs.current[target];
    if (el && viewerRef.current) {
      viewerRef.current.scrollTo({
        top: el.offsetTop,
        behavior: 'smooth',
      });
    }
    setPage(target);
  };

  const pagesArr = useMemo(() => Array.from({ length: numPages }, (_, i) => i + 1), [numPages]);

  // Update current page based on scroll position
  useEffect(() => {
    const root = viewerRef.current;
    if (!root) return;

    const updateVisiblePage = () => {
      let best = 1;
      let bestRatio = 0;
      const rootRect = root.getBoundingClientRect();
      pagesArr.forEach((p) => {
        const el = pageRefs.current[p];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const visible = Math.min(rect.bottom, rootRect.bottom) - Math.max(rect.top, rootRect.top);
        const ratio = Math.max(0, visible) / Math.max(1, rect.height);
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = p;
        }
      });
      if (best !== page) {
        setPage(best);
      }
    };

    root.addEventListener('scroll', updateVisiblePage, { passive: true } as EventListenerOptions);
    updateVisiblePage();

    return () => {
      root.removeEventListener('scroll', updateVisiblePage as EventListener);
    };
  }, [viewerRef.current, pagesArr, page, scale]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingGlyph size={48} />
        </div>
      </div>
    );
  }

  if (error || !attachment || !docket) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Attachment not found</h1>
          <p className="text-muted-foreground mb-4">{error || 'The requested attachment could not be found.'}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Attachment Info Card - Non-sticky */}
        <Card>
          <CardHeader>
            {/* Filing Type Badge at Top Left */}
            {filing?.filling_type && (
              <div className="mb-4">
                <Badge 
                  variant="outline" 
                  className={`inline-flex items-center gap-1.5 transition-colors ${getFilingTypeBadgeColors(filing.filling_type)}`}
                >
                  {(() => {
                    const TypeIcon = getFilingTypeIcon(filing.filling_type);
                    const typeColor = getFilingTypeColor(filing.filling_type);
                    return <TypeIcon size={12} className={typeColor} />;
                  })()}
                  {filing.filling_type}
                </Badge>
                <div className="h-px bg-border mt-4" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-muted rounded-lg p-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold leading-tight">
                  {attachment.attachment_title || 'Document'}
                </CardTitle>
              </div>
              
              {/* Separator below title */}
              <div className="h-px bg-border mb-4" />
              
              {/* Metadata items - bigger and reorganized */}
              <div className="space-y-3 text-base">
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-muted-foreground" />
                  <span>Docket </span>
                  <button 
                    onClick={() => navigate(`/docket/${safeDocket}`)}
                    className="text-primary hover:underline font-medium"
                  >
                    {safeDocket}
                  </button>
                </div>
                
                {filing && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span>Filed on {formatDate(filing.filed_date)}</span>
                  </div>
                )}
                
                {filing?.organization_author_strings?.[0] && (
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <span>Filed by</span>
                    <Badge 
                      variant="outline" 
                      className="bg-background border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
                      onClick={() => navigate(`/org/${encodeURIComponent(filing.organization_author_strings[0])}`)}
                    >
                      {filing.organization_author_strings[0]}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Sticky Filter Bar */}
        <div className="sticky top-14 z-30">
          <div className="relative border border-gray-300 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-[var(--shadow-elegant)] rounded-md">
            <div className="relative z-10 flex items-center gap-2 md:gap-3 p-2 md:p-3">
              {/* Document Navigation */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToPrevAttachment}
                  disabled={currentAttachmentIndex <= 0}
                >
                  <ChevronLeft size={16} />
                  <span className="hidden sm:inline ml-1">Prev</span>
                </Button>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Doc {currentAttachmentIndex + 1} / {allAttachments.length}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToNextAttachment}
                  disabled={currentAttachmentIndex >= allAttachments.length - 1}
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight size={16} />
                </Button>
              </div>

              <div className="h-6 w-px bg-border" />

              {/* Page Navigation */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => scrollToPage(page - 1)} disabled={page <= 1}>
                  <ChevronUp size={16} />
                  <span className="hidden sm:inline ml-1">Prev</span>
                </Button>
                <span className="text-sm text-muted-foreground whitespace-nowrap px-2">
                  Page {page} / {numPages || 1}
                </span>
                <Button variant="outline" size="sm" onClick={() => scrollToPage(page + 1)} disabled={page >= numPages}>
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronDown size={16} />
                </Button>
              </div>

              <div className="h-6 w-px bg-border" />

              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setScale(s => Math.max(0.3, s - 0.1))}
                  aria-label="Zoom out"
                >
                  <ZoomOut size={16} />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setScale(s => Math.min(3, s + 0.1))}
                  aria-label="Zoom in"
                >
                  <ZoomIn size={16} />
                </Button>
              </div>

              <div className="h-6 w-px bg-border" />

              {/* Thumbnail Sidebar Toggle */}
              <Button 
                variant={showThumbnails ? "default" : "outline"} 
                size="sm" 
                onClick={() => setShowThumbnails(!showThumbnails)}
                aria-label="Toggle thumbnails"
              >
                <Sidebar size={16} />
                <span className="hidden md:inline ml-1">Thumbnails</span>
              </Button>

              <div className="h-6 w-px bg-border" />

              {/* Fullscreen Toggle */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                <span className="hidden md:inline ml-1">
                  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </span>
              </Button>

              {/* Download PDF */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadPDF}
                disabled={!blobUrl || !!loadErr}
                aria-label="Download PDF"
              >
                <Download size={16} />
                <span className="hidden md:inline ml-1">Download</span>
              </Button>
            </div>
          </div>
        </div>

        {/* PDF Viewer with Sidebar */}
        <div 
          id="pdf-container" 
          className={`relative rounded-lg border bg-background flex ${
            isFullscreen ? 'fullscreen-pdf-container' : ''
          }`}
          style={isFullscreen ? {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            borderRadius: 0,
            border: 'none'
          } : {}}
        >
          {/* Thumbnail Sidebar */}
          {showThumbnails && (
            <aside 
              className="w-40 shrink-0 border-r bg-muted overflow-auto p-2" 
              style={{ height: isFullscreen ? '100vh' : '800px' }}
            >
              {attachment && (
                <Document 
                  key={attachment.uuid} 
                  file={blobUrl ?? buildFileUrl(attachment)} 
                  loading={<LoadingGlyph size={24} />}
                  onLoadError={() => {}} 
                  onSourceError={() => {}}
                  error={<></>}
                >
                  {pagesArr.map((p) => (
                    <div key={p} className="mb-3 text-center">
                      <button
                        onClick={() => scrollToPage(p)}
                        className={`inline-block rounded border overflow-hidden ${p === page ? 'ring-2 ring-primary' : ''}`}
                      >
                        <div className="flex justify-center bg-background">
                          <Page pageNumber={p} width={120} renderTextLayer={false} renderAnnotationLayer={false} />
                        </div>
                      </button>
                      <div className="text-xs text-muted-foreground mt-1">{p}</div>
                    </div>
                  ))}
                </Document>
              )}
            </aside>
          )}

          {/* Main PDF Viewer */}
          <div className="flex-1 flex flex-col">
            <div 
              ref={viewerRef} 
              className={`overflow-auto p-4 flex-1 ${
                isFullscreen ? 'flex items-center justify-center' : ''
              }`}
              style={{ 
                height: isFullscreen ? '100vh' : '800px',
                maxWidth: isFullscreen ? '100%' : undefined
              }}
            >
              {attachment && (
                loadErr ? (
                  <div className="p-6 text-center">
                    <div className="text-muted-foreground">Unable to display this document.</div>
                  </div>
                ) : (
                  <Document
                    key={attachment.uuid}
                    file={blobUrl ?? buildFileUrl(attachment)}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={() => setLoadErr('Failed to load PDF')}
                    onSourceError={() => setLoadErr('Failed to load PDF')}
                    loading={<LoadingGlyph size={48} />}
                    className={`flex flex-col items-center ${
                      isFullscreen ? 'w-full max-w-5xl mx-auto' : ''
                    }`}
                  >
                    {pagesArr.map((p) => (
                      <div
                        key={p}
                        ref={(el) => { pageRefs.current[p] = el; }}
                        data-page={p}
                        className={`mb-6 shadow-md ${
                          isFullscreen ? 'max-w-none' : ''
                        }`}
                      >
                        <Page 
                          pageNumber={p} 
                          scale={isFullscreen ? Math.max(scale, 1.2) : scale} 
                          renderTextLayer={false} 
                          renderAnnotationLayer={false}
                          className="border"
                        />
                      </div>
                    ))}
                  </Document>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttachmentPage;