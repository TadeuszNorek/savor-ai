import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronDown, ChevronUp } from "lucide-react";

interface TagFilterChipsProps {
  selected: string[];
  allTags: string[];
  onChange: (tags: string[]) => void;
}

const INITIAL_TAGS_LIMIT = 12;

/**
 * TagFilterChips component for OR-based tag filtering
 * Displays available tags as toggleable chips
 * Shows clear button when filters are active
 * Collapses to show only first 12 tags with "Show more" button
 */
export function TagFilterChips({ selected, allTags, onChange }: TagFilterChipsProps) {
  const [showAllTags, setShowAllTags] = useState(false);

  const handleToggle = (tag: string) => {
    const normalized = tag.toLowerCase();
    const isSelected = selected.includes(normalized);

    if (isSelected) {
      onChange(selected.filter((t) => t !== normalized));
    } else {
      onChange([...selected, normalized]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  if (allTags.length === 0) {
    return null;
  }

  const hasSelectedTags = selected.length > 0;
  const hasMoreTags = allTags.length > INITIAL_TAGS_LIMIT;

  // Ensure selected tags are always visible
  // Show first N tags + any selected tags not in first N
  const visibleTags = showAllTags
    ? allTags
    : (() => {
        const initialTags = allTags.slice(0, INITIAL_TAGS_LIMIT);
        const selectedNotInInitial = allTags
          .slice(INITIAL_TAGS_LIMIT)
          .filter((tag) => selected.includes(tag.toLowerCase()));

        // Combine and deduplicate
        const combined = [...initialTags, ...selectedNotInInitial];
        return Array.from(new Set(combined));
      })();

  const hiddenCount = allTags.length - INITIAL_TAGS_LIMIT;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Tag filters:</span>
        {hasSelectedTags && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-auto py-1 px-2 text-xs"
            aria-label="Clear all filters"
          >
            Clear filters
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Tag filters">
        {visibleTags.map((tag) => {
          const normalized = tag.toLowerCase();
          const isSelected = selected.includes(normalized);

          return (
            <Button
              key={normalized}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggle(tag)}
              role="checkbox"
              aria-checked={isSelected}
              className="h-auto py-1 px-3"
            >
              {tag}
              {isSelected && <X className="ml-1 h-3 w-3" />}
            </Button>
          );
        })}
      </div>

      {/* Show more/less button */}
      {hasMoreTags && (
        <div className="flex justify-center pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllTags(!showAllTags)}
            className="h-auto py-1 px-3 text-xs text-muted-foreground hover:text-foreground"
          >
            {showAllTags ? (
              <>
                <ChevronUp className="mr-1 h-3 w-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-3 w-3" />
                Show more ({hiddenCount} more)
              </>
            )}
          </Button>
        </div>
      )}

      {hasSelectedTags && (
        <div className="text-xs text-muted-foreground" aria-live="polite">
          {selected.length} {selected.length === 1 ? "tag" : "tags"} selected
        </div>
      )}
    </div>
  );
}
