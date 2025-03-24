import { Request, Response } from 'express';
import { googleConfig } from '../config/google.config';
import { appleConfig } from '../config/apple.config';

interface HealthCheckResponse {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    services: {
        database: {
            status: 'connected' | 'disconnected';
            message?: string;
        };
        oauth: {
            google: {
                status: 'configured' | 'misconfigured';
                message?: string;
            };
            apple: {
                status: 'configured' | 'misconfigured';
                message?: string;
            };
        };
    };
}

export const healthController = {
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

        // Validate Google OAuth configuration
        const googleConfigValid = validateGoogleConfig();
        response.services.oauth.google = googleConfigValid;

        // Validate Apple OAuth configuration
        const appleConfigValid = validateAppleConfig();
        response.services.oauth.apple = appleConfigValid;

        // Update overall status if any service is unhealthy
        if (response.services.database.status === 'disconnected' ||
            response.services.oauth.google.status === 'misconfigured' ||
            response.services.oauth.apple.status === 'misconfigured') {
            response.status = 'unhealthy';
        }

        res.status(response.status === 'healthy' ? 200 : 503).json(response);
    }
};

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
            message: `Missing required Google OAuth fields: ${missingFields.join(', ')}`
        };
    }

    // Validate scope format
    const invalidScopes = googleConfig.scope.filter(scope =>
        !scope.startsWith('https://www.googleapis.com/auth/')
    );

    if (invalidScopes.length > 0) {
        return {
            status: 'misconfigured',
            message: `Invalid Google OAuth scopes: ${invalidScopes.join(', ')}`
        };
    }

    return { status: 'configured' };
}

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
                message: `Missing required Apple Sign In fields: ${missingFields.join(', ')}`
            };
        }

        // Validate formats
        const validations = [
            {
                field: 'clientId',
                isValid: appleConfig.clientId.includes('.') && appleConfig.clientId.split('.').length >= 2,
                message: 'Client ID format is invalid. Should be in format "TEAM_ID.BUNDLE_ID"'
            },
            {
                field: 'servicesId',
                isValid: appleConfig.servicesId.startsWith('com.') && appleConfig.servicesId.includes('.service'),
                message: 'Services ID format is invalid. Should start with "com." and end with ".service"'
            },
            {
                field: 'teamId',
                isValid: appleConfig.teamId.length === 10,
                message: 'Team ID should be exactly 10 characters'
            },
            {
                field: 'keyId',
                isValid: appleConfig.keyId.length === 10,
                message: 'Key ID should be exactly 10 characters'
            },
            {
                field: 'callbackUrl',
                isValid: Boolean(new URL(appleConfig.callbackUrl).toString()),
                message: 'Callback URL must be a valid URL'
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