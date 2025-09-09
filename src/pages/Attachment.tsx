import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, ChevronUp, ChevronDown, Loader2, Calendar, User, FileText, Building } from "lucide-react";
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
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load attachment');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [attachment_uuid, docket_govid]);

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
          setScale(autoFitScale * 0.9); // Slightly smaller for margins
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
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>State: New York</span>
          <ChevronRight className="h-4 w-4" />
          <button 
            onClick={() => navigate(`/docket/${safeDocket}`)}
            className="hover:text-foreground transition-colors"
          >
            Docket: {safeDocket}
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Doc: {attachment.attachment_title || 'Document'}</span>
        </nav>

        {/* Attachment Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-xl">
                  {attachment.attachment_title || 'Document'}
                </CardTitle>
                <CardDescription className="text-base">
                  {docket.docket_title}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => scrollToPage(page - 1)} disabled={page <= 1}>
                  <ChevronUp size={16} />
                </Button>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Page {page} / {numPages || 1}
                </span>
                <Button variant="outline" size="sm" onClick={() => scrollToPage(page + 1)} disabled={page >= numPages}>
                  <ChevronDown size={16} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filing && (
                <>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Filed Date</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(filing.filed_date)}
                      </div>
                    </div>
                  </div>
                  
                  {filing.organization_author_strings?.[0] && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Filed By</div>
                        <div className="text-sm text-muted-foreground">
                          {filing.organization_author_strings[0]}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {filing.filling_type && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Filing Type</div>
                        <div className="text-sm text-muted-foreground">
                          {filing.filling_type}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {docket.industry && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{docket.industry}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PDF Viewer */}
        <div className="relative rounded-lg border bg-background">
          <div ref={viewerRef} className="h-[800px] overflow-auto p-4">
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
                  className="flex flex-col items-center"
                >
                  {pagesArr.map((p) => (
                    <div
                      key={p}
                      ref={(el) => { pageRefs.current[p] = el; }}
                      data-page={p}
                      className="mb-6 shadow-md"
                    >
                      <Page 
                        pageNumber={p} 
                        scale={scale} 
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
          
          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setScale(s => Math.max(0.3, s - 0.1))}
                aria-label="Zoom out"
              >
                -
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setScale(s => Math.min(3, s + 0.1))}
                aria-label="Zoom in"
              >
                +
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttachmentPage;