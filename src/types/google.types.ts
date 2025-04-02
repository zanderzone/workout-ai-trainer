/**
 * User information from Google's userinfo endpoint
 */
export interface GoogleUserInfo {
    /** Google user ID */
    id: string;
    /** User's email address */
    email: string;
    /** Whether the email is verified */
    verified_email: boolean;
    /** User's full name */
    name?: string;
    /** User's given name */
    given_name?: string;
    /** User's family name */
    family_name?: string;
    /** URL to user's profile picture */
    picture?: string;
} 