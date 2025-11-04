import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { uploadCV } from '../services/cvService';
import adminService from '../services/adminService';

const Home: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<Array<{ job: { id: number; title_job: string; description: string }, similarity_percent: number | null }>>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [candidate, setCandidate] = useState({ name: '', email: '', celular: '' } as { name: string; email: string; celular: string; identity_document?: string });
  const canSubmitCandidate = useMemo(() => !!selectedJobId && candidate.name.trim() && candidate.email.trim() && candidate.celular.trim(), [selectedJobId, candidate]);
  
  const handleFileUpload = () => {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    fileInput.multiple = false;
    
    // Trigger click event to open file dialog
    fileInput.click();
    
    // Handle file selection
    fileInput.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        console.log('Selected file:', file.name);
        
        // Check if file is PDF
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          setUploadStatus({
            success: false,
            message: 'Por favor, seleccione un archivo PDF.'
          });
          return;
        }
        
        // Upload file to backend
        await uploadFile(file);
      }
    };
  };
  
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadStatus(null);
    
    try {
      // Use the CV service to upload the file
      const response = await uploadCV(file);
      
      // Handle success
      setUploadStatus({
        success: true,
        message: `CV procesado con éxito! ${response.chunks} secciones analizadas.`
      });
      setUploadedFilename(response.filename);
      // Fetch matches for admin workflow
      try {
        const matches = await adminService.matchJobsFromCv(response.filename);
        setMatchResults(matches.filter(m => (m.similarity_percent ?? 0) >= 80));
      } catch {}
    } catch (error) {
      // Handle error
      console.error('Upload error:', error);
      setUploadStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Error al subir el CV. Por favor, intente nuevamente.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="home-content">
        <h1 className="welcome-title" style={{ textAlign: 'center' }}>Inserte su CV</h1>
        <p className="welcome-subtitle" style={{ textAlign: 'center' }}>Solo archivos PDF.</p>
        
        <button 
          className={`modern-upload-button ${isUploading ? 'uploading' : ''}`}
          onClick={handleFileUpload}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={isUploading}
        >
          <div className="button-content">
            <div className={`plus-icon ${isHovered ? 'rotate' : ''}`}>
              <Plus size={24} />
            </div>
          </div>
        </button>
        
        {uploadStatus && (
          <div className={`upload-status ${uploadStatus.success ? 'success' : 'error'}`} style={{ marginTop: 16, textAlign: 'center' }}>
            {uploadStatus.message}
          </div>
        )}
        
        {isUploading && (
          <div className="upload-progress" style={{ marginTop: 8, textAlign: 'center' }}>
            Procesando su CV...
          </div>
        )}

        {!!uploadedFilename && (
          <div className="home-matches-section">
            <h2 className="home-section-title">Coincidencias (≥ 80%)</h2>
            <div className="home-match-list">
              {matchResults.length === 0 && <div className="home-muted">No hay vacantes con ≥ 80% por ahora.</div>}
              {matchResults.map(({ job, similarity_percent }) => (
                <div key={job.id} className={`match-card ${selectedJobId === job.id ? 'selected' : ''}`} onClick={() => setSelectedJobId(job.id)}>
                  <div className="match-info">
                    <div className="match-title">{job.title_job}</div>
                    <div className="match-sub">Similitud: {similarity_percent ?? '—'}%</div>
                  </div>
                  <input type="radio" checked={selectedJobId === job.id} onChange={() => setSelectedJobId(job.id)} />
                </div>
              ))}
            </div>

            {selectedJobId && (
              <div className="home-card home-candidate-card">
                <h3 className="home-card-title">Cargar datos del postulante</h3>
                <div className="form-row"><label>Nombre</label><input value={candidate.name} onChange={(e) => setCandidate({ ...candidate, name: e.target.value })} /></div>
                <div className="form-row"><label>Email</label><input value={candidate.email} onChange={(e) => setCandidate({ ...candidate, email: e.target.value })} /></div>
                <div className="form-row"><label>Celular</label><input value={candidate.celular} onChange={(e) => setCandidate({ ...candidate, celular: e.target.value })} /></div>
                <div className="form-actions" style={{ marginTop: 12 }}>
                  <button className="btn-gradient" disabled={!canSubmitCandidate} onClick={async () => {
                    if (!uploadedFilename || !selectedJobId) return;
                    try {
                      await adminService.createApplicationFromCv({ filename: uploadedFilename, job_id: selectedJobId, candidate: { name: candidate.name, email: candidate.email, celular: candidate.celular } });
                      setCandidate({ name: '', email: '', celular: '' });
                      alert('Postulación creada');
                    } catch {
                      alert('No se pudo crear la postulación');
                    }
                  }}>Asignar a vacante</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 