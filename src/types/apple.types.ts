/**
 * User information decoded from Apple's ID token
 */
export interface AppleUserInfo {
    /** Unique identifier for the user */
    sub: string;
    /** User's email address */
    email: string;
    /** Whether the email is verified */
    email_verified: boolean;
    /** User's name information */
    name?: {
        firstName: string;
        lastName: string;
    };
} 