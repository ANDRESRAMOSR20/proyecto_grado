import React, { useEffect, useState } from 'react';
import { User, Phone, Upload } from 'lucide-react';
import { saveUserProfile, getUserProfile } from '../services/userProfileService';
import { uploadCV } from '../services/cvService';

const Profile: React.FC = () => {
  const breadcrumbs: Array<{ label: string; active: boolean }> = [
    { label: '', active: true }
  ];

  const [fullname, setFullname] = useState('');
  const [celular, setCelular] = useState('');
  const [resumeFilename, setResumeFilename] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setFullname(user.fullname || '');
      setCelular(user.celular || '');
      setResumeFilename(user.resume_pdf || null);
      // Fetch latest profile from backend
      getUserProfile(user.id).then((res) => {
        if (res.success && res.has_profile && res.profile) {
          setFullname(res.profile.fullname || '');
          setCelular(res.profile.celular || '');
          setResumeFilename(res.profile.resume_pdf || null);
        }
      }).catch(() => {});
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Por favor, seleccione un archivo PDF');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSaving(true);
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) throw new Error('Usuario no encontrado');
      const user = JSON.parse(storedUser);

      let newResume = resumeFilename;
      if (selectedFile) {
        const uploadResult = await uploadCV(selectedFile);
        newResume = uploadResult.filename || null;
      }

      const result = await saveUserProfile(user.id, {
        fullname,
        celular,
        resume_pdf: newResume ?? undefined,
      });

      if (result.success && result.profile) {
        setMessage('Perfil actualizado correctamente');
        setResumeFilename(result.profile.resume_pdf || newResume || null);
        // Update local user cache
        const updatedUser = { ...user, fullname, celular, resume_pdf: newResume };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        throw new Error(result.message || 'No se pudo actualizar el perfil');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="header">
        <div className="breadcrumbs">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className={`breadcrumb ${crumb.active ? 'active' : ''}`}>
              {crumb.label}
              {index < breadcrumbs.length - 1 && ' > '}
            </span>
          ))}
        </div>
        <h1>Perfil</h1>
      </div>
      
      <div className="auth-card" style={{ maxWidth: 700 }}>
        {error && <div className="error-message general">{error}</div>}
        {message && <div className="btn-secondary" style={{ marginBottom: 16 }}>{message}</div>}
        <form className="auth-form" onSubmit={handleSave}>
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
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cv">Actualizar Curriculum (CV)</label>
            <div className="input-container">
              <label htmlFor="cv-file" className="modern-upload-button">
                <div className="button-content">
                  <div className="plus-icon"><Upload size={18} /></div>
                  <span className="button-text">{selectedFile ? selectedFile.name : (resumeFilename || 'Seleccionar PDF')}</span>
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

          <button type="submit" className="auth-button" disabled={isSaving}>
            {isSaving ? <div className="loading-spinner"></div> : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;