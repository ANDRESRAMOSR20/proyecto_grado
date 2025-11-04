import React, { useState } from 'react';
import { User, Phone, Upload } from 'lucide-react';
import { saveUserProfile } from '../services/userProfileService';
import { uploadCV } from '../services/cvService';

interface InitialSetupProps {
  onComplete: (userData: { fullname: string, celular: string }) => void;
}

const InitialSetup: React.FC<InitialSetupProps> = ({ onComplete }) => {
  const [fullname, setFullname] = useState('');
  const [celular, setCelular] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Verificar que sea un archivo PDF
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Por favor, seleccione un archivo PDF');
        return;
      }
      
      setSelectedFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validaciones básicas
    if (!fullname.trim()) {
      setError('Por favor, ingrese su nombre completo');
      return;
    }
    
    if (!celular.trim()) {
      setError('Por favor, ingrese su número de celular');
      return;
    }
    
    if (!selectedFile) {
      setError('Por favor, suba su CV en formato PDF');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Obtener el ID del usuario del localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        throw new Error('No se encontró información del usuario');
      }
      
      const user = JSON.parse(storedUser);
      const userId = user.id;
      
      // Subir el CV primero para obtener el identificador/nombre
      const uploadResult = await uploadCV(selectedFile);
      const resumeFilename = uploadResult.filename || null;

      // Guardar el perfil del usuario incluyendo el resume_pdf
      await saveUserProfile(userId, { fullname, celular, resume_pdf: resumeFilename });
      
      // Actualizar el objeto de usuario en localStorage
      const updatedUser = {
        ...user,
        fullname,
        celular,
        resume_pdf: resumeFilename
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Llamar a la función de completado con los datos del usuario
      onComplete({ fullname, celular });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar los datos. Por favor, intente nuevamente.');
    } finally {
      setIsUploading(false);
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
          <h2>Completar perfil</h2>
          <p>Por favor complete su información para continuar</p>
        </div>

        {error && (
          <div className="error-message general">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullname">Nombre completo</label>
            <div className="input-container">
              <User size={18} className="input-icon" />
              <input
                type="text"
                id="fullname"
                placeholder="Ingrese su nombre completo"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="celular">Número de celular</label>
            <div className="input-container">
              <Phone size={18} className="input-icon" />
              <input
                type="tel"
                id="celular"
                placeholder="Ingrese su número de celular"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cv">Curriculum Vitae (CV)</label>
            <div className="input-container">
              <label htmlFor="cv-file" className="modern-upload-button">
                <div className="button-content">
                  <div className="plus-icon"><Upload size={18} /></div>
                  <span className="button-text">{selectedFile ? selectedFile.name : 'Seleccionar PDF'}</span>
                </div>
              </label>
              <input
                type="file"
                id="cv-file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="cv-file-input"
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="loading-spinner"></div>
            ) : (
              'Guardar y continuar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InitialSetup;