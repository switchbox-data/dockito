import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const SEARCH_DELAY = 300;
const sanitizeQuery = (s: string) => s.replace(/[,%]/g, " ").trim();

const useModK = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  return { open, setOpen };
};

export const CommandK = () => {
  const { open, setOpen } = useModK();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ docket_govid: string; docket_title: string | null }>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = sanitizeQuery(query);
    if (!open || q.length < 2) { setResults([]); return; }

    let cancelled = false;
    const timer = setTimeout(() => {
      supabase
        .from("dockets")
        .select("docket_govid,docket_title")
        .or(`docket_govid.ilike.%${q}%,docket_title.ilike.%${q}%`)
        .limit(20)
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) {
            console.error("CommandK search error", error);
            toast({ title: "Search failed", description: "Unable to search right now. Please try again." });
            setResults([]);
            return;
          }
          setResults(data || []);
        });
    }, SEARCH_DELAY);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, open]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a docket number or title… (Cmd/Ctrl + K)" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading={`Dockets${results.length ? ` (${results.length})` : ""}`}>
          {results.map((d) => (
            <CommandItem
              key={d.docket_govid}
              value={`${d.docket_govid} ${d.docket_title ?? ""}`}
              onSelect={() => {
                navigate(`/docket/${d.docket_govid}`);
                setOpen(false);
              }}
              className="flex flex-col items-start gap-1"
            >
              <span className="font-medium">{d.docket_govid}</span>
              <span className="text-muted-foreground text-sm line-clamp-1">{d.docket_title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
