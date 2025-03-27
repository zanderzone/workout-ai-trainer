# OpenAI Error Handling

This document describes the error handling system for OpenAI API interactions in the Workout AI Trainer application.

## Overview

The application implements a robust error handling system for OpenAI API interactions that:
- Categorizes different types of OpenAI-related errors
- Provides consistent error responses
- Maintains proper error hierarchy
- Preserves error details for debugging
- Uses appropriate HTTP status codes
- Handles both API and infrastructure errors

## Error Class Hierarchy

```
AppError (Base)
└── OpenAIError
    ├── OpenAIRateLimitError (429)
    ├── OpenAIInvalidRequestError (400)
    ├── OpenAIServiceUnavailableError (503)
    └── OpenAIResponseError (500)
```

## Error Types

### 1. API Response Errors

#### Rate Limiting (429)
- Triggered when the application exceeds OpenAI's API rate limits
- Example: Too many requests in a short time period
- Response includes retry-after header when available

#### Invalid Requests (400)
- Triggered by malformed requests or invalid parameters
- Example: Invalid model name or malformed prompt
- Includes validation error details

#### Service Unavailable (503)
- Triggered when OpenAI's service is down or having issues
- Example: OpenAI API endpoint is unreachable
- Includes service status information

#### General API Errors (500)
- Catch-all for other OpenAI API errors
- Includes detailed error message from OpenAI
- Preserves original error context

### 2. Network/Infrastructure Errors

#### Network Connectivity Issues
- Connection failures
- DNS resolution problems
- Network timeouts
- SSL/TLS errors

#### Timeout Errors
- Request timeout
- Connection timeout
- Response timeout

### 3. Response Processing Errors

#### Empty Responses
- When OpenAI returns an empty response
- When response content is missing

#### JSON Parsing Failures
- Invalid JSON format
- Malformed response structure
- Missing required fields

#### Schema Validation Failures
- Response doesn't match expected schema
- Missing required fields
- Invalid data types

## Error Handling Flow

```typescript
try {
    // Make OpenAI API call
} catch (error) {
    // 1. Check if it's already an OpenAIError
    if (error instanceof OpenAIError) {
        throw error;
    }

    // 2. Check for OpenAI API specific errors
    if (error && typeof error === "object" && "response" in error) {
        const status = error.response?.status;
        switch (status) {
            case 429: throw new OpenAIRateLimitError()
            case 400: throw new OpenAIInvalidRequestError()
            case 503: throw new OpenAIServiceUnavailableError()
            default: throw new OpenAIError()
        }
    }

    // 3. Check for specific error messages
    if (error.message.includes('network')) {
        throw OpenAIServiceUnavailableError
    }
    if (error.message.includes('timeout')) {
        throw OpenAIServiceUnavailableError
    }
    if (error.message.includes('parse')) {
        throw OpenAIResponseError
    }

    // 4. Default case
    throw OpenAIError
}
```

## Error Response Format

All OpenAI errors are formatted consistently:

```typescript
{
    status: number,      // HTTP status code
    message: string,     // Human-readable error message
    error?: any         // Original error details (if available)
}
```

## Usage Examples

### Basic Error Handling

```typescript
try {
    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [...]
    });
} catch (error) {
    handleOpenAIError(error);
}
```

### Custom Error Handling

```typescript
try {
    const response = await openai.chat.completions.create({...});
} catch (error) {
    if (error instanceof OpenAIRateLimitError) {
        // Handle rate limiting specifically
        await handleRateLimit(error);
    } else {
        handleOpenAIError(error);
    }
}
```

### Error Response Formatting

```typescript
try {
    // API call
} catch (error) {
    const formattedError = formatOpenAIErrorResponse(error);
    res.status(formattedError.status).json(formattedError);
}
```

## Best Practices

1. **Always Use Error Handlers**
   - Use `handleOpenAIError` for all OpenAI API calls
   - Don't catch and rethrow OpenAI errors manually

2. **Preserve Error Context**
   - Include original error details when available
   - Add relevant context to error messages

3. **Use Appropriate Status Codes**
   - 429 for rate limiting
   - 400 for invalid requests
   - 503 for service unavailability
   - 500 for other errors

4. **Log Errors Appropriately**
   - Log full error details for debugging
   - Include request context in logs
   - Don't log sensitive information

5. **Handle Retries**
   - Implement exponential backoff for rate limits
   - Consider retrying transient errors
   - Set appropriate timeout values

## Testing

The error handling system includes comprehensive tests:
- Unit tests for each error class
- Integration tests for error handling flow
- Tests for error response formatting
- Tests for various error scenarios

See `src/tests/errors/openai.test.ts` for test coverage.

## Future Improvements

1. **Rate Limiting**
   - Implement token bucket algorithm
   - Add rate limit tracking per user
   - Add rate limit status endpoint

2. **Error Monitoring**
   - Add error tracking integration
   - Implement error analytics
   - Set up error alerts

3. **Retry Logic**
   - Implement automatic retries
   - Add retry configuration
   - Add retry metrics

4. **Error Documentation**
   - Add error code documentation
   - Create error troubleshooting guide
   - Add error examples 