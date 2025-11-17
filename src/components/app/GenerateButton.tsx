import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/contexts/I18nContext";
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
function getGenerationErrorMessage(
  error: ApiError,
  t: (key: string, replacements?: Record<string, string | number>) => string
): {
  title: string;
  description: string;
  canRetry: boolean;
} {
  const errorMsg = error.message?.toLowerCase() || "";

  // 400 Bad Request - validation error
  if (errorMsg.includes("validation") || errorMsg.includes("bad request")) {
    return {
      title: t('generator.errorInvalidPromptTitle'),
      description: t('generator.errorInvalidPromptDesc'),
      canRetry: false,
    };
  }

  // 413 Payload Too Large
  if (errorMsg.includes("too large") || errorMsg.includes("413")) {
    return {
      title: t('generator.errorTooLargeTitle'),
      description: t('generator.errorTooLargeDesc'),
      canRetry: true,
    };
  }

  // 429 Too Many Requests
  if (errorMsg.includes("too many") || errorMsg.includes("429")) {
    const retryAfter = (error.details?.retry_after as number) || 60;
    return {
      title: t('generator.errorRateLimitTitle'),
      description: t('generator.errorRateLimitDesc', { retryAfter }),
      canRetry: false,
    };
  }

  // 503 Service Unavailable
  if (errorMsg.includes("unavailable") || errorMsg.includes("503")) {
    return {
      title: t('generator.errorServiceUnavailableTitle'),
      description: t('generator.errorServiceUnavailableDesc'),
      canRetry: true,
    };
  }

  // 500 Internal Server Error
  if (errorMsg.includes("internal") || errorMsg.includes("500")) {
    return {
      title: t('generator.errorServerTitle'),
      description: t('generator.errorServerDesc'),
      canRetry: true,
    };
  }

  // Generic error
  return {
    title: t('generator.errorGenericTitle'),
    description: error.message || t('generator.errorGenericDesc'),
    canRetry: true,
  };
}

/**
 * GenerateButton component with loading state and error handling
 * Shows retry indicator and error alerts
 */
export function GenerateButton({ onClick, disabled, loading, error, onRetry }: GenerateButtonProps) {
  const { t } = useI18n();
  const errorInfo = error ? getGenerationErrorMessage(error, t) : null;

  return (
    <div className="space-y-4">
      <Button onClick={onClick} disabled={disabled || loading} className="w-full gap-2" size="lg">
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {t('generator.generating')}
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            {t('generator.generateButton')}
          </>
        )}
      </Button>

      {loading && (
        <div className="text-xs text-center text-muted-foreground" aria-live="polite">
          {t('generator.generatingStatus')}
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
                {t('generator.tryAgain')}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
