interface SignInRequest {
  email: string;
  password: string;
}

interface SignUpRequest {
  name: string;
  email: string;
  password: string;
  identity_document: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  access_token?: string;
  token_type?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
  };
}

// Base API URL - adjust based on your backend configuration
const API_URL = '/api';

export const authService = {
  /**
   * Sign in a user
   */
  signIn: async (credentials: SignInRequest): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      return await response.json();
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        message: 'Failed to connect to authentication server',
      };
    }
  },

  /**
   * Register a new user
   */
  signUp: async (userData: SignUpRequest): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      return await response.json();
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        message: 'Failed to connect to authentication server',
      };
    }
  },

  /**
   * Check if the user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken') || !!sessionStorage.getItem('authToken');
  },

  /**
   * Get the authentication token
   */
  getToken: (): string | null => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  },

  /**
   * Store the authentication token
   */
  setToken: (token: string, rememberMe: boolean): void => {
    if (rememberMe) {
      localStorage.setItem('authToken', token);
    } else {
      sessionStorage.setItem('authToken', token);
    }
  },

  /**
   * Remove the authentication token
   */
  removeToken: (): void => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  },
};

export default authService; 