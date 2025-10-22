import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface RecipeListSkeletonProps {
  count?: number;
}

/**
 * RecipeListSkeleton component - loading state for recipe list
 * Shows skeleton cards matching the RecipeCard layout
 */
export function RecipeListSkeleton({ count = 3 }: RecipeListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="p-4">
          <div className="space-y-2">
            {/* Title */}
            <Skeleton className="h-6 w-3/4" />

            {/* Summary */}
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />

            {/* Tags */}
            <div className="flex gap-1 pt-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-12" />
            </div>

            {/* Date */}
            <Skeleton className="h-3 w-32 mt-2" />
          </div>
        </Card>
      ))}
      <div className="sr-only" aria-live="polite">
        Loading recipes...
      </div>
    </div>
  );
}
