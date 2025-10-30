import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { ApiError } from "@/types";

interface ErrorPanelProps {
  error: ApiError | Error;
  onRetry?: () => void;
}

/**
 * Maps API error codes to user-friendly messages
 */
function getErrorMessage(error: ApiError | Error): {
  title: string;
  description: string;
} {
  // Handle generic Error
  if (error instanceof Error) {
    return {
      title: "An error occurred",
      description: error.message || "Please try again later.",
    };
  }

  // Handle ApiError based on status/message
  const errorMsg = error.message?.toLowerCase() || "";

  // 400 Bad Request
  if (errorMsg.includes("bad request") || errorMsg.includes("validation")) {
    return {
      title: "Invalid request",
      description: "Check your filters and try again.",
    };
  }

  // 401 Unauthorized (shouldn't happen as it redirects, but just in case)
  if (errorMsg.includes("unauthorized") || errorMsg.includes("401")) {
    return {
      title: "Unauthorized",
      description: "Please log in again.",
    };
  }

  // 404 Not Found
  if (errorMsg.includes("not found") || errorMsg.includes("404")) {
    return {
      title: "Not found",
      description: "Recipe doesn't exist or has been deleted.",
    };
  }

  // 413 Payload Too Large
  if (errorMsg.includes("too large") || errorMsg.includes("413")) {
    return {
      title: "Too large",
      description: "Result exceeds the 200KB limit. Please try again.",
    };
  }

  // 429 Too Many Requests
  if (errorMsg.includes("too many") || errorMsg.includes("429")) {
    return {
      title: "Rate limit exceeded",
      description: "Please wait a moment before trying again.",
    };
  }

  // 500 Internal Server Error
  if (errorMsg.includes("internal") || errorMsg.includes("500")) {
    return {
      title: "Server error",
      description: "We're sorry, something went wrong. Please try again later.",
    };
  }

  // 503 Service Unavailable
  if (errorMsg.includes("unavailable") || errorMsg.includes("503")) {
    return {
      title: "Service unavailable",
      description: "Service is temporarily unavailable. Please try again in a moment.",
    };
  }

  // Generic error
  return {
    title: "An error occurred",
    description: error.message || "Please try again later.",
  };
}

/**
 * ErrorPanel component - displays user-friendly error messages
 * Maps error codes (400/401/404/413/429/500/503) to appropriate messages
 * Provides retry button when applicable
 */
export function ErrorPanel({ error, onRetry }: ErrorPanelProps) {
  const { title, description } = getErrorMessage(error);

  return (
    <div className="py-8">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          <p>{description}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
