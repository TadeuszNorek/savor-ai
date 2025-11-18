import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { ApiError } from "@/types";
import { useI18n } from "@/lib/contexts/I18nContext";

interface ErrorPanelProps {
  error: ApiError | Error;
  onRetry?: () => void;
}

/**
 * Maps API error codes to translation keys
 */
function getErrorMessageKeys(error: ApiError | Error): {
  titleKey: string;
  descriptionKey: string;
  useFallback: boolean;
} {
  // Handle generic Error
  if (error instanceof Error) {
    return {
      titleKey: "errors.genericTitle",
      descriptionKey: "errors.genericDescription",
      useFallback: true,
    };
  }

  // Handle ApiError based on status/message
  const errorMsg = error.message?.toLowerCase() || "";

  // 400 Bad Request
  if (errorMsg.includes("bad request") || errorMsg.includes("validation")) {
    return {
      titleKey: "errors.invalidRequestTitle",
      descriptionKey: "errors.invalidRequestDescription",
      useFallback: false,
    };
  }

  // 401 Unauthorized
  if (errorMsg.includes("unauthorized") || errorMsg.includes("401")) {
    return {
      titleKey: "errors.unauthorizedTitle",
      descriptionKey: "errors.unauthorizedDescription",
      useFallback: false,
    };
  }

  // 404 Not Found
  if (errorMsg.includes("not found") || errorMsg.includes("404")) {
    return {
      titleKey: "errors.notFoundTitle",
      descriptionKey: "errors.notFoundDescription",
      useFallback: false,
    };
  }

  // 413 Payload Too Large
  if (errorMsg.includes("too large") || errorMsg.includes("413")) {
    return {
      titleKey: "errors.tooLargeTitle",
      descriptionKey: "errors.tooLargeDescription",
      useFallback: false,
    };
  }

  // 429 Too Many Requests
  if (errorMsg.includes("too many") || errorMsg.includes("429")) {
    return {
      titleKey: "errors.rateLimitTitle",
      descriptionKey: "errors.rateLimitDescription",
      useFallback: false,
    };
  }

  // 500 Internal Server Error
  if (errorMsg.includes("internal") || errorMsg.includes("500")) {
    return {
      titleKey: "errors.serverErrorTitle",
      descriptionKey: "errors.serverErrorDescription",
      useFallback: false,
    };
  }

  // 503 Service Unavailable
  if (errorMsg.includes("unavailable") || errorMsg.includes("503")) {
    return {
      titleKey: "errors.serviceUnavailableTitle",
      descriptionKey: "errors.serviceUnavailableDescription",
      useFallback: false,
    };
  }

  // Generic error
  return {
    titleKey: "errors.genericTitle",
    descriptionKey: "errors.genericDescription",
    useFallback: true,
  };
}

/**
 * ErrorPanel component - displays user-friendly error messages
 * Maps error codes (400/401/404/413/429/500/503) to appropriate translated messages
 * Provides retry button when applicable
 */
export function ErrorPanel({ error, onRetry }: ErrorPanelProps) {
  const { t } = useI18n();
  const { titleKey, descriptionKey, useFallback } = getErrorMessageKeys(error);

  const title = t(titleKey);
  const description = useFallback && error.message ? error.message : t(descriptionKey);

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
              {t("errors.tryAgain")}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
