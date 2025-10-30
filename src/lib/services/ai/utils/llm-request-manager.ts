import { AiProviderError, AiTimeoutError } from "../types";

/**
 * Execute HTTP request with timeout handling
 * @param fetchFn - Async function that performs the fetch request
 * @param timeout - Timeout in milliseconds
 * @param providerName - Name of the provider (for error messages)
 * @returns Promise with fetch response
 * @throws AiTimeoutError if request times out
 */
export async function executeWithTimeout(
  fetchFn: (signal: AbortSignal) => Promise<Response>,
  timeout: number,
  providerName: string
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetchFn(controller.signal);
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Check if error is timeout
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AiTimeoutError(`${providerName} request timed out after ${timeout}ms`);
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Handle HTTP response errors
 * @param response - HTTP Response object
 * @param providerName - Name of the provider (for error messages)
 * @throws AiProviderError if response is not ok
 */
export async function handleResponseError(response: Response, providerName: string): Promise<void> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new AiProviderError(`${providerName} API error: ${errorText}`, response.status);
  }
}

/**
 * Extract content from response JSON
 * @param data - Parsed JSON response data
 * @param contentPath - Path to content in response (e.g., "choices.0.message.content")
 * @param providerName - Name of the provider (for error messages)
 * @returns Extracted content string
 * @throws AiProviderError if content is not found
 */
export function extractContent(data: unknown, contentPath: string[], providerName: string): string {
  let current = data;

  for (const key of contentPath) {
    if (current == null) {
      throw new AiProviderError(`No content in ${providerName} response`, undefined);
    }

    // Handle array index (e.g., "0")
    if (!isNaN(Number(key))) {
      current = current[Number(key)];
    } else {
      current = current[key];
    }
  }

  if (typeof current !== "string" || !current) {
    throw new AiProviderError(`No content in ${providerName} response`, undefined);
  }

  return current;
}

/**
 * Wrap network errors into AiProviderError
 * @param error - Original error
 * @param providerName - Name of the provider
 * @throws AiProviderError with formatted message
 */
export function handleNetworkError(error: unknown, providerName: string): never {
  const message = error instanceof Error ? error.message : "Unknown error";
  throw new AiProviderError(`${providerName} request failed: ${message}`, undefined);
}
