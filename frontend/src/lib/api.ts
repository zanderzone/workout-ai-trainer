const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://wod-coach.ngrok.app';

export async function loginWithGoogle() {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
}

export async function loginWithApple() {
    window.location.href = `${API_BASE_URL}/api/auth/apple`;
}

export async function isAppleSignInEnabled(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const data = await response.json();
        return data.services?.oauth?.apple?.status === 'configured';
    } catch (error) {
        console.error('Error checking Apple Sign In status:', error);
        return false;
    }
}

export async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
        return { isAuthenticated: false, user: null };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return { isAuthenticated: false, user: null };
        }

        return response.json();
    } catch (error) {
        console.error('Error checking auth status:', error);
        return { isAuthenticated: false, user: null };
    }
}

export async function completeProfile(data: {
    ageRange: "18-24" | "25-34" | "35-44" | "45-54" | "55+";
    sex: "male" | "female" | "other";
    fitnessLevel: "beginner" | "intermediate" | "advanced";
    goals: string[];
    injuriesOrLimitations: string[];
    workoutDuration: string;
    equipment: string[];
    gymLocation: string;
}, token: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            profileData: data
        }),
        credentials: 'include'
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to complete profile' }));
        throw new Error(errorData.message || 'Failed to complete profile');
    }

    return response.json();
} 