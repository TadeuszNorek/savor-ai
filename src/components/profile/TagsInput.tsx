import { useState, forwardRef } from "react";
import type { KeyboardEvent } from "react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { X } from "lucide-react";

interface TagsInputProps {
  /** Field name - used for ID and ARIA labels */
  name: "dislikedIngredients" | "preferredCuisines";
  /** Current tag values (normalized strings) */
  value: string[];
  /** Change handler - receives normalized array */
  onChange: (value: string[]) => void;
  /** Input placeholder text */
  placeholder?: string;
  /** ARIA invalid state for accessibility */
  "aria-invalid"?: boolean;
  /** ARIA describedby ID for error/helper text */
  "aria-describedby"?: string;
}

/**
 * TagsInput Component
 *
 * Input field for managing string arrays as tags/chips.
 * Supports keyboard navigation and auto-normalization.
 *
 * Features:
 * - Add tags with Enter or comma
 * - Remove tags with X button or Backspace on empty input
 * - Auto-normalization (lowercase, trim, dedupe)
 * - Max 100 items, max 50 chars per item
 * - Live counter display
 * - Full ARIA support
 *
 * @component
 */
export const TagsInput = forwardRef<HTMLInputElement, TagsInputProps>(
  ({ name, value, onChange, placeholder, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }, ref) => {
    const [inputValue, setInputValue] = useState("");

    // Add a new tag
    const addTag = (tag: string) => {
      const trimmed = tag.trim();
      if (trimmed.length === 0) return;
      if (trimmed.length > 50) return; // Max length validation

      // Check if tag already exists (case-insensitive)
      const normalized = trimmed.toLowerCase();
      if (value.some((existing) => existing.toLowerCase() === normalized)) {
        setInputValue(""); // Clear input but don't add duplicate
        return;
      }

      // Add the tag
      onChange([...value, normalized]);
      setInputValue("");
    };

    // Remove a tag by index
    const removeTag = (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    };

    // Handle keyboard events
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(inputValue);
      } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
        // Remove last tag when backspace is pressed on empty input
        removeTag(value.length - 1);
      }
    };

    // Handle blur (add tag when user leaves input)
    const handleBlur = () => {
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    };

    const maxReached = value.length >= 100;

    return (
      <div className="space-y-2">
        {/* Input field */}
        <Input
          id={name}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={maxReached ? "Maximum limit reached" : placeholder}
          disabled={maxReached}
          className="w-full"
          ref={ref}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          role="textbox"
          aria-label={`Add ${name === "dislikedIngredients" ? "disliked ingredients" : "preferred cuisines"}`}
        />

        {/* Tags display */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2" role="list" aria-label="Selected items">
            {value.map((tag, index) => (
              <Badge key={`${tag}-${index}`} variant="secondary" className="gap-1 pl-2 pr-1" role="listitem">
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-1 hover:bg-muted rounded-sm p-0.5"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Helper text */}
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Press Enter or comma to add. {value.length}/100 items.
        </p>
      </div>
    );
  }
);

TagsInput.displayName = "TagsInput";
