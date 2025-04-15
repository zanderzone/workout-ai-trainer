/**
 * page.test.tsx
 * Comprehensive tests for the registration page component
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { completeProfile } from '@/lib/api';
import RegisterPage from '../page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn()
}));

jest.mock('@/lib/api', () => ({
  completeProfile: jest.fn().mockResolvedValue({})
}));

// Test constants
const MOCK_TOKEN = 'valid-mock-token';
const MOCK_USER = {
  name: 'Test User',
  email: 'test@example.com',
  sub: '123',
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
};

// Test utilities
const generateMockToken = (expired = false) => {
  return {
    token: MOCK_TOKEN,
    decoded: {
      ...MOCK_USER,
      exp: expired 
        ? Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
        : Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    }
  };
};

const setupMocks = (options = {}) => {
  const {
    token = MOCK_TOKEN,
    decodedToken = MOCK_USER,
    throwTokenError = false,
    apiError = null
  } = options;

  // Setup router mock
  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };
  (useRouter as jest.Mock).mockReturnValue(router);

  // Setup search params mock
  const searchParams = {
    get: jest.fn(param => param === 'token' ? token : null),
  };
  (useSearchParams as jest.Mock).mockReturnValue(searchParams);

  // Setup token decoder mock
  if (throwTokenError) {
    (jwtDecode as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });
  } else {
    (jwtDecode as jest.Mock).mockReturnValue(decodedToken);
  }

  // Setup API mock
  if (apiError) {
    (completeProfile as jest.Mock).mockRejectedValue(new Error(apiError));
  } else {
    (completeProfile as jest.Mock).mockResolvedValue({});
  }

  // Setup localStorage mock
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true
  });

  return {
    router,
    searchParams,
    mockJwtDecode: jwtDecode,
    mockCompleteProfile: completeProfile,
    localStorage: window.localStorage,
  };
};

// Custom render function
const renderComponent = (options = {}) => {
  const mocks = setupMocks(options);
  const rendered = render(<RegisterPage />);
  return {
    ...rendered,
    ...mocks
  };
};

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication & Authorization', () => {
    it('should display user name from decoded token', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(`Welcome, ${MOCK_USER.name}!`)).toBeInTheDocument();
      });
    });
    
    it('should redirect to login if no token is present', async () => {
      const { router } = renderComponent({ token: null });
      
      await waitFor(() => {
        expect(router.push).toHaveBeenCalledWith('/login');
      });
    });
  
    it('should redirect to login with invalid token', async () => {
      const { router } = renderComponent({ throwTokenError: true });
      
      await waitFor(() => {
        expect(screen.getByText('Invalid authentication token. Please log in again.')).toBeInTheDocument();
        expect(router.push).toHaveBeenCalledWith('/login');
      });
    });
    
    it('should redirect to login with expired token', async () => {
      const { token, decoded } = generateMockToken(true); // Expired token
      const { router } = renderComponent({ token, decodedToken: decoded });
      
      await waitFor(() => {
        expect(screen.getByText('Your session has expired. Please log in again.')).toBeInTheDocument();
        expect(router.push).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Form Navigation', () => {
    it('should render the basic information form initially', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
      });
    });

    it('should navigate between form steps', async () => {
      renderComponent();
      
      // Basic Info step
      const ageSelect = await screen.findByLabelText(/age range/i);
      const sexSelect = await screen.findByLabelText(/sex/i);
      const nextButton = await screen.findByRole('button', { name: /next/i });
      
      // Fill basic info and proceed
      await act(async () => {
        fireEvent.change(ageSelect, { target: { value: '25-34' } });
        fireEvent.change(sexSelect, { target: { value: 'male' } });
        fireEvent.click(nextButton);
      });
      
      // Should be on Fitness step
      await waitFor(() => {
        expect(screen.getByLabelText(/fitness level/i)).toBeInTheDocument();
      });
      
      // Fill fitness info and proceed
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/fitness level/i), {
          target: { value: 'beginner' },
        });
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });
      
      // Go back to previous step
      const prevButton = screen.getByRole('button', { name: /previous/i });
      await act(async () => {
        fireEvent.click(prevButton);
      });
      
      // Should be back on Basic Info step
      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields in basic step', async () => {
      renderComponent();
      
      // Wait for the form to load
      const nextButton = await screen.findByRole('button', { name: /next/i });
      
      // Try to submit without filling required fields - Next button should be disabled
      expect(nextButton).toBeDisabled();
      
      // Fill one required field
      const ageSelect = screen.getByLabelText(/age range/i);
      await act(async () => {
        fireEvent.change(ageSelect, { target: { value: '25-34' } });
      });
      
      // Button should still be disabled with one field filled
      expect(nextButton).toBeDisabled();
      
      // Fill the other required field
      const sexSelect = screen.getByLabelText(/sex/i);
      await act(async () => {
        fireEvent.change(sexSelect, { target: { value: 'male' } });
      });
      
      // Now the button should be enabled
      await waitFor(() => {
        expect(nextButton).not.toBeDisabled();
      });
    });
  });

  describe('Form Data Persistence', () => {
    it('should store form data in localStorage', async () => {
      const { localStorage } = renderComponent();
      
      // Fill out a field
      const ageSelect = await screen.findByLabelText(/age range/i);
      await act(async () => {
        fireEvent.change(ageSelect, { target: { value: '25-34' } });
      });
      
      // Check localStorage was called
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalled();
      });
      
      // Verify the stored data contains our selection
      const calls = (localStorage.setItem as jest.Mock).mock.calls;
      const hasAgeRange = calls.some(call => 
        call[0] === 'registrationFormData' && 
        call[1].includes('"ageRange":"25-34"')
      );
      expect(hasAgeRange).toBeTruthy();
    });
  });

  describe('Form Submission', () => {
    it('should handle successful form submission', async () => {
      const { router } = renderComponent();
      
      // Fill basic info
      const ageSelect = await screen.findByLabelText(/age range/i);
      const sexSelect = await screen.findByLabelText(/sex/i);
      
      await act(async () => {
        fireEvent.change(ageSelect, { target: { value: '25-34' } });
        fireEvent.change(sexSelect, { target: { value: 'male' } });
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });
      
      // Fill fitness info
      await waitFor(() => {
        expect(screen.getByLabelText(/fitness level/i)).toBeInTheDocument();
      });
      
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/fitness level/i), {
          target: { value: 'beginner' },
        });
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });
      
      // Skip to review step
      await act(async () => {
        (window as any).setStep('review');
      });
      
      // Find and click the register button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
      });
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /register/i }));
      });
      
      // Should redirect to dashboard
      await waitFor(() => {
        expect(router.push).toHaveBeenCalledWith('/dashboard');
      });
    });
    
    it('should handle form submission error', async () => {
      renderComponent({ apiError: 'API Error' });
      
      // Fill basic info
      const ageSelect = await screen.findByLabelText(/age range/i);
      const sexSelect = await screen.findByLabelText(/sex/i);
      
      await act(async () => {
        fireEvent.change(ageSelect, { target: { value: '25-34' } });
        fireEvent.change(sexSelect, { target: { value: 'male' } });
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });
      
      // Fill fitness info
      await waitFor(() => {
        expect(screen.getByLabelText(/fitness level/i)).toBeInTheDocument();
      });
      
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/fitness level/i), {
          target: { value: 'beginner' },
        });
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });
      
      // Skip to review step
      await act(async () => {
        (window as any).setStep('review');
      });
      
      // Find and click the register button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
      });
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /register/i }));
      });
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });
    });
  });
}); 