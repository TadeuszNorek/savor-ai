import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PaginationLoadMoreProps {
  hasMore: boolean;
  isLoading: boolean;
  onClick: () => void;
}

/**
 * PaginationLoadMore component - "Load More" button for infinite scroll
 * Shows loading state and disables when no more results
 */
export function PaginationLoadMore({ hasMore, isLoading, onClick }: PaginationLoadMoreProps) {
  if (!hasMore && !isLoading) {
    return null;
  }

  return (
    <div className="flex justify-center py-4">
      <Button variant="outline" onClick={onClick} disabled={isLoading || !hasMore} className="min-w-[200px]">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          "Load more"
        )}
      </Button>
    </div>
  );
}
