import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useState } from "react";

import { MOCK_DOCKETS } from "@/data/mock";

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
  const navigate = useNavigate();

  const results = MOCK_DOCKETS.filter(d =>
    [d.docket_govid, d.docket_title].some((f) => f?.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 20);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a docket number or title… (Cmd/Ctrl + K)" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Dockets">
          {results.map((d) => (
            <CommandItem
              key={d.docket_govid}
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
