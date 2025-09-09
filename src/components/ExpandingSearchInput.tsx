import { forwardRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ExpandingSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  containerRef?: React.RefObject<HTMLElement>;
}

export const ExpandingSearchInput = forwardRef<HTMLInputElement, ExpandingSearchInputProps>(
  ({ value, onChange, placeholder, onKeyDown, className, containerRef }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        (e.currentTarget as HTMLInputElement).blur();
        containerRef?.current?.focus();
      }
      onKeyDown?.(e);
    };

    return (
      <Input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "transition-all duration-300 ease-in-out border-gray-300 hover:border-gray-300 bg-white hover:bg-white",
          isFocused 
            ? "w-[min(40rem,75%)] min-w-[8rem] flex-shrink-0" 
            : "w-[10rem] md:w-[16rem] min-w-[8rem] flex-shrink",
          className
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
      />
    );
  }
);

ExpandingSearchInput.displayName = "ExpandingSearchInput";