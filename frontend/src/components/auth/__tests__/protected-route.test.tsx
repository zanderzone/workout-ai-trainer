import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../protected-route';
import { checkAuthStatus } from '@/lib/api';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock API
vi.mock('@/lib/api', () => ({
  checkAuthStatus: vi.fn(),
}));

describe('ProtectedRoute', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  beforeEach(() => {
    (useRouter as any).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    (checkAuthStatus as any).mockImplementation(() => new Promise(() => {}));
    
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', async () => {
    (checkAuthStatus as any).mockResolvedValue({ isAuthenticated: false });
    
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  it('should show protected content when authenticated', async () => {
    (checkAuthStatus as any).mockResolvedValue({ isAuthenticated: true });
    
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('should use custom redirect path', async () => {
    (checkAuthStatus as any).mockResolvedValue({ isAuthenticated: false });
    
    render(
      <ProtectedRoute redirectPath="/custom-login">
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/custom-login');
    });
  });

  it('should show custom fallback component', () => {
    (checkAuthStatus as any).mockImplementation(() => new Promise(() => {}));
    
    render(
      <ProtectedRoute fallback={<div>Custom Loading...</div>}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
  });

  it('should show error message when auth check fails', async () => {
    (checkAuthStatus as any).mockRejectedValue(new Error('Auth failed'));
    
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Authentication check failed. Please try again.')).toBeInTheDocument();
    });
  });

  it('should redirect to dashboard when authenticated and requireAuth is false', async () => {
    (checkAuthStatus as any).mockResolvedValue({ isAuthenticated: true });
    
    render(
      <ProtectedRoute requireAuth={false}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });
}); 