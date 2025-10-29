import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  maxLength?: number;
}

/**
 * SearchBar component for full-text search
 * Supports debounced input, Enter key submission, and clear button
 */
export function SearchBar({ value, onChange, onSubmit, disabled = false, maxLength = 200 }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value);

  // Sync with external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setInputValue(newValue);
    }
  };

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed !== value) {
      onChange(trimmed);
      onSubmit();
    }
  }, [inputValue, value, onChange, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
    onSubmit();
  };

  const showClearButton = inputValue.length > 0;

  return (
    <div className="flex gap-2" role="search">
      <div className="relative flex-1">
        <Input
          type="search"
          placeholder="Search recipes..."
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          maxLength={maxLength}
          className="pr-8"
          aria-label="Search recipes"
        />
        {showClearButton && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || inputValue.trim().length === 0}
        aria-label="Search"
      >
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </div>
  );
}
