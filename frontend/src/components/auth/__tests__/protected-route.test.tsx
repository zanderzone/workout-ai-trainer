import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../protected-route';
import { checkAuthStatus } from '@/lib/api';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock API
jest.mock('@/lib/api', () => ({
  checkAuthStatus: jest.fn(),
}));

describe('ProtectedRoute', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    (checkAuthStatus as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', async () => {
    (checkAuthStatus as jest.Mock).mockResolvedValue({ isAuthenticated: false });
    
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
    (checkAuthStatus as jest.Mock).mockResolvedValue({ isAuthenticated: true });
    
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
    (checkAuthStatus as jest.Mock).mockResolvedValue({ isAuthenticated: false });
    
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
    (checkAuthStatus as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(
      <ProtectedRoute fallback={<div>Custom Loading...</div>}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
  });

  it('should show error message when auth check fails', async () => {
    (checkAuthStatus as jest.Mock).mockRejectedValue(new Error('Auth failed'));
    
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
    (checkAuthStatus as jest.Mock).mockResolvedValue({ isAuthenticated: true });
    
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