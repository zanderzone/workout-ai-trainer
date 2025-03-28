'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const returnUrl = searchParams.get('returnUrl') || '/dashboard';
    const error = searchParams.get('error');
    
    console.log('Auth callback received:', {
      hasToken: !!token,
      returnUrl,
      error
    });

    if (error) {
      console.error('Auth error:', error);
      router.push(`/login?error=${error}`);
      return;
    }
    
    if (token) {
      console.log('Token found, storing in localStorage');
      try {
        // Store the token
        localStorage.setItem('token', token);
        console.log('Token stored successfully');
        
        // Add a small delay to ensure localStorage is updated
        setTimeout(() => {
          console.log('Redirecting to:', returnUrl);
          router.push(returnUrl);
        }, 100);
      } catch (error) {
        console.error('Error storing token:', error);
        router.push('/login?error=token_storage_failed');
      }
    } else {
      console.log('No token found, redirecting to login with error');
      router.push('/login?error=auth_failed');
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Completing authentication...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  );
} 