'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectPath?: string;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export default function ProtectedRoute({
  children,
  redirectPath = "/login",
  fallback,
  requireAuth = true,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, error } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectPath);
        return;
      }

      if (!requireAuth && isAuthenticated) {
        router.push("/dashboard");
        return;
      }
    }
  }, [isLoading, isAuthenticated, router, redirectPath, requireAuth]);

  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return <>{children}</>;
} 