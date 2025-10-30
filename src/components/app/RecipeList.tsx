import { RecipeCard } from "./RecipeCard";
import { PaginationLoadMore } from "./PaginationLoadMore";
import type { RecipeListResponse } from "@/types";

interface RecipeListProps {
  pages: RecipeListResponse[];
  isLoading: boolean;
  isError: boolean;
  selectedId?: string;
  onSelect: (id: string) => void;
  onLoadMore: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

/**
 * RecipeList component - displays paginated list of recipe cards
 * Supports infinite scroll with "Load More" button
 * Shows loading skeletons and error states
 */
export function RecipeList({
  pages,
  isLoading,
  isError,
  selectedId,
  onSelect,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
}: RecipeListProps) {
  // Flatten all pages into single array
  const allRecipes = pages.flatMap((page) => page.data);

  if (isError) {
    return null; // Error handled by ErrorPanel in parent
  }

  if (isLoading) {
    return null; // Loading handled by Skeleton in parent
  }

  if (allRecipes.length === 0) {
    return null; // Empty state handled by EmptyState in parent
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {allRecipes.map((recipe) => (
          <li key={recipe.id}>
            <RecipeCard item={recipe} selected={selectedId === recipe.id} onClick={() => onSelect(recipe.id)} />
          </li>
        ))}
      </ul>

      <PaginationLoadMore hasMore={hasNextPage} isLoading={isFetchingNextPage} onClick={onLoadMore} />

      {/* Announce results count for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Found {allRecipes.length} {allRecipes.length === 1 ? "recipe" : "recipes"}
      </div>
    </div>
  );
}
