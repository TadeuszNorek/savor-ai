import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RecipeSortOrder } from "@/types";

interface SortSelectProps {
  value: RecipeSortOrder;
  onChange: (value: RecipeSortOrder) => void;
}

const SORT_OPTIONS = [
  { value: "recent" as const, label: "Recently added" },
  { value: "oldest" as const, label: "Oldest first" },
];

/**
 * SortSelect component for choosing recipe sort order
 * Defaults to "recent" (most recently added)
 */
export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm font-medium">
        Sort by:
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="sort-select" className="w-[180px]">
          <SelectValue placeholder="Select sorting" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
