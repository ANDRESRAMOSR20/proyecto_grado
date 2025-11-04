import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, FileText } from 'lucide-react';
import authService from '../services/authService';

interface SignUpProps {
  onSignUp: (userData: any) => void;
  onNavigateToSignIn: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSignUp, onNavigateToSignIn }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [identityDocument, setIdentityDocument] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await authService.signUp({
        name,
        email,
        password,
        identity_document: identityDocument
      });

      if (response.success && response.user) {
        // If registration is successful, automatically sign in the user
        if (response.access_token) {
          authService.setToken(response.access_token, true);
        }
        onSignUp(response.user);
      } else {
        setError(response.message || 'Registration failed');
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
          <h2>Crear una cuenta</h2>
          <p>Regístrese para comenzar con Talent Workspace</p>
        </div>

        {error && (
          <div className="error-message general">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre</label>
            <div className="input-container">
              <User size={18} className="input-icon" />
              <input
                type="text"
                id="name"
                placeholder="Ingrese su nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

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
            <label htmlFor="identity-document">Documento de identidad</label>
            <div className="input-container">
              <FileText size={18} className="input-icon" />
              <input
                type="text"
                id="identity-document"
                placeholder="Ingrese su número de identificación"
                value={identityDocument}
                onChange={(e) => setIdentityDocument(e.target.value)}
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
                placeholder="Cree una contraseña"
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

          <div className="form-group">
            <label htmlFor="confirm-password">Confirmar contraseña</label>
            <div className="input-container">
              <Lock size={18} className="input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm-password"
                placeholder="Confirme su contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              'Registrarse'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ¿Ya tiene una cuenta?{' '}
            <a href="#" className="link-button" onClick={onNavigateToSignIn}>
              Iniciar sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 