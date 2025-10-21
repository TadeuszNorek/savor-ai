import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TagFilterChipsProps {
  selected: string[];
  allTags: string[];
  onChange: (tags: string[]) => void;
}

/**
 * TagFilterChips component for OR-based tag filtering
 * Displays available tags as toggleable chips
 * Shows clear button when filters are active
 */
export function TagFilterChips({ selected, allTags, onChange }: TagFilterChipsProps) {
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Tag filters:</label>
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
        {allTags.map((tag) => {
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
      {hasSelectedTags && (
        <div className="text-xs text-muted-foreground" aria-live="polite">
          {selected.length} {selected.length === 1 ? "tag" : "tags"} selected
        </div>
      )}
    </div>
  );
}
