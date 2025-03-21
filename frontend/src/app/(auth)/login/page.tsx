'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { loginWithGoogle, loginWithApple } from '@/lib/api';

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
        <p className="mt-2 text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:text-primary/80">
            Complete your profile
          </Link>
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={loginWithGoogle}
        >
          <Image src="/google.svg" alt="Google" width={18} height={18} />
          Sign in with Google
        </Button>

        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={loginWithApple}
        >
          <Image src="/apple.svg" alt="Apple" width={18} height={18} />
          Sign in with Apple
        </Button>
      </div>
    </div>
  );
} 