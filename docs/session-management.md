# Session Management Overview

## Overview

Our application uses MongoDB-based session storage with Express Session for managing user sessions. This approach provides several advantages over cookie-based sessions:

1. **Scalability**: Can store larger amounts of session data
2. **Security**: Session data is stored server-side
3. **Performance**: Only session ID is transferred in cookies
4. **Reliability**: Sessions persist even if cookies are cleared
5. **Management**: Easy to inspect and invalidate sessions

## Configuration

### Session Middleware Setup

```typescript
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/workout-ai-trainer',
        ttl: 24 * 60 * 60, // 1 day
        autoRemove: 'native', // Automatically remove expired sessions
        crypto: {
            secret: process.env.SESSION_SECRET || 'your-secret-key'
        }
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true, // Prevent JavaScript access to the cookie
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax' // Protect against CSRF
    }
}));
```

### Key Configuration Options

1. **Session Store**
   - Uses MongoDB to store session data
   - TTL (Time To Live) of 1 day
   - Automatic removal of expired sessions
   - Encrypted session data

2. **Cookie Settings**
   - Secure in production (HTTPS only)
   - HttpOnly to prevent XSS attacks
   - 24-hour expiration
   - SameSite policy for CSRF protection

3. **Security Features**
   - Session data encryption
   - Secure cookie transmission
   - CSRF protection
   - XSS prevention

## Session Data Structure

Sessions are stored in MongoDB with the following structure:

```typescript
interface Session {
    _id: string;          // Session ID
    expires: Date;        // Session expiration
    session: {           // Session data
        cookie: {
            originalMaxAge: number;
            expires: Date;
            secure: boolean;
            httpOnly: boolean;
            path: string;
            sameSite: string;
        };
        passport: {      // Passport.js user data
            user: {
                providerId: string;
                email: string;
                provider: string;
                // ... other user data
            }
        };
    };
}
```

## Session Management

### Creating Sessions

Sessions are automatically created when:
1. User successfully authenticates
2. User logs in through OAuth providers
3. Session is explicitly created

### Maintaining Sessions

1. **Session Validation**
   ```typescript
   export const validateSession = (req: Request, res: Response, next: NextFunction) => {
       if (!req.isAuthenticated()) {
           throw new UnauthorizedError('User not authenticated');
       }
       next();
   };
   ```

2. **Session Refresh**
   - Sessions are automatically refreshed on each request
   - Expiration time is extended
   - User data is updated if needed

3. **Session Cleanup**
   - Expired sessions are automatically removed
   - Manual cleanup can be triggered if needed
   - Failed authentication attempts are tracked

### Security Considerations

1. **Session Hijacking Prevention**
   - Secure cookie transmission
   - HttpOnly cookies
   - Session ID rotation on privilege changes

2. **CSRF Protection**
   - SameSite cookie policy
   - CSRF tokens for sensitive operations
   - Origin validation

3. **XSS Prevention**
   - HttpOnly cookies
   - Content Security Policy
   - Input sanitization

## Best Practices

1. **Session Storage**
   - Keep session data minimal
   - Store sensitive data server-side
   - Use appropriate TTL values

2. **Security**
   - Always use HTTPS in production
   - Implement proper session invalidation
   - Monitor for suspicious activity

3. **Performance**
   - Clean up expired sessions regularly
   - Monitor session store size
   - Implement session caching when needed

4. **Error Handling**
   - Handle session errors gracefully
   - Provide clear error messages
   - Log security-related events

## Example Usage

```typescript
// Setting session data
req.session.userData = {
    preferences: { /* ... */ },
    lastLogin: new Date()
};

// Accessing session data
const userData = req.session.userData;

// Destroying session
req.session.destroy((err) => {
    if (err) {
        // Handle error
    }
    // Redirect to login
});
``` 