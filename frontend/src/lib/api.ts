const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function loginWithGoogle() {
    window.location.href = `${API_BASE_URL}/auth/google`;
}

export async function loginWithApple() {
    window.location.href = `${API_BASE_URL}/auth/apple`;
}

export async function checkAuthStatus() {
    const response = await fetch(`${API_BASE_URL}/auth/status`, {
        credentials: 'include',
    });
    return response.json();
}

export async function completeProfile(data: {
    name: string;
    age: number;
    fitnessLevel: string;
    goals: string;
}) {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    return response.json();
} 