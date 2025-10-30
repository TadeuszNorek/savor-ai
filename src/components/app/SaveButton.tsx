import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Save, ExternalLink } from "lucide-react";

interface SaveButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  disabledReason?: string;
}

/**
 * SaveButton component - saves recipe draft with validation
 * Shows tooltip with reason when disabled (e.g., disliked ingredients)
 * Links to profile page when blocked by preferences
 */
export function SaveButton({ onClick, disabled, loading, disabledReason }: SaveButtonProps) {
  const button = (
    <Button onClick={onClick} disabled={disabled || loading} className="gap-2" size="lg">
      <Save className="h-5 w-5" />
      {loading ? "Saving..." : "Save recipe"}
    </Button>
  );

  if (disabled && disabledReason) {
    return (
      <TooltipProvider>
        <div className="space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{disabledReason}</p>
            </TooltipContent>
          </Tooltip>
          {disabledReason.toLowerCase().includes("disliked") && (
            <a
              href="/profile"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Update dietary preferences
            </a>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return button;
}
