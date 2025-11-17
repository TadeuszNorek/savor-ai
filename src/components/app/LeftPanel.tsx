import { useMemo, useCallback } from "react";
import { ChevronLeft, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SearchBar } from "./SearchBar";
import { TagFilterChips } from "./TagFilterChips";
import { SortSelect } from "./SortSelect";
import { RecipeList } from "./RecipeList";
import { EmptyState } from "./EmptyState";
import { ErrorPanel } from "./ErrorPanel";
import { RecipeListSkeleton } from "./RecipeListSkeleton";
import { useRecipesList } from "@/lib/api/recipes";
import { useUrlFilters } from "@/lib/hooks/useUrlFilters";
import { useScrollRestoration } from "@/lib/hooks/useScrollRestoration";
import { useI18n } from "@/lib/contexts/I18nContext";

interface LeftPanelProps {
  selectedId?: string;
  onSelect: (id: string) => void;
  onGenerateClick?: () => void;
  onToggleCollapse?: () => void;
}

/**
 * LeftPanel component - recipe list with search, filters, and sorting
 * Integrates all sub-components and manages filter state
 * Supports collapsing for full-screen generator/preview mode
 */
export function LeftPanel({ selectedId, onSelect, onGenerateClick, onToggleCollapse }: LeftPanelProps) {
  const { t } = useI18n();

  // Filter state synced with URL
  const { filters, setFilters } = useUrlFilters();

  // Scroll restoration for recipe list
  const scrollContainerRef = useScrollRestoration<HTMLDivElement>(
    typeof window !== "undefined" ? window.location.search : ""
  );

  // Fetch recipes with current filters
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useRecipesList({
    search: filters.search || undefined,
    tags: filters.tags.length > 0 ? filters.tags.join(",") : undefined,
    sort: filters.sort,
    limit: filters.limit,
  });

  // Aggregate all unique tags from results
  const allTags = useMemo(() => {
    if (!data?.pages) return [];

    const tagSet = new Set<string>();
    data.pages.forEach((page) => {
      page.data.forEach((recipe) => {
        recipe.tags?.forEach((tag) => tagSet.add(tag));
      });
    });

    return Array.from(tagSet).sort();
  }, [data]);

  // Filter handlers
  const handleSearchChange = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, offset: 0 }));
  }, []);

  const handleSearchSubmit = useCallback(() => {
    // Trigger refetch on submit
    refetch();
  }, [refetch]);

  const handleTagsChange = useCallback((tags: string[]) => {
    setFilters((prev) => ({ ...prev, tags, offset: 0 }));
  }, []);

  const handleSortChange = useCallback((sort: "recent" | "oldest") => {
    setFilters((prev) => ({ ...prev, sort, offset: 0 }));
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const pages = data?.pages || [];
  const totalRecipes = pages.reduce((acc, page) => acc + page.data.length, 0);
  const hasFilters = filters.search || filters.tags.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header with title and collapse button */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">{t('recipeList.yourRecipes')}</h2>
        {onToggleCollapse && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onToggleCollapse}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mr-2"
                  aria-label={t('recipeList.hideRecipeList')}
                >
                  {/* Desktop icon */}
                  <ChevronLeft className="h-4 w-4 hidden lg:block" />
                  {/* Mobile icon */}
                  <ChevronUp className="h-4 w-4 lg:hidden" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="hidden lg:block">
                <p>{t('recipeList.hideRecipeList')}</p>
                <p className="text-xs text-muted-foreground">Ctrl+B</p>
              </TooltipContent>
              <TooltipContent side="bottom" className="lg:hidden">
                <p>{t('recipeList.hideRecipeList')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Filters Section */}
      <div className="space-y-3 p-4 lg:pb-4 max-lg:pb-3 border-b">
        <SearchBar value={filters.search || ""} onChange={handleSearchChange} onSubmit={handleSearchSubmit} />

        <TagFilterChips selected={filters.tags} allTags={allTags} onChange={handleTagsChange} />

        <SortSelect value={filters.sort} onChange={handleSortChange} />
      </div>

      {/* Results Section */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 max-lg:p-3 min-h-0">
        {isLoading ? (
          <RecipeListSkeleton count={3} />
        ) : isError ? (
          <ErrorPanel error={error as Error} onRetry={handleRetry} />
        ) : totalRecipes === 0 ? (
          <EmptyState
            message={hasFilters ? t('recipeList.emptyStateNoResults') : t('recipeList.emptyStateTitle')}
            onCta={!hasFilters ? onGenerateClick : undefined}
          />
        ) : (
          <RecipeList
            pages={pages}
            isLoading={isLoading}
            isError={isError}
            selectedId={selectedId}
            onSelect={onSelect}
            onLoadMore={handleLoadMore}
            hasNextPage={hasNextPage || false}
            isFetchingNextPage={isFetchingNextPage}
          />
        )}
      </div>
    </div>
  );
}
