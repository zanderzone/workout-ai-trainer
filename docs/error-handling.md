# Error Handling Overview

## Error Class Hierarchy

Our error handling system is built on a hierarchical structure of error classes:

```
AppError (Base)
└── HttpError
    ├── ValidationError (400)
    ├── UnauthorizedError (401)
    ├── ForbiddenError (403)
    ├── NotFoundError (404)
    └── DatabaseError (500)
        └── DatabaseConnectionError (503)
```

## Error Classes

### Base Error Classes

#### AppError
- Base class for all application errors
- Properties:
  - `message`: Error description
  - `statusCode`: HTTP status code
  - `details`: Additional error information

#### HttpError
- Base class for HTTP-specific errors
- Extends AppError
- Used for all HTTP-related error responses

### Specific Error Classes

#### ValidationError (400)
- Used for input validation failures
- Status code: 400
- Example: Invalid user input, missing required fields

#### UnauthorizedError (401)
- Used for authentication failures
- Status code: 401
- Example: Invalid credentials, missing authentication token

#### ForbiddenError (403)
- Used for authorization failures
- Status code: 403
- Example: Insufficient permissions, access denied

#### NotFoundError (404)
- Used for resource not found errors
- Status code: 404
- Example: User not found, workout plan not found

#### DatabaseError (500)
- Used for general database errors
- Status code: 500
- Example: Query failures, transaction errors

#### DatabaseConnectionError (503)
- Used for database connection issues
- Status code: 503
- Example: Connection timeout, database unavailable

## Error Handling Middleware

The application uses a centralized error handling middleware (`errorHandler`) that:

1. Logs all errors
2. Formats error responses consistently
3. Handles both custom AppErrors and unknown errors
4. Provides appropriate HTTP status codes
5. Includes error details when available

Example error response:
```json
{
    "status": 400,
    "message": "Invalid input",
    "details": {
        "field": "email",
        "error": "Invalid email format"
    }
}
```

## Best Practices

1. **Use Specific Error Classes**
   - Choose the most specific error class for the situation
   - Avoid using generic errors when specific ones exist

2. **Include Helpful Details**
   - Add relevant details to help with debugging
   - Include validation errors, missing fields, etc.

3. **Proper Error Logging**
   - Log errors with appropriate context
   - Include stack traces in development
   - Sanitize sensitive information

4. **Consistent Error Format**
   - Use the standard error response format
   - Include status code, message, and details
   - Maintain consistent error messages

5. **Error Recovery**
   - Implement appropriate fallback mechanisms
   - Handle database connection errors gracefully
   - Provide user-friendly error messages

## Example Usage

```typescript
// Validation error
throw new ValidationError('Invalid user input', {
    field: 'email',
    error: 'Invalid email format'
});

// Authentication error
throw new UnauthorizedError('Invalid credentials');

// Database error
throw new DatabaseError('Failed to save user', {
    operation: 'insert',
    collection: 'users'
});

// Connection error
throw new DatabaseConnectionError('Database connection failed');
``` 