import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { Attachment } from "@/data/mock";
import { Document, Page, pdfjs } from "react-pdf";
import { useLocation, useNavigate } from "react-router-dom";

// Configure PDF.js worker (Vite + pdfjs-dist v3 to match react-pdf)
// Align API and Worker versions to avoid "API version does not match Worker version" errors.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

// Persist page position per attachment
const pageMemory = new Map<string, number>();
// Cache Blob URLs per attachment to avoid re-fetching when switching
const blobCache = new Map<string, string>();

// Extend attachment type to include DB hash field when available
type Att = Attachment & { blake2b_hash?: string | null };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachments: Att[]; // PDFs only
  startIndex?: number;
};

// Subtle loading glyph
const LoadingGlyph = ({ size = 28 }: { size?: number }) => (
  <div className="flex items-center justify-center p-4">
    <Loader2 size={size} className="text-muted-foreground animate-spin" />
  </div>
);

export const PDFViewerModal = ({ open, onOpenChange, attachments, startIndex = 0 }: Props) => {
  const [index, setIndex] = useState(startIndex);
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [scale, setScale] = useState(1.1);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [probing, setProbing] = useState(false);
  const skipUrlUpdateRef = useRef(false);
  const autoFitDoneRef = useRef(false);
  const programmaticScrollRef = useRef(false);


  const location = useLocation();
  const navigate = useNavigate();

  const current = attachments[index];

  const buildFileUrl = (a: Att) => {
    const hash = a?.blake2b_hash?.toString().trim();
     if (hash) {
       return `https://temporary-openscrapersapi-x6wb2.ondigitalocean.app/public/raw_attachments/${encodeURIComponent(hash)}/raw`;
     }
     return a?.attachment_url!;
   };

   // Pre-fetch PDF and cache Blob URLs per attachment to avoid refetching
   useEffect(() => {
     if (!current) return;
     const url = buildFileUrl(current);
     setLoadErr(null);
     setProbing(true);
     setBlobUrl(null);

     // Use cached Blob URL if available
     const cached = blobCache.get(current.uuid);
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
         const ct = res.headers.get('content-type') || '';
         if (!ct.includes('pdf')) {
           console.warn('Unexpected content-type for PDF:', ct);
         }
         const blob = await res.blob();
         if (aborted) return;
         const objectUrl = URL.createObjectURL(blob);
         blobCache.set(current.uuid, objectUrl);
         setBlobUrl(objectUrl);
       })
       .catch((err) => {
         if (aborted) return;
         setLoadErr(err?.message || 'Failed to fetch PDF');
       })
       .finally(() => {
         if (!aborted) setProbing(false);
       });

     return () => {
       aborted = true;
       // Do not revoke cached object URLs here to preserve caching across switches
     };
   }, [current?.uuid]);
  // Restore remembered page when switching/opening and sync URL atomically
  useEffect(() => {
    if (!current) return;
    skipUrlUpdateRef.current = true;

    const params = new URLSearchParams(location.search);
    const aParam = params.get("a");
    const pParam = parseInt(params.get("p") || "", 10);

    const urlPageValidForCurrent = aParam === current.uuid && Number.isFinite(pParam) && pParam > 0;
    const saved = urlPageValidForCurrent ? pParam : (pageMemory.get(current.uuid) ?? 1);

    pageMemory.set(current.uuid, saved);
    setPage(saved);

    // Ensure URL reflects the current attachment and its restored page
    params.set("a", current.uuid);
    params.set("p", String(saved));
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });

    queueMicrotask(() => { skipUrlUpdateRef.current = false; });
  }, [current?.uuid, open]);

  // Reset auto-fit when switching attachments
  useEffect(() => {
    autoFitDoneRef.current = false;
  }, [current?.uuid]);

  const onDocumentLoadSuccess = async (doc: any) => {
    const { numPages } = doc || {};
    setNumPages(numPages || 0);

    // Compute initial scale to fit page height into viewer
    try {
      if (viewerRef.current && !autoFitDoneRef.current) {
        const firstPage = await doc.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 });
        const available = viewerRef.current.clientHeight || 0;
        if (viewport?.height && available > 0) {
          const nextScale = Math.max(0.5, Math.min(3, available / viewport.height));
          setScale(nextScale);
          autoFitDoneRef.current = true;
        }
      }
    } catch (e) {
      // ignore failures to compute fit
    }

    const desired = pageMemory.get(current.uuid) ?? 1;
    setTimeout(() => scrollToPage(desired), 0);
  };

  const scrollToPage = (p: number) => {
    const target = Math.min(Math.max(p, 1), numPages || 1);
    
    // Update page state immediately for UI responsiveness
    setPage(target);
    pageMemory.set(current.uuid, target);
    
    // Wait for next frame to ensure page state update is reflected
    requestAnimationFrame(() => {
      const el = pageRefs.current[target];
      if (el && viewerRef.current) {
        programmaticScrollRef.current = true;
        
        // Calculate scroll position relative to the viewer container
        const containerRect = viewerRef.current.getBoundingClientRect();
        const elementRect = el.getBoundingClientRect();
        const currentScrollTop = viewerRef.current.scrollTop;
        
        // Calculate the target scroll position to center the page
        const targetScrollTop = currentScrollTop + (elementRect.top - containerRect.top) - 20;
        
        // Scroll instantly to the target page
        viewerRef.current.scrollTo({
          top: targetScrollTop,
          behavior: 'auto' // Instant scroll, no smooth animation
        });
        
        window.setTimeout(() => {
          programmaticScrollRef.current = false;
        }, 100);
      }
    });
  };

  const go = (p: number) => {
    scrollToPage(p);
  };

  // Keyboard handling is scoped to the dialog via onKeyDownCapture to avoid double triggers
  useEffect(() => {
    if (!open || !current || skipUrlUpdateRef.current) return;
    const params = new URLSearchParams(location.search);
    params.set("a", current.uuid);
    params.set("p", String(page));
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  }, [open, current?.uuid, page, location.pathname, location.search]);

  const pagesArr = useMemo(() => Array.from({ length: numPages }, (_, i) => i + 1), [numPages]);

  // Keep current page in view after scale changes
  useEffect(() => {
    if (!viewerRef.current || !current) return;
    programmaticScrollRef.current = true;
    scrollToPage(page);
    const t = window.setTimeout(() => { programmaticScrollRef.current = false; }, 120);
    return () => clearTimeout(t);
  }, [scale]);

  // Update current page based on scroll position
  useEffect(() => {
    const root = viewerRef.current;
    if (!root) return;

    const updateVisiblePage = () => {
      if (programmaticScrollRef.current) return;
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
        if (current) pageMemory.set(current.uuid, best);
      }
    };

    root.addEventListener('scroll', updateVisiblePage, { passive: true } as EventListenerOptions);
    updateVisiblePage();

    return () => {
      root.removeEventListener('scroll', updateVisiblePage as EventListener);
    };
  }, [viewerRef.current, pagesArr, current?.uuid, page, scale]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[1000px] md:max-w-[1100px] max-h-[96vh] md:max-h-[96vh]"
        tabIndex={-1}
        onKeyDownCapture={(e) => {
          if (!open) return;
          if (e.key === 'ArrowRight') { setIndex(i => (i + 1) % attachments.length); e.preventDefault(); }
          if (e.key === 'ArrowLeft')  { setIndex(i => (i - 1 + attachments.length) % attachments.length); e.preventDefault(); }
          if (e.key === 'ArrowDown')  { go(page + 1); e.preventDefault(); }
          if (e.key === 'ArrowUp')    { go(page - 1); e.preventDefault(); }
          if (e.key === 'Escape')     { onOpenChange(false); }
        }}
      >
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="truncate text-base">{current?.attachment_title}</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIndex(i => (i - 1 + attachments.length) % attachments.length)} aria-label="Previous attachment">
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm text-muted-foreground">Doc {index + 1} / {attachments.length}</span>
              <Button variant="outline" size="sm" onClick={() => setIndex(i => (i + 1) % attachments.length)} aria-label="Next attachment">
                <ChevronRight size={16} />
              </Button>
              <div className="mx-3 h-5 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    console.log('Previous page clicked, current page:', page);
                    go(page - 1);
                  }} 
                  disabled={page <= 1} 
                  aria-label="Previous page"
                >
                  <ChevronUp size={16} />
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} / {numPages || 1}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    console.log('Next page clicked, current page:', page);
                    go(page + 1);
                  }} 
                  disabled={page >= numPages} 
                  aria-label="Next page"
                >
                  <ChevronDown size={16} />
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-12 gap-3 h-[calc(96vh-120px)] overflow-hidden" ref={containerRef}>
          <aside className="hidden md:block md:col-span-2 h-full overflow-auto rounded border p-1">
            
            {current && (
              <Document key={current.uuid} file={blobUrl ?? buildFileUrl(current)} loading={<LoadingGlyph size={20} />}>
                {pagesArr.map((p) => (
                  <button
                    key={p}
                    onClick={() => scrollToPage(p)}
                    className={`block w-full rounded border mb-2 overflow-hidden ${p === page ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className="flex justify-center bg-background">
                      <Page pageNumber={p} width={90} renderTextLayer={false} renderAnnotationLayer={false} />
                    </div>
                  </button>
                ))}
              </Document>
            )}
          </aside>

          <main className="col-span-12 md:col-span-10">
            

            <div ref={viewerRef} className="relative group rounded-lg border bg-muted h-full overflow-auto">
              {current && (
                loadErr ? (
                  <div className="p-6 text-sm">
                    <div className="mb-2 font-medium">Failed to load PDF</div>
                    <div className="mb-3 text-muted-foreground">{loadErr}</div>
                    <a
                      href={buildFileUrl(current)}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Open raw file
                    </a>
                  </div>
                ) : (
                  <Document
                    key={current.uuid}
                    file={blobUrl ?? buildFileUrl(current)}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(e) => setLoadErr((e as Error)?.message || 'Failed to load PDF')}
                    onSourceError={(e) => setLoadErr((e as Error)?.message || 'Failed to load PDF')}
                    loading={<LoadingGlyph size={36} />}
                  >
                    {pagesArr.map((p) => (
                      <div
                        key={p}
                        ref={(el) => { pageRefs.current[p] = el; }}
                        data-page={p}
                        className="mb-6 flex justify-center"
                      >
                        <Page pageNumber={p} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
                      </div>
                    ))}
                  </Document>
                )
              )}
              <div className="pointer-events-none absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2 pointer-events-auto">
                  <Button variant="outline" size="sm" onClick={() => setScale(s => Math.max(0.6, s - 0.1))} aria-label="Zoom out">-</Button>
                  <Button variant="outline" size="sm" onClick={() => setScale(s => Math.min(2, s + 0.1))} aria-label="Zoom in">+</Button>
                </div>
              </div>
            </div>

          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
};
