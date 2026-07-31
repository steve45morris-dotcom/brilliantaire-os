export interface SafeOpenAIError {
  code: string;
  message: string;
  retryable: boolean;
}

export class OpenAIErrorMapper {
  public static mapError(err: any): SafeOpenAIError {
    const rawMessage = err?.message || 'An unexpected error occurred.';
    const status = err?.status || err?.statusCode || 500;
    
    let code = 'unknown_error';
    let message = 'An unexpected service error occurred. Fallback state active.';
    let retryable = false;

    if (status === 401 || rawMessage.toLowerCase().includes('api key') || rawMessage.toLowerCase().includes('unauthorized')) {
      code = 'invalid_api_key';
      message = 'OpenAI authentication failed. Please verify OPENAI_API_KEY environment configuration.';
      retryable = false;
    } else if (status === 429 || rawMessage.toLowerCase().includes('rate limit') || rawMessage.toLowerCase().includes('quota')) {
      code = 'rate_limit_exceeded';
      message = 'OpenAI rate limit or monthly token quota exceeded. Please adjust usage limits.';
      retryable = true;
    } else if (rawMessage.toLowerCase().includes('timeout') || rawMessage.toLowerCase().includes('abort')) {
      code = 'timeout';
      message = 'OpenAI connection timed out. Retrying execution stream...';
      retryable = true;
    }

    return { code, message, retryable };
  }
}
