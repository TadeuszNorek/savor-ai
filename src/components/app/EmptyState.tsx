import { Button } from "@/components/ui/button";
import { FileText, Sparkles } from "lucide-react";

interface EmptyStateProps {
  message?: string;
  onCta?: () => void;
}

/**
 * EmptyState component - displays when recipe list is empty
 * Shows friendly message and CTA to generate first recipe
 */
export function EmptyState({ message, onCta }: EmptyStateProps) {
  const defaultMessage = "No recipes found";
  const displayMessage = message || defaultMessage;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-semibold mb-2">{displayMessage}</h3>

      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {onCta
          ? "Start your culinary journey! Generate your first recipe using AI."
          : "Try changing filters or search for something else."}
      </p>

      {onCta && (
        <Button onClick={onCta} size="lg" className="gap-2">
          <Sparkles className="h-5 w-5" />
          Generate first recipe
        </Button>
      )}
    </div>
  );
}
