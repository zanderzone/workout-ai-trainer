import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import RegisterPage from '../page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock jwt-decode
jest.mock('jwt-decode', () => {
  return {
    __esModule: true,
    default: jest.fn()
  };
});

// Mock the API call
jest.mock('@/lib/api', () => ({
  completeProfile: jest.fn(),
}));

describe('RegisterPage', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockSearchParams = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useSearchParams as any).mockReturnValue(mockSearchParams);
    const jwtDecode = require('jwt-decode');
    jwtDecode.default.mockReset();
  });

  it('should redirect to login if no token is present', () => {
    mockSearchParams.get.mockReturnValue(null);
    render(<RegisterPage />);
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('should display user name when valid token is provided', () => {
    const mockToken = 'valid-token';
    const mockDecodedToken = {
      name: 'John Doe',
      email: 'john@example.com',
      sub: '123',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    };

    mockSearchParams.get.mockReturnValue(mockToken);
    const jwtDecode = require('jwt-decode');
    jwtDecode.default.mockReturnValue(mockDecodedToken);

    render(<RegisterPage />);
    expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
  });

  it('should handle expired token', () => {
    const mockToken = 'expired-token';
    const mockDecodedToken = {
      name: 'John Doe',
      email: 'john@example.com',
      sub: '123',
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    };

    mockSearchParams.get.mockReturnValue(mockToken);
    const jwtDecode = require('jwt-decode');
    jwtDecode.default.mockReturnValue(mockDecodedToken);

    render(<RegisterPage />);
    expect(screen.getByText('Your session has expired. Please log in again.')).toBeInTheDocument();
  });

  it('should handle invalid token', () => {
    const mockToken = 'invalid-token';
    mockSearchParams.get.mockReturnValue(mockToken);
    const jwtDecode = require('jwt-decode');
    jwtDecode.default.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    render(<RegisterPage />);
    expect(screen.getByText('Invalid authentication token. Please log in again.')).toBeInTheDocument();
  });

  it('should handle form submission successfully', async () => {
    const mockToken = 'valid-token';
    const mockDecodedToken = {
      name: 'John Doe',
      email: 'john@example.com',
      sub: '123',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    mockSearchParams.get.mockReturnValue(mockToken);
    const jwtDecode = require('jwt-decode');
    jwtDecode.default.mockReturnValue(mockDecodedToken);

    render(<RegisterPage />);

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/age range/i), {
      target: { value: '25-34' },
    });
    fireEvent.change(screen.getByLabelText(/sex/i), {
      target: { value: 'male' },
    });
    fireEvent.change(screen.getByLabelText(/fitness level/i), {
      target: { value: 'beginner' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle form submission error', async () => {
    const mockToken = 'valid-token';
    const mockDecodedToken = {
      name: 'John Doe',
      email: 'john@example.com',
      sub: '123',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    mockSearchParams.get.mockReturnValue(mockToken);
    const jwtDecode = require('jwt-decode');
    jwtDecode.default.mockReturnValue(mockDecodedToken);

    // Mock API error
    const { completeProfile } = await import('@/lib/api');
    (completeProfile as any).mockRejectedValue(new Error('API Error'));

    render(<RegisterPage />);

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/age range/i), {
      target: { value: '25-34' },
    });
    fireEvent.change(screen.getByLabelText(/sex/i), {
      target: { value: 'male' },
    });
    fireEvent.change(screen.getByLabelText(/fitness level/i), {
      target: { value: 'beginner' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to complete profile. Please try again.')).toBeInTheDocument();
    });
  });
}); 