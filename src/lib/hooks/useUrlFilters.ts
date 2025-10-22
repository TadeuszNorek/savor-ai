import { useState, useEffect, useCallback } from "react";
import type { ListFiltersVM, RecipeSortOrder } from "@/types";

/**
 * Default filter values
 */
const DEFAULT_FILTERS: ListFiltersVM = {
  search: "",
  tags: [],
  sort: "recent",
  limit: 20,
  offset: 0,
};

/**
 * Parse URL search params into ListFiltersVM
 */
function parseFiltersFromUrl(searchParams: URLSearchParams): ListFiltersVM {
  const filters: ListFiltersVM = { ...DEFAULT_FILTERS };

  // Parse search
  const search = searchParams.get("search");
  if (search) {
    filters.search = search;
  }

  // Parse tags (comma-separated)
  const tags = searchParams.get("tags");
  if (tags) {
    filters.tags = tags.split(",").filter((t) => t.trim().length > 0);
  }

  // Parse sort
  const sort = searchParams.get("sort") as RecipeSortOrder | null;
  if (sort === "recent" || sort === "oldest") {
    filters.sort = sort;
  }

  // Parse limit
  const limit = searchParams.get("limit");
  if (limit) {
    const parsed = parseInt(limit, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) {
      filters.limit = parsed;
    }
  }

  // Parse offset
  const offset = searchParams.get("offset");
  if (offset) {
    const parsed = parseInt(offset, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      filters.offset = parsed;
    }
  }

  return filters;
}

/**
 * Convert ListFiltersVM to URLSearchParams
 */
function filtersToSearchParams(filters: ListFiltersVM): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search && filters.search.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.tags.length > 0) {
    params.set("tags", filters.tags.join(","));
  }

  if (filters.sort && filters.sort !== "recent") {
    params.set("sort", filters.sort);
  }

  if (filters.limit && filters.limit !== 20) {
    params.set("limit", filters.limit.toString());
  }

  if (filters.offset && filters.offset > 0) {
    params.set("offset", filters.offset.toString());
  }

  return params;
}

/**
 * Custom hook for managing recipe list filters in URL
 * Synchronizes filter state with URL search params
 * Supports browser back/forward navigation
 */
export function useUrlFilters() {
  // Initialize from URL
  const [filters, setFiltersState] = useState<ListFiltersVM>(() => {
    if (typeof window === "undefined") return DEFAULT_FILTERS;
    const params = new URLSearchParams(window.location.search);
    return parseFiltersFromUrl(params);
  });

  // Update URL when filters change
  const updateUrl = useCallback((newFilters: ListFiltersVM) => {
    const params = filtersToSearchParams(newFilters);
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.pushState({}, "", newUrl);
  }, []);

  // Set filters and update URL
  const setFilters = useCallback(
    (updater: ListFiltersVM | ((prev: ListFiltersVM) => ListFiltersVM)) => {
      setFiltersState((prev) => {
        const newFilters = typeof updater === "function" ? updater(prev) : updater;
        updateUrl(newFilters);
        return newFilters;
      });
    },
    [updateUrl]
  );

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const newFilters = parseFiltersFromUrl(params);
      setFiltersState(newFilters);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return { filters, setFilters };
}
