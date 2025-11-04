import React, { useEffect, useState } from 'react';
import { Search, Clock } from 'lucide-react';
import jobsService, { type JobDto } from '../../services/jobsService';

const toDisplay = (job: JobDto) => ({
  id: job.id,
  title: job.title_job,
  postedDate: job.posted_date || job.created_at || '',
  description: job.description,
});

const OfferView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const formatPosted = (iso?: string | null) => {
    if (!iso) return '—';
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffDays > 0) return `hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;
    if (diffHours > 0) return `hace ${diffHours} hora${diffHours === 1 ? '' : 's'}`;
    return 'hace unos minutos';
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await jobsService.listJobs();
        if (mounted) setJobs(data);
      } catch (e) {
        setError('No se pudieron cargar las ofertas');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  
  const filteredJobs = jobs
    .map(toDisplay)
    .filter(job => 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
  const toggleJobExpansion = (jobId: number) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
    } else {
      setExpandedJobId(jobId);
    }
  };
  
  return (
    <section className="jobs-section">
      <h1 className="section-title">Oportunidades Disponibles</h1>
      <p className="section-subtitle">Explora nuestras vacantes actuales y encuentra tu próxima oportunidad</p>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por título, empresa o ubicación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button><Search size={18} /></button>
      </div>

      <div className="job-listings">
        {loading && (
          <div className="loading">Cargando ofertas...</div>
        )}
        {error && !loading && (
          <div className="error">{error}</div>
        )}
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => (
            <div key={job.id} className="job-card" onClick={() => toggleJobExpansion(job.id)}>
              <div className="job-header">
                <h2>{job.title}</h2>
              </div>

              <div className="job-info">
                <span><Clock size={14} /> Publicado: {formatPosted(job.postedDate)}</span>
              </div>

              <p className={`job-description ${expandedJobId === job.id ? '' : 'line-clamp-2'}`}>{job.description}</p>
              {expandedJobId === job.id && (
                <button className="apply-btn" onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await jobsService.applyToJob(job.id);
                    alert('Aplicación enviada');
                  } catch (err) {
                    alert('No se pudo aplicar');
                  }
                }}>Postular ahora</button>
              )}
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No hay ofertas que coincidan con tu búsqueda.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default OfferView; 