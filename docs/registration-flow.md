# Registration Flow Documentation

This document describes the complete registration flow for the Workout AI Trainer application, including both OAuth authentication and fitness profile collection.

## Overview

The registration process consists of two main phases:
1. OAuth Authentication (Google or Apple)
2. Fitness Profile Collection

## OAuth Authentication Flow

### Google OAuth Flow
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Google
    participant Database

    User->>Frontend: Click "Sign in with Google"
    Frontend->>Backend: GET /api/auth/google
    Backend->>Backend: Generate state parameter
    Backend->>Backend: Set oauth_state cookie
    Backend->>Google: Redirect to Google OAuth
    Google->>User: Show Google consent screen
    User->>Google: Approve consent
    Google->>Backend: Redirect with auth code
    Backend->>Backend: Verify state parameter
    Backend->>Google: Exchange code for tokens
    Google->>Backend: Return access & refresh tokens
    Backend->>Google: Get user info
    Google->>Backend: Return user profile
    Backend->>Database: Check if user exists
    alt User doesn't exist
        Backend->>Database: Create new user
        Database->>Backend: Return created user
    end
    Backend->>Backend: Generate JWT token
    Backend->>Frontend: Redirect with token
    Frontend->>Frontend: Store token
    Frontend->>User: Show success message
```

### Apple Sign In Flow
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Apple
    participant Database

    User->>Frontend: Click "Sign in with Apple"
    Frontend->>Backend: GET /api/auth/apple
    Backend->>Backend: Generate state parameter
    Backend->>Backend: Set oauth_state cookie
    Backend->>Apple: Redirect to Apple Sign In
    Apple->>User: Show Apple consent screen
    User->>Apple: Approve consent
    Apple->>Backend: Redirect with auth code
    Backend->>Backend: Verify state parameter
    Backend->>Apple: Exchange code for tokens
    Apple->>Backend: Return access & refresh tokens
    Backend->>Apple: Get user info
    Apple->>Backend: Return user profile
    Backend->>Database: Check if user exists
    alt User doesn't exist
        Backend->>Database: Create new user
        Database->>Backend: Return created user
    end
    Backend->>Backend: Generate JWT token
    Backend->>Frontend: Redirect with token
    Frontend->>Frontend: Store token
    Frontend->>User: Show success message
```

## Fitness Profile Collection

After successful OAuth authentication, the user is prompted to complete their fitness profile:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    Frontend->>User: Show fitness profile form
    User->>Frontend: Fill fitness profile
    Note over User,Frontend: Required fields:<br/>- Fitness Level<br/>- Goals<br/>- Available Equipment
    Note over User,Frontend: Optional fields:<br/>- Age Range<br/>- Sex<br/>- Injuries/Limitations<br/>- Preferred Training Days<br/>- Workout Duration<br/>- Location Preference
    Frontend->>Backend: POST /api/fitness-profile
    Backend->>Backend: Validate profile data
    Backend->>Database: Create fitness profile
    Database->>Backend: Return created profile
    Backend->>Frontend: Return success
    Frontend->>User: Show success message
```

## Data Structures

### User Data
```typescript
interface BaseUser {
    userId: string;                   // Unique user identifier
    providerId: string;               // OAuth provider ID
    provider: "google" | "apple";     // OAuth provider type
    email: string;
    emailVerified: boolean;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    profilePicture?: string;
    accountStatus?: "active" | "disabled";
    refreshToken?: string;
    tokenExpiresAt?: Date;
    isRegistrationComplete?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
```

### Fitness Profile Data
```typescript
interface FitnessProfile {
    userId: string;
    ageRange?: "18-24" | "25-34" | "35-44" | "45-54" | "55+";
    sex?: "male" | "female" | "other";
    fitnessLevel: "beginner" | "intermediate" | "advanced";
    goals: Array<"weight loss" | "muscle gain" | "strength" | "endurance" | "power" | "flexibility" | "general fitness">;
    injuriesOrLimitations?: string[];
    availableEquipment: string[];
    preferredTrainingDays?: Array<"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday">;
    preferredWorkoutDuration?: "short" | "medium" | "long";
    locationPreference?: "gym" | "home" | "park" | "indoor" | "outdoor" | "both";
    createdAt: Date;
    updatedAt: Date;
}
```

## Security Measures

1. **OAuth Security**:
   - State parameter to prevent CSRF attacks
   - Secure cookie settings
   - JWT token generation for subsequent requests
   - Email verification status tracking

2. **Data Validation**:
   - All required fields must be present
   - Goals must be from predefined list
   - Fitness level must be one of three options
   - Training days must be valid days of the week
   - Workout duration must be one of three options
   - Location preference must be from predefined list

3. **Database Security**:
   - One-to-one relationship between User and FitnessProfile
   - Unique index on `userId` in fitness_profiles collection
   - Both collections are created during initial database setup

## Error Handling

The registration flow includes comprehensive error handling for:

1. **OAuth Errors**:
   - Invalid state parameter
   - Missing authorization code
   - Token exchange failures
   - Network issues

2. **Profile Collection Errors**:
   - Missing required fields
   - Invalid field values
   - Database errors
   - Network issues

## Post-Registration

After successful registration:

1. User can update their fitness profile at any time
2. Profile data is used to generate personalized workouts
3. User preferences are considered when creating workout plans
4. Progress can be tracked and workouts can be adjusted based on feedback 