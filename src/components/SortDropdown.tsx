import { ArrowUpDown, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

type SortOption = {
  value: string;
  label: string;
  sortBy: string;
  sortDir: "asc" | "desc";
};

type SortGroup = {
  heading: string;
  options: SortOption[];
};

interface SortDropdownProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentSortBy: string;
  currentSortDir: "asc" | "desc";
  onSortChange: (sortBy: string, sortDir: "asc" | "desc") => void;
  groups: SortGroup[];
  buttonMinWidth?: string;
}

export const SortDropdown = ({
  isOpen,
  onOpenChange,
  currentSortBy,
  currentSortDir,
  onSortChange,
  groups,
  buttonMinWidth = "min-w-[120px]"
}: SortDropdownProps) => {
  // Find the current option to display in the button
  const currentOption = groups
    .flatMap(group => group.options)
    .find(option => option.sortBy === currentSortBy && option.sortDir === currentSortDir);

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "border-gray-300 hover:border-gray-400 bg-white hover:bg-muted/50 justify-between",
            buttonMinWidth
          )}
        >
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            <span>
              {currentOption?.label || "Select sort"}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0 bg-white border border-gray-300 shadow-lg z-50" align="end">
        <Command>
          <CommandList>
            {groups.map((group, groupIndex) => (
              <CommandGroup key={groupIndex} heading={group.heading}>
                {group.options.map((option, optionIndex) => (
                  <CommandItem
                    key={optionIndex}
                    onSelect={() => {
                      onSortChange(option.sortBy, option.sortDir);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "cursor-pointer hover:bg-muted/90",
                      currentSortBy === option.sortBy && currentSortDir === option.sortDir && "bg-muted text-primary font-medium"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {currentSortBy === option.sortBy && currentSortDir === option.sortDir && <Check className="h-4 w-4" />}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};