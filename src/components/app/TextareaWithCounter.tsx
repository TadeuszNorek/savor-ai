import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TextareaWithCounterProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
  label?: string;
  placeholder?: string;
}

/**
 * TextareaWithCounter component - textarea with character counter
 * Used for recipe generation prompt input
 */
export function TextareaWithCounter({
  value,
  onChange,
  disabled = false,
  maxLength = 2000,
  label = "Recipe generation prompt",
  placeholder = "Describe the recipe you want to generate...",
}: TextareaWithCounterProps) {
  const remaining = maxLength - value.length;
  const isNearLimit = remaining < 100;
  const isAtLimit = remaining === 0;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="recipe-prompt">{label}</Label>
      <Textarea
        id="recipe-prompt"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className="min-h-[200px] resize-none"
        maxLength={maxLength}
        aria-describedby="prompt-counter"
      />
      <div
        id="prompt-counter"
        className={`text-xs text-right ${
          isAtLimit
            ? "text-destructive font-semibold"
            : isNearLimit
              ? "text-yellow-600 dark:text-yellow-500"
              : "text-muted-foreground"
        }`}
        aria-live="polite"
      >
        {value.length} / {maxLength} characters
        {isAtLimit && " (limit reached)"}
      </div>
    </div>
  );
}
