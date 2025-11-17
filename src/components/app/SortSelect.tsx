import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/contexts/I18nContext";
import type { RecipeSortOrder } from "@/types";

interface SortSelectProps {
  value: RecipeSortOrder;
  onChange: (value: RecipeSortOrder) => void;
}

/**
 * SortSelect component for choosing recipe sort order
 * Defaults to "recent" (most recently added)
 */
export function SortSelect({ value, onChange }: SortSelectProps) {
  const { t } = useI18n();

  const SORT_OPTIONS = [
    { value: "recent" as const, label: t('recipeList.sortRecent') },
    { value: "oldest" as const, label: t('recipeList.sortOldest') },
  ];

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm font-medium">
        {t('recipeList.sortBy')}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="sort-select" className="w-[180px]">
          <SelectValue placeholder={t('recipeList.selectSorting')} />
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
