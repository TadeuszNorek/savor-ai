import { forwardRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useI18n } from "../../lib/contexts/I18nContext";
import type { DietType } from "../../types";

interface DietTypeSelectProps {
  /** Current selected diet type (null = none) */
  value: DietType | null;
  /** Change handler - receives DietType or null */
  onChange: (value: DietType | null) => void;
  /** ARIA invalid state for accessibility */
  "aria-invalid"?: boolean;
  /** ARIA describedby ID for error/helper text */
  "aria-describedby"?: string;
}

/**
 * DietTypeSelect Component
 *
 * Select dropdown for choosing dietary preference type.
 * Includes all DietType enum values plus a "None" option to clear.
 *
 * Features:
 * - All diet types from enum (vegan, vegetarian, etc.)
 * - "None" option to clear selection (sets null)
 * - Full ARIA support
 * - Keyboard navigation support
 * - Translated labels based on current language
 *
 * @component
 */
export const DietTypeSelect = forwardRef<HTMLButtonElement, DietTypeSelectProps>(
  ({ value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }, ref) => {
    const { t } = useI18n();

    const DIET_TYPES: { value: DietType; labelKey: string }[] = [
      { value: "vegan", labelKey: "dietTypes.vegan" },
      { value: "vegetarian", labelKey: "dietTypes.vegetarian" },
      { value: "pescatarian", labelKey: "dietTypes.pescatarian" },
      { value: "keto", labelKey: "dietTypes.keto" },
      { value: "paleo", labelKey: "dietTypes.paleo" },
      { value: "gluten_free", labelKey: "dietTypes.glutenFree" },
      { value: "dairy_free", labelKey: "dietTypes.dairyFree" },
      { value: "low_carb", labelKey: "dietTypes.lowCarb" },
      { value: "mediterranean", labelKey: "dietTypes.mediterranean" },
      { value: "omnivore", labelKey: "dietTypes.omnivore" },
    ];

    const handleValueChange = (newValue: string) => {
      if (newValue === "none") {
        onChange(null);
      } else {
        onChange(newValue as DietType);
      }
    };

    return (
      <Select value={value || "none"} onValueChange={handleValueChange}>
        <SelectTrigger
          id="dietType"
          className="w-full"
          ref={ref}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
        >
          <SelectValue placeholder={t('dietTypes.selectPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t('dietTypes.none')}</SelectItem>
          {DIET_TYPES.map((diet) => (
            <SelectItem key={diet.value} value={diet.value}>
              {t(diet.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);

DietTypeSelect.displayName = "DietTypeSelect";
