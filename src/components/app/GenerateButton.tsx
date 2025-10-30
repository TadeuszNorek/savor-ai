import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import type { ApiError } from "@/types";

interface GenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  error?: ApiError | null;
  onRetry?: () => void;
}

/**
 * Maps API error to user-friendly message for generation
 */
function getGenerationErrorMessage(error: ApiError): {
  title: string;
  description: string;
  canRetry: boolean;
} {
  const errorMsg = error.message?.toLowerCase() || "";

  // 400 Bad Request - validation error
  if (errorMsg.includes("validation") || errorMsg.includes("bad request")) {
    return {
      title: "Invalid prompt",
      description: "Make sure the prompt is between 1-2000 characters and doesn't contain forbidden patterns.",
      canRetry: false,
    };
  }

  // 413 Payload Too Large
  if (errorMsg.includes("too large") || errorMsg.includes("413")) {
    return {
      title: "Result too large",
      description: "Generated recipe exceeds 200KB limit. Try a simpler prompt.",
      canRetry: true,
    };
  }

  // 429 Too Many Requests
  if (errorMsg.includes("too many") || errorMsg.includes("429")) {
    const retryAfter = (error.details?.retry_after as number) || 60;
    return {
      title: "Rate limit exceeded",
      description: `Please wait ${retryAfter} seconds before trying again.`,
      canRetry: false,
    };
  }

  // 503 Service Unavailable
  if (errorMsg.includes("unavailable") || errorMsg.includes("503")) {
    return {
      title: "AI service unavailable",
      description: "AI service is temporarily unavailable. Please try again in a moment.",
      canRetry: true,
    };
  }

  // 500 Internal Server Error
  if (errorMsg.includes("internal") || errorMsg.includes("500")) {
    return {
      title: "Server error",
      description: "We're sorry, something went wrong. Please try again.",
      canRetry: true,
    };
  }

  // Generic error
  return {
    title: "An error occurred",
    description: error.message || "Failed to generate recipe. Please try again.",
    canRetry: true,
  };
}

/**
 * GenerateButton component with loading state and error handling
 * Shows retry indicator and error alerts
 */
export function GenerateButton({ onClick, disabled, loading, error, onRetry }: GenerateButtonProps) {
  const errorInfo = error ? getGenerationErrorMessage(error) : null;

  return (
    <div className="space-y-4">
      <Button onClick={onClick} disabled={disabled || loading} className="w-full gap-2" size="lg">
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Generate recipe
          </>
        )}
      </Button>

      {loading && (
        <div className="text-xs text-center text-muted-foreground" aria-live="polite">
          AI is analyzing your prompt and creating a recipe...
          <br />
          This may take a few seconds.
        </div>
      )}

      {error && errorInfo && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{errorInfo.title}</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="text-sm">{errorInfo.description}</p>
            {errorInfo.canRetry && onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} className="mt-3 gap-2">
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
