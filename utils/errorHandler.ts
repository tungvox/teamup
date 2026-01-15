/**
 * Error handling utility for user-friendly error messages
 */

export interface AppError {
  message: string;
  code?: string;
  userMessage: string;
  originalError?: unknown;
}

/**
 * Maps technical errors to user-friendly messages
 */
export function getUserFriendlyError(error: unknown): AppError {
  // If it's already an AppError, return it
  if (error && typeof error === 'object' && 'userMessage' in error) {
    return error as AppError;
  }

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code?: string; message?: string };
    
    switch (supabaseError.code) {
      case 'PGRST116':
        return {
          message: supabaseError.message || 'Resource not found',
          code: supabaseError.code,
          userMessage: 'The requested item could not be found.',
          originalError: error,
        };
      
      case '42P01':
        return {
          message: supabaseError.message || 'Table does not exist',
          code: supabaseError.code,
          userMessage: 'Database configuration error. Please contact support.',
          originalError: error,
        };
      
      case '42501':
        return {
          message: supabaseError.message || 'Permission denied',
          code: supabaseError.code,
          userMessage: 'You do not have permission to perform this action.',
          originalError: error,
        };
      
      case 'PGRST301':
      case '406':
        return {
          message: supabaseError.message || 'RLS policy violation',
          code: supabaseError.code,
          userMessage: 'Access denied. Please check your permissions.',
          originalError: error,
        };
      
      case '23505':
        return {
          message: supabaseError.message || 'Duplicate entry',
          code: supabaseError.code,
          userMessage: 'This item already exists.',
          originalError: error,
        };
      
      case '23503':
        return {
          message: supabaseError.message || 'Foreign key violation',
          code: supabaseError.code,
          userMessage: 'Invalid reference. Please refresh and try again.',
          originalError: error,
        };
      
      default:
        return {
          message: supabaseError.message || 'An error occurred',
          code: supabaseError.code,
          userMessage: 'Something went wrong. Please try again.',
          originalError: error,
        };
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Check for common error patterns
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        message: error.message,
        userMessage: 'Network error. Please check your connection and try again.',
        originalError: error,
      };
    }
    
    if (message.includes('timeout')) {
      return {
        message: error.message,
        userMessage: 'Request timed out. Please try again.',
        originalError: error,
      };
    }
    
    if (message.includes('not found')) {
      return {
        message: error.message,
        userMessage: 'The requested item could not be found.',
        originalError: error,
      };
    }
    
    if (message.includes('already') || message.includes('duplicate')) {
      return {
        message: error.message,
        userMessage: error.message, // These are usually already user-friendly
        originalError: error,
      };
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return {
        message: error.message,
        userMessage: 'You do not have permission to perform this action.',
        originalError: error,
      };
    }
    
    if (message.includes('full') || message.includes('maximum')) {
      return {
        message: error.message,
        userMessage: error.message, // Usually already user-friendly
        originalError: error,
      };
    }
    
    // Default for Error objects
    return {
      message: error.message,
      userMessage: 'An unexpected error occurred. Please try again.',
      originalError: error,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      userMessage: error, // Assume strings are already user-friendly
      originalError: error,
    };
  }

  // Fallback for unknown error types
  return {
    message: 'Unknown error',
    userMessage: 'An unexpected error occurred. Please try again.',
    originalError: error,
  };
}

/**
 * Wraps an async function with error handling
 */
export async function handleError<T>(
  fn: () => Promise<T>,
  customHandler?: (error: unknown) => AppError
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const appError = customHandler ? customHandler(error) : getUserFriendlyError(error);
    throw appError;
  }
}

/**
 * Creates a user-friendly error message for display
 */
export function formatErrorForDisplay(error: unknown): string {
  const appError = getUserFriendlyError(error);
  return appError.userMessage;
}

/**
 * Checks if an error is a specific type
 */
export function isErrorType(error: unknown, code: string): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code?: string }).code === code;
  }
  return false;
}
