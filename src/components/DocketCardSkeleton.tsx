import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const DocketCardSkeleton = () => {
  return (
    <Card className="transition-colors animate-pulse bg-white/95">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Skeleton className="h-5 w-5 rounded" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-full max-w-md" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};