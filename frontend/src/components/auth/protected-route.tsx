'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAuthStatus } from "@/lib/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function validateAuth() {
      try {
        const { isAuthenticated } = await checkAuthStatus();
        if (!isAuthenticated) {
          router.push("/login");
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }

    validateAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
} 