import { forwardRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { DietType } from "../../types";

const DIET_TYPES: { value: DietType; label: string }[] = [
  { value: "vegan", label: "Vegan" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "gluten_free", label: "Gluten Free" },
  { value: "dairy_free", label: "Dairy Free" },
  { value: "low_carb", label: "Low Carb" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "omnivore", label: "Omnivore" },
];

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
 *
 * @component
 */
export const DietTypeSelect = forwardRef<HTMLButtonElement, DietTypeSelectProps>(
  ({ value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }, ref) => {
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
          <SelectValue placeholder="Select a diet type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {DIET_TYPES.map((diet) => (
            <SelectItem key={diet.value} value={diet.value}>
              {diet.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);

DietTypeSelect.displayName = "DietTypeSelect";
