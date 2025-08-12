import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Attachment } from "@/data/mock";
import { Document, Page, pdfjs } from "react-pdf";

// Configure PDF.js worker (Vite + pdfjs-dist v3 to match react-pdf)
// Align API and Worker versions to avoid "API version does not match Worker version" errors.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

// Persist page position per attachment
const pageMemory = new Map<string, number>();

// Extend attachment type to include DB hash field when available
type Att = Attachment & { blake2b_hash?: string | null };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachments: Att[]; // PDFs only
  startIndex?: number;
};

export const PDFViewerModal = ({ open, onOpenChange, attachments, startIndex = 0 }: Props) => {
  const [index, setIndex] = useState(startIndex);
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [scale, setScale] = useState(1.1);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [probing, setProbing] = useState(false);

  const current = attachments[index];

  const buildFileUrl = (a: Att) => {
    const hash = a?.blake2b_hash?.toString().trim();
     if (hash) {
       return `https://temporary-openscrapersapi-x6wb2.ondigitalocean.app/public/raw_attachments/${encodeURIComponent(hash)}/raw`;
     }
     return a?.attachment_url!;
   };

   // Pre-fetch PDF to verify reachability and optionally use a Blob URL
   useEffect(() => {
     if (!current) return;
     const url = buildFileUrl(current);
     setLoadErr(null);
     setBlobUrl(null);
     setProbing(true);

     let aborted = false;
     let objectUrl: string | null = null;

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
         objectUrl = URL.createObjectURL(blob);
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
       if (objectUrl) URL.revokeObjectURL(objectUrl);
     };
   }, [current?.uuid]);
  // Restore remembered page when switching/opening
  useEffect(() => {
    if (!current) return;
    const saved = pageMemory.get(current.uuid) ?? 1;
    setPage(saved);
  }, [current?.uuid, open]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const go = (p: number) => {
    const next = Math.min(Math.max(p, 1), numPages || 1);
    pageMemory.set(current.uuid, next);
    setPage(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowRight') go(page + 1);
      if (e.key === 'ArrowLeft') go(page - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, page, numPages]);

  const pagesArr = useMemo(() => Array.from({ length: numPages }, (_, i) => i + 1), [numPages]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] md:max-w-[1100px]">
        <DialogHeader>
          <DialogTitle className="text-base">{current?.attachment_title}</DialogTitle>
          <DialogDescription className="sr-only">PDF preview with zoom, page navigation, and keyboard arrows.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-12 gap-3" ref={containerRef}>
          <aside className="col-span-3 hidden md:block max-h-[70vh] overflow-auto rounded border p-2">
            <div className="mb-2 text-xs text-muted-foreground">Pages</div>
            {pagesArr.map((p) => (
              <button key={p} onClick={() => go(p)} className={`block w-full rounded border mb-2 overflow-hidden ${p === page ? 'ring-2 ring-primary' : ''}`}>
                <div className="bg-muted/40 text-xs px-2 py-1 text-left">Page {p}</div>
                {/* Thumbnails */}
                <div className="flex justify-center bg-background">
                  {current && (
                    <Document file={buildFileUrl(current)} loading={<div className='text-xs p-4'>Loading…</div>}>
                      <Page pageNumber={p} width={140} renderTextLayer={false} renderAnnotationLayer={false} />
                    </Document>
                  )}
                </div>
              </button>
            ))}
          </aside>

          <main className="col-span-12 md:col-span-9">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setScale(s => Math.max(0.6, s - 0.1))}>-</Button>
                <span className="text-sm w-14 text-center">{Math.round(scale * 100)}%</span>
                <Button variant="outline" size="sm" onClick={() => setScale(s => Math.min(2, s + 0.1))}>+</Button>
              </div>
              <div className="text-sm text-muted-foreground">{page} / {numPages || 1}</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0}>
                  <ChevronLeft size={16} /> Prev
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIndex(i => Math.min(attachments.length - 1, i + 1))} disabled={index === attachments.length - 1}>
                  Next <ChevronRight size={16} />
                </Button>
              </div>
            </div>

            <div className="rounded-lg border bg-background max-h-[70vh] overflow-auto flex items-start justify-center">
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
                    file={blobUrl ?? buildFileUrl(current)}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(e) => setLoadErr((e as Error)?.message || 'Failed to load PDF')}
                    onSourceError={(e) => setLoadErr((e as Error)?.message || 'Failed to load PDF')}
                    loading={<div className='p-8 text-sm'>Loading PDF…</div>}
                  >
                    <Page pageNumber={page} scale={scale} renderTextLayer={true} renderAnnotationLayer={true} />
                  </Document>
                )
              )}
            </div>

            <div className="mt-2 flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => go(page - 1)} disabled={page <= 1}><ChevronLeft size={16} /> Page</Button>
                <Button variant="outline" size="sm" onClick={() => go(page + 1)} disabled={page >= numPages}>Page <ChevronRight size={16} /></Button>
              </div>
              <div className="flex items-center gap-2">
                <Search size={16} className="text-muted-foreground" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find in document (visual only)" className="text-sm bg-background border rounded px-2 py-1 w-56" />
              </div>
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
};
