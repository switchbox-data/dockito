import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import React from "react";

export type DateRangeFilterProps = {
  months: Date[];
  range: [number, number] | null;
  onRangeChange: (range: [number, number] | null) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  disabled?: boolean;
};

export function monthsBetween(min: Date, max: Date) {
  const out: Date[] = [];
  let d = startOfMonth(min);
  const end = startOfMonth(max);
  while (d <= end) {
    out.push(d);
    d = addMonths(d, 1);
  }
  return out;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  months,
  range,
  onRangeChange,
  open,
  onOpenChange,
  className,
  disabled,
}) => {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("shrink-0 justify-between hover:border-primary/30", className)}
          disabled={disabled || months.length <= 1}
        >
          <span className="inline-flex items-center gap-2">
            <CalendarIcon size={16} className="text-muted-foreground" />
            Dates
          </span>
          <ChevronDown size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-4 z-50 bg-popover border" align="end">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Select date range</h4>
          <div className="space-y-3">
            {/* Year ticks when crossing year boundaries, or month ticks for shorter ranges */}
            {(() => {
              if (!months.length || months.length <= 1) return null;

              // Calculate year span to determine label frequency
              const years = months.map((m) => m.getFullYear());
              const minYear = Math.min(...years);
              const maxYear = Math.max(...years);
              const yearSpan = maxYear - minYear;

              // Show year labels for longer spans
              if (yearSpan > 1) {
                // Determine interval based on span to avoid overcrowding
                let interval: number;
                if (yearSpan <= 5) interval = 1; // Show every year
                else if (yearSpan <= 15) interval = 2; // Show every 2 years
                else if (yearSpan <= 30) interval = 5; // Show every 5 years
                else interval = 10; // Show every 10 years for very large ranges

                // Find January positions for years that should be labeled
                const labelPositions: { year: number; position: number }[] = [];
                for (let i = 0; i < months.length; i++) {
                  const d = months[i];
                  if (d.getMonth() === 0) {
                    // January
                    const year = d.getFullYear();
                    // Only show if year is on our interval
                    if ((year - minYear) % interval === 0) {
                      labelPositions.push({
                        year,
                        position: (i / (months.length - 1)) * 100,
                      });
                    }
                  }
                }

                if (!labelPositions.length) return null;

                return (
                  <div className="relative h-4 mb-2">
                    {labelPositions.map(({ year, position }) => (
                      <div
                        key={year}
                        className="absolute text-xs text-muted-foreground font-medium"
                        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
                      >
                        {year}
                      </div>
                    ))}
                  </div>
                );
              }

              // Show month labels for shorter ranges (same year or spanning 1-2 years)
              if (months.length >= 1) {
                // Determine how many month labels to show based on range length
                let interval: number;
                if (months.length <= 3) interval = 1; // Every month for 1-3 months
                else if (months.length <= 6) interval = 1; // Every month for 4-6 months
                else if (months.length <= 12) interval = 2; // Every 2 months for 7-12 months
                else if (months.length <= 24) interval = 3; // Every 3 months for 13-24 months
                else interval = 6; // Every 6 months for longer ranges

                const labelPositions: { month: string; position: number }[] = [];
                for (let i = 0; i < months.length; i += interval) {
                  const date = months[i];
                  labelPositions.push({
                    month: format(date, "MMM"),
                    position: (i / (months.length - 1)) * 100,
                  });
                }

                // Always include the last month if it's not already included
                const lastIndex = months.length - 1;
                const lastIncluded = labelPositions.some(pos => pos.position === 100);
                if (!lastIncluded && labelPositions.length > 0) {
                  labelPositions.push({
                    month: format(months[lastIndex], "MMM"),
                    position: 100,
                  });
                }

                return (
                  <div className="relative h-4 mb-2">
                    {labelPositions.map(({ month, position }, idx) => (
                      <div
                        key={`${month}-${idx}`}
                        className="absolute text-xs text-muted-foreground"
                        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
                      >
                        {month}
                      </div>
                    ))}
                  </div>
                );
              }

              return null;
            })()}

            <div className="space-y-3">
              <Slider
                value={range ?? [0, Math.max(0, (months.length || 1) - 1)]}
                min={0}
                max={Math.max(0, (months.length || 1) - 1)}
                step={1}
                onValueChange={(v) => onRangeChange([v[0], v[1]] as [number, number])}
              />
            </div>

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {months.length && range ? format(months[range[0]], "MMM yyyy") : "Start"}
              </span>
              <span>
                {months.length && range ? format(months[range[1]], "MMM yyyy") : "End"}
              </span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
