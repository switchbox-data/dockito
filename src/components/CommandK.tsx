import { useEffect, useState, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FolderOpen, Building, Home } from "lucide-react";
import KeyboardShortcut from "@/components/KeyboardShortcut";

// Create a context for Command K
const CommandKContext = createContext<{
  open: () => void;
} | null>(null);

export const useCommandK = () => {
  const context = useContext(CommandKContext);
  if (!context) {
    throw new Error("useCommandK must be used within a CommandKProvider");
  }
  return context;
};

export const CommandKProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  
  const openCommandK = () => setOpen(true);
  
  return (
    <CommandKContext.Provider value={{ open: openCommandK }}>
      {children}
      <CommandKInner open={open} setOpen={setOpen} />
    </CommandKContext.Provider>
  );
};

const SEARCH_DELAY = 300;
const sanitizeQuery = (s: string) => s.replace(/[,%]/g, " ").trim();

const useModK = (open: boolean, setOpen: (open: boolean) => void) => {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);
};

const CommandKInner = ({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {
  const [query, setQuery] = useState("");
  const [docketResults, setDocketResults] = useState<Array<{ docket_govid: string; docket_title: string | null }>>([]);
  const [orgResults, setOrgResults] = useState<Array<{ name: string; description: string | null }>>([]);
  const navigate = useNavigate();
  useModK(open, setOpen);

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
          .limit(5);

        // Search organizations
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("name,description")
          .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
          .limit(5);

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
      <div className="flex items-center border-b px-4 py-2" cmdk-input-wrapper="">
        <Search className="mr-3 h-5 w-5 shrink-0 opacity-50" />
        <CommandPrimitive.Input
          placeholder="Type a docket number, title, or organization..." 
          value={query} 
          onValueChange={setQuery}
          className="flex h-12 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
        <KeyboardShortcut keys={["mod", "k"]} className="ml-auto mr-8 opacity-60 shrink-0" />
      </div>
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Commands">
          <CommandItem
            onSelect={() => {
              navigate('/');
              setOpen(false);
            }}
          >
            <Home className="mr-2 h-4 w-4" />
            <span className="text-base font-normal">View Home</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              // Use saved sort preferences when navigating to dockets
              const getSavedSort = () => {
                try {
                  const saved = localStorage.getItem('dockets-sort');
                  if (saved) {
                    const { sortBy, sortDir } = JSON.parse(saved);
                    return { sortBy, sortDir };
                  }
                } catch (e) {
                  // Ignore localStorage errors
                }
                return { sortBy: 'date', sortDir: 'desc' };
              };
              
              const saved = getSavedSort();
              const targetUrl = `/dockets?sortBy=${saved.sortBy}&sortDir=${saved.sortDir}`;
              
              navigate(targetUrl);
              setOpen(false);
            }}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            <span className="text-base font-normal">View Dockets</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              navigate('/orgs');
              setOpen(false);
            }}
          >
            <Building className="mr-2 h-4 w-4" />
            <span className="text-base font-normal">View Organizations</span>
          </CommandItem>
        </CommandGroup>
        {orgResults.length > 0 && (
          <CommandGroup heading={`Organizations (${orgResults.length})`}>
            {orgResults.map((org) => (
              <CommandItem
                key={org.name}
                value={`${org.name} ${org.description ?? ""}`}
                onSelect={() => {
                  navigate(`/org/${encodeURIComponent(org.name)}`);
                  setOpen(false);
                }}
                className="flex items-start gap-3"
              >
                <Building className="mr-0 h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="flex flex-col items-start gap-1 min-w-0">
                  <span className="text-base font-normal">{org.name}</span>
                  <span className="text-muted-foreground text-sm line-clamp-1">{org.description}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {docketResults.length > 0 && (
          <CommandGroup heading={`Dockets (${docketResults.length})`}>
            {docketResults.map((d) => (
              <CommandItem
                key={d.docket_govid}
                value={`${d.docket_govid} ${d.docket_title ?? ""}`}
                onSelect={() => {
                  navigate(`/docket/${d.docket_govid}`);
                  setOpen(false);
                }}
                className="flex items-start gap-3"
              >
                <FolderOpen className="mr-0 h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="flex flex-col items-start gap-1 min-w-0">
                  <span className="text-base font-normal">{d.docket_govid}</span>
                  <span className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">{d.docket_title}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
      
      {/* Keyboard shortcuts footer */}
      <div className="border-t bg-muted/30 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <KeyboardShortcut keys={["↑", "↓"]} className="scale-75" />
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <KeyboardShortcut keys={["↵"]} className="scale-75" />
              <span>Select</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <KeyboardShortcut keys={["esc"]} className="scale-75" />
            <span>Close</span>
          </div>
        </div>
      </div>
    </CommandDialog>
  );
};