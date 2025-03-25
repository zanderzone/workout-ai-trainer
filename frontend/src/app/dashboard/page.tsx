'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<{ email: string } | null>(null);

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // TODO: Fetch user data from backend
        // For now, we'll just show a basic welcome message
        setUser({ email: 'User' });
    }, [router]);

    const handleSignOut = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Loading...</h1>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold">Workout AI Trainer</h1>
                        </div>
                        <div className="flex items-center">
                            <Button
                                variant="outline"
                                onClick={handleSignOut}
                            >
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">Welcome, {user.email}!</h2>
                        <p className="text-gray-700">
                            Your dashboard is coming soon. Here you'll be able to:
                        </p>
                        <ul className="mt-4 list-disc list-inside text-gray-700">
                            <li>View your workout history</li>
                            <li>Generate new workouts</li>
                            <li>Track your progress</li>
                            <li>Manage your profile</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
} 