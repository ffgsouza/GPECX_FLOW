/**
 * Centralized Error Handling Utility
 * 
 * Provides type-safe error handling with user notifications
 */

import { toast } from "@/hooks/use-toast";

/**
 * Extracts a meaningful error message from an unknown error
 */
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
        return String(error.message);
    }
    return 'Erro desconhecido';
}

/**
 * Handles errors with logging and user notification
 * 
 * @param error - The caught error (unknown type)
 * @param userMessage - Optional user-friendly message to display in toast
 * @param options - Additional options for error handling
 * 
 * @example
 * ```typescript
 * try {
 *   await saveQuote();
 * } catch (error) {
 *   handleError(error, "Não foi possível salvar a proposta");
 * }
 * ```
 */
export function handleError(
    error: unknown,
    userMessage?: string,
    options?: {
        showToast?: boolean;
        logToConsole?: boolean;
    }
) {
    const { showToast = true, logToConsole = true } = options || {};

    const errorMessage = getErrorMessage(error);

    // Log to console for debugging
    if (logToConsole) {
        console.error('[Error Handler]', errorMessage, error);
    }

    // Show toast notification
    if (showToast) {
        toast({
            title: "Erro",
            description: userMessage || errorMessage,
            variant: "destructive"
        });
    }

    return errorMessage;
}

/**
 * Handles errors without showing a toast (useful for silent failures)
 */
export function handleSilentError(error: unknown): string {
    return handleError(error, undefined, { showToast: false });
}

/**
 * Type guard to check if error is a Firebase error
 */
export function isFirebaseError(error: unknown): error is { code: string; message: string } {
    return (
        error !== null &&
        typeof error === 'object' &&
        'code' in error &&
        'message' in error
    );
}
