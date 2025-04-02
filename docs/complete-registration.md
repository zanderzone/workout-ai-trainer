# Complete Registration Process

## Overview
The complete registration process is a two-step flow that combines OAuth authentication with detailed user and fitness profile information collection. This document describes the process, data structures, and API endpoints involved.

## Flow

### 1. OAuth Authentication
1. User initiates registration by choosing an OAuth provider (Google or Apple)
2. User authenticates with the chosen provider
3. System creates initial user record with OAuth data
4. User is redirected to profile completion form

### 2. Profile Completion
1. User fills out comprehensive profile form
2. Frontend validates form data
3. Data is sent to backend for processing
4. Backend validates and stores the data
5. User is redirected to dashboard

## Data Structures

### User Information
```typescript
interface UserInfo {
  firstName: string;      // Required
  lastName: string;       // Required
  displayName: string;    // Required
  profilePicture?: string; // Optional
}
```

### Fitness Profile Information
```typescript
interface FitnessProfile {
  ageRange: "18-24" | "25-34" | "35-44" | "45-54" | "55+";  // Required
  sex: "male" | "female" | "other";                          // Required
  fitnessLevel: "beginner" | "intermediate" | "advanced";    // Required
  goals: string[];                                           // Required
  injuriesOrLimitations: string[];                          // Required
  availableEquipment: string[];                             // Required
  preferredTrainingDays: string[];                          // Required
  preferredWorkoutDuration: "short" | "medium" | "long";    // Required
  locationPreference: "gym" | "home" | "park" | "indoor" | "outdoor" | "both"; // Required
}
```

## API Endpoints

### Complete Profile
```typescript
POST /api/auth/complete-profile
```

#### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```typescript
{
  firstName: string;
  lastName: string;
  displayName: string;
  profilePicture?: string;
  ageRange: string;
  sex: string;
  fitnessLevel: string;
  goals: string[];
  injuriesOrLimitations: string[];
  availableEquipment: string[];
  preferredTrainingDays: string[];
  preferredWorkoutDuration: string;
  locationPreference: string;
}
```

#### Response
```typescript
{
  message: string;
  isRegistrationComplete: boolean;
}
```

## Validation Rules

### User Information
- First Name: Required, non-empty string
- Last Name: Required, non-empty string
- Display Name: Required, non-empty string
- Profile Picture: Optional, valid URL

### Fitness Profile
- Age Range: Must be one of the predefined ranges
- Sex: Must be one of: "male", "female", "other"
- Fitness Level: Must be one of: "beginner", "intermediate", "advanced"
- Goals: Array of strings, at least one required
- Injuries/Limitations: Array of strings
- Available Equipment: Array of strings, at least one required
- Preferred Training Days: Array of strings, at least one required
- Preferred Workout Duration: Must be one of: "short", "medium", "long"
- Location Preference: Must be one of the predefined locations

## Error Handling

### Validation Errors
- Invalid data format
- Missing required fields
- Invalid enum values

### Authentication Errors
- Invalid or missing JWT token
- Token expired
- Unauthorized access

### Database Errors
- User not found
- Duplicate entries
- Connection issues

## Security Considerations

1. JWT Token Validation
   - Token must be valid and not expired
   - Token must contain correct user ID

2. Data Validation
   - All input is validated on both frontend and backend
   - Enum values are strictly enforced
   - Array lengths are checked

3. Authorization
   - Users can only update their own profiles
   - Profile completion can only happen once per user

## Frontend Implementation

### Form Structure
1. Personal Information Section
   - Basic user details
   - Profile picture upload

2. Fitness Profile Section
   - Basic fitness information
   - Goals and preferences
   - Equipment and schedule
   - Health considerations

### Validation
- Real-time validation as user types
- Clear error messages
- Required field indicators
- Submit button disabled until valid

### Error Handling
- Display validation errors
- Show API error messages
- Handle network issues
- Provide retry options

## Backend Implementation

### Process Flow
1. Validate JWT token
2. Extract user ID
3. Validate request body
4. Update user profile
5. Mark registration as complete
6. Return success response

### Database Updates
- Update user record with new information
- Set registration completion flag
- Update timestamp
- Handle concurrent updates

## Post-Registration

### Redirect
- User is redirected to dashboard
- Session is established
- Welcome message displayed

### Next Steps
- Complete onboarding tutorial
- Set up initial workout preferences
- Configure notification settings
- Start receiving personalized workouts 