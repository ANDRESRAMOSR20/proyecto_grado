import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import authService from '../services/authService';

interface SignInProps {
  onSignIn: (userData: any) => void;
  onNavigateToSignUp: () => void;
}

const SignIn: React.FC<SignInProps> = ({ onSignIn, onNavigateToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.signIn({ email, password });

      if (response.success && response.access_token && response.user) {
        // Store token based on remember me preference
        authService.setToken(response.access_token, rememberMe);
        onSignIn(response.user);
      } else {
        setError(response.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Failed to connect to the server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <span className="logo-text">Talent</span>
            <span className="workspace-text">workspace</span>
            <div className="logo-icon">AI</div>
          </div>
          <h2>Bienvenido</h2>
          <p>Inicie sesión para continuar</p>
        </div>

        {error && (
          <div className="error-message general">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <div className="input-container">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                id="email"
                placeholder="Ingrese su correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-container">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkmark"></span>
              Recordarme
            </label>
            <a href="#" className="link-button">¿Olvidó su contraseña?</a>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ¿No tiene una cuenta?{' '}
            <a href="#" className="link-button" onClick={onNavigateToSignUp}>
              Registrarse
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn; 