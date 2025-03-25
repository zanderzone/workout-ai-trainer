import { Request, Response } from 'express';
import { googleConfig } from '../config/google.config';
import { appleConfig } from '../config/apple.config';

/**
 * Validation rules for OAuth configuration
 */
const VALIDATION_RULES = {
    TEAM_ID_LENGTH: 10,
    KEY_ID_LENGTH: 10,
    CLIENT_ID_MIN_PARTS: 2,
    SERVICES_ID_SUFFIX: '.service'
} as const;

/**
 * Validation messages for OAuth configuration
 */
const VALIDATION_MESSAGES = {
    APPLE: {
        MISSING_FIELDS: 'Missing required Apple Sign In fields:',
        INVALID_CLIENT_ID: 'Client ID format is invalid. Should be in format "BUNDLE_ID"',
        INVALID_SERVICES_ID: 'Services ID format is invalid. Should start with "com." and end with ".service"',
        INVALID_TEAM_ID: (length: number) => `Team ID should be exactly ${length} characters`,
        INVALID_KEY_ID: (length: number) => `Key ID should be exactly ${length} characters`,
        INVALID_CALLBACK_URL: 'Callback URL must be a valid URL'
    },
    GOOGLE: {
        MISSING_FIELDS: 'Missing required Google OAuth fields:',
        INVALID_SCOPES: 'Invalid Google OAuth scopes:'
    }
} as const;

/**
 * Response format for the health check endpoint
 */
interface HealthCheckResponse {
    /** Overall system health status */
    status: 'healthy' | 'unhealthy';
    /** Timestamp of the health check */
    timestamp: string;
    /** Status of individual services */
    services: {
        /** Database connection status */
        database: {
            status: 'connected' | 'disconnected';
            message?: string;
        };
        /** OAuth providers status */
        oauth: {
            /** Google OAuth configuration status */
            google: {
                status: 'configured' | 'misconfigured';
                message?: string;
            };
            /** Apple Sign In configuration status */
            apple: {
                status: 'configured' | 'misconfigured';
                message?: string;
            };
        };
    };
}

/**
 * Health check controller for monitoring system status
 */
export const healthController = {
    /**
     * Performs a health check of all system components
     * @param req - Express request object
     * @param res - Express response object
     */
    check: async (req: Request, res: Response) => {
        const response: HealthCheckResponse = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: {
                    status: 'disconnected',
                    message: 'Database connection not checked'
                },
                oauth: {
                    google: {
                        status: 'misconfigured',
                        message: 'Google OAuth configuration incomplete'
                    },
                    apple: {
                        status: 'misconfigured',
                        message: 'Apple OAuth configuration incomplete'
                    }
                }
            }
        };

        try {
            // Check database connection
            const userCollection = req.app.locals.userCollection;
            await userCollection.findOne({});
            response.services.database = {
                status: 'connected'
            };
        } catch (error) {
            response.services.database = {
                status: 'disconnected',
                message: error instanceof Error ? error.message : 'Unknown database error'
            };
            response.status = 'unhealthy';
        }

        // Validate OAuth configurations
        response.services.oauth.google = validateGoogleConfig();
        response.services.oauth.apple = validateAppleConfig();

        // Update overall status if any service is unhealthy
        if (response.services.database.status === 'disconnected' ||
            response.services.oauth.google.status === 'misconfigured' ||
            response.services.oauth.apple.status === 'misconfigured') {
            response.status = 'unhealthy';
        }

        res.status(response.status === 'healthy' ? 200 : 503).json(response);
    }
};

/**
 * Validates Google OAuth configuration
 * @returns Object indicating if the configuration is valid
 */
export function validateGoogleConfig(): { status: 'configured' | 'misconfigured'; message?: string } {
    const requiredFields = [
        'clientId',
        'clientSecret',
        'callbackUrl',
        'scope'
    ] as const;

    const missingFields = requiredFields.filter(field => !googleConfig[field as keyof typeof googleConfig]);

    if (missingFields.length > 0) {
        return {
            status: 'misconfigured',
            message: `${VALIDATION_MESSAGES.GOOGLE.MISSING_FIELDS} ${missingFields.join(', ')}`
        };
    }

    // Validate scope format
    const invalidScopes = googleConfig.scope.filter(scope =>
        !scope.startsWith('https://www.googleapis.com/auth/')
    );

    if (invalidScopes.length > 0) {
        return {
            status: 'misconfigured',
            message: `${VALIDATION_MESSAGES.GOOGLE.INVALID_SCOPES} ${invalidScopes.join(', ')}`
        };
    }

    return { status: 'configured' };
}

/**
 * Validates Apple Sign In configuration
 * @returns Object indicating if the configuration is valid
 */
export const validateAppleConfig = (): { status: 'configured' | 'misconfigured'; message?: string } => {
    try {
        // Required fields validation
        const requiredFields = {
            clientId: appleConfig.clientId,
            servicesId: appleConfig.servicesId,
            teamId: appleConfig.teamId,
            keyId: appleConfig.keyId,
            privateKey: appleConfig.privateKey,
            callbackUrl: appleConfig.callbackUrl
        };

        // Check for missing fields
        const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => !value)
            .map(([key]) => key);

        if (missingFields.length > 0) {
            return {
                status: 'misconfigured',
                message: `${VALIDATION_MESSAGES.APPLE.MISSING_FIELDS} ${missingFields.join(', ')}`
            };
        }

        // Validate formats using constants
        const validations = [
            {
                field: 'clientId',
                isValid: appleConfig.clientId.includes('.') &&
                    appleConfig.clientId.split('.').length >= VALIDATION_RULES.CLIENT_ID_MIN_PARTS,
                message: VALIDATION_MESSAGES.APPLE.INVALID_CLIENT_ID
            },
            {
                field: 'servicesId',
                isValid: appleConfig.servicesId.startsWith('com.') &&
                    appleConfig.servicesId.endsWith(VALIDATION_RULES.SERVICES_ID_SUFFIX),
                message: VALIDATION_MESSAGES.APPLE.INVALID_SERVICES_ID
            },
            {
                field: 'teamId',
                isValid: appleConfig.teamId.length === VALIDATION_RULES.TEAM_ID_LENGTH,
                message: VALIDATION_MESSAGES.APPLE.INVALID_TEAM_ID(VALIDATION_RULES.TEAM_ID_LENGTH)
            },
            {
                field: 'keyId',
                isValid: appleConfig.keyId.length === VALIDATION_RULES.KEY_ID_LENGTH,
                message: VALIDATION_MESSAGES.APPLE.INVALID_KEY_ID(VALIDATION_RULES.KEY_ID_LENGTH)
            },
            {
                field: 'callbackUrl',
                isValid: Boolean(new URL(appleConfig.callbackUrl).toString()),
                message: VALIDATION_MESSAGES.APPLE.INVALID_CALLBACK_URL
            }
        ];

        // Log validation details
        console.log('Apple Config Validation:', {
            clientId: appleConfig.clientId,
            servicesId: appleConfig.servicesId,
            teamId: appleConfig.teamId,
            keyId: appleConfig.keyId,
            callbackUrl: appleConfig.callbackUrl,
            privateKeyPresent: !!appleConfig.privateKey,
            validations: validations.map(v => ({ field: v.field, isValid: v.isValid }))
        });

        // Check for any validation failures
        const failedValidation = validations.find(v => !v.isValid);
        if (failedValidation) {
            return {
                status: 'misconfigured',
                message: failedValidation.message
            };
        }

        return { status: 'configured' };
    } catch (error) {
        console.error('Apple config validation failed:', error);
        return {
            status: 'misconfigured',
            message: error instanceof Error ? error.message : 'Unknown error validating Apple config'
        };
    }
}; 