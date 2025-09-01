import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FolderOpen, Building2 } from "lucide-react";

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
  const [docketResults, setDocketResults] = useState<Array<{ docket_govid: string; docket_title: string | null }>>([]);
  const [orgResults, setOrgResults] = useState<Array<{ name: string; description: string | null }>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = sanitizeQuery(query);
    if (!open || q.length < 2) { 
      setDocketResults([]);
      setOrgResults([]);
      return; 
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        // Search dockets
        const { data: docketData, error: docketError } = await supabase
          .from("dockets")
          .select("docket_govid,docket_title")
          .or(`docket_govid.ilike.%${q}%,docket_title.ilike.%${q}%`)
          .limit(10);

        // Search organizations
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("name,description")
          .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
          .limit(10);

        if (cancelled) return;

        if (docketError) {
          console.error("CommandK docket search error", docketError);
          toast({ title: "Search failed", description: "Unable to search dockets. Please try again." });
          setDocketResults([]);
        } else {
          setDocketResults(docketData || []);
        }

        if (orgError) {
          console.error("CommandK org search error", orgError);
          toast({ title: "Search failed", description: "Unable to search organizations. Please try again." });
          setOrgResults([]);
        } else {
          setOrgResults(orgData || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("CommandK search error", error);
          toast({ title: "Search failed", description: "Unable to search right now. Please try again." });
          setDocketResults([]);
          setOrgResults([]);
        }
      }
    }, SEARCH_DELAY);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, open]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a docket number, title, or organization… (Cmd/Ctrl + K)" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Commands">
          <CommandItem
            onSelect={() => {
              navigate('/dockets');
              setOpen(false);
            }}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            <span>View Dockets</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              navigate('/orgs');
              setOpen(false);
            }}
          >
            <Building2 className="mr-2 h-4 w-4" />
            <span>View Organizations</span>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading={`Dockets${docketResults.length ? ` (${docketResults.length})` : ""}`}>
          {docketResults.map((d) => (
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
        <CommandGroup heading={`Organizations${orgResults.length ? ` (${orgResults.length})` : ""}`}>
          {orgResults.map((org) => (
            <CommandItem
              key={org.name}
              value={`${org.name} ${org.description ?? ""}`}
              onSelect={() => {
                navigate(`/org/${encodeURIComponent(org.name)}`);
                setOpen(false);
              }}
              className="flex flex-col items-start gap-1"
            >
              <span className="font-medium">{org.name}</span>
              <span className="text-muted-foreground text-sm line-clamp-1">{org.description}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
