import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle, FileText, Calendar, Trash2 } from 'lucide-react';
import jobsService, { type ApplicationDto } from '../../services/jobsService';

// Define types for our application data
// Legacy types removed

// Removed legacy Application interface; using ApplicationCard mapped from backend

type ApplicationCard = {
  id: number;
  jobTitle: string;
  company: string;
  applicationDate: string;
  status: string;
  timeline: { stage: string; date: string | null; status: string; feedback?: string }[];
};

const SelectionView: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationCard[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso || '';
      return d.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return iso || '';
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data: ApplicationDto[] = await jobsService.listApplications();
        if (!mounted) return;
        const mapped: ApplicationCard[] = data.map((a) => ({
          id: a.id,
          jobTitle: a.job?.title_job || 'Job',
          company: 'Empresa',
          applicationDate: a.created_at || '',
          status: a.status,
          timeline: a.timeline.map(t => ({
            stage: t.name,
            date: t.date || null,
            status: t.status,
            feedback: t.feedback || undefined,
          })),
        }));
        setApplications(mapped);
      } catch (e) {
        setError('No se pudieron cargar tus aplicaciones');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Helper function to render status icon
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={18} className="status-icon completed" />;
      case 'in_progress':
        return <Clock size={18} className="status-icon in-progress" />;
      case 'scheduled':
        return <Calendar size={18} className="status-icon scheduled" />;
      case 'rejected':
        return <XCircle size={18} className="status-icon rejected" />;
      default:
        return <AlertCircle size={18} className="status-icon pending" />;
    }
  };

  // Helper function to get application status badge (dark theme)
  const getStatusBadge = (status: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'accepted' || normalized === 'completed') {
      return { text: 'Finalizado', className: 'tag tag-success' };
    }
    if (normalized === 'rejected') {
      return { text: 'Descartado', className: 'tag tag-danger' };
    }
    // in_progress, scheduled, in_review, pending
    return { text: 'En proceso', className: 'tag tag-info' };
  };

  return (
    <div className="selection-view-page">
      <div className="selection-view-header" style={{ textAlign: 'center' }}>
        <h1>Tus postulaciones</h1>
        <p>Sigue el progreso de tus postulaciones</p>
      </div>

      <div className="applications-container">
        {loading && (
          <div className="loading">Cargando aplicaciones...</div>
        )}
        {error && !loading && (
          <div className="error">{error}</div>
        )}
        {applications.map(application => {
          const statusBadge = getStatusBadge(application.status);
          const translateStageName = (name: string) => {
            const n = (name || '').toLowerCase();
            if (n === 'application') return 'postulación';
            if (n === 'interview') return 'entrevista';
            if (n === 'test') return 'prueba';
            if (n === 'result') return 'resultado';
            return name;
          };
          
          return (
            <div key={application.id} className="application-card">
              <div className="card-actions-bottom-right">
                <button
                  className="btn-icon danger"
                  title={deletingId === application.id ? 'Eliminando...' : 'Eliminar aplicación'}
                  disabled={deletingId === application.id}
                  onClick={async () => {
                    if (!confirm('¿Eliminar esta postulación?')) return;
                    try {
                      setDeletingId(application.id);
                      await jobsService.deleteApplication(application.id);
                      setApplications(prev => prev.filter(a => a.id !== application.id));
                    } catch (e) {
                      alert('No se pudo eliminar la postulación');
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="application-header">
                <div>
                  <h2>{application.jobTitle}</h2>
                  <p className="company-name">{application.company}</p>
                </div>
                <span className={statusBadge.className}>{statusBadge.text}</span>
              </div>

              <div className="application-meta">
                <div className="meta-item">
                  <FileText size={16} />
                  <span>Aplicado: {formatDate(application.applicationDate)}</span>
                </div>
              </div>

              <div className="timeline-container">
                <h3>Línea de tiempo de la postulación</h3>
                <div className="timeline">
                  {application.timeline.map((step, index) => (
                    <div key={index} className={`timeline-item ${step.status}`}>
                      <div className="timeline-icon">
                        {renderStatusIcon(step.status)}
                      </div>
                      <div className="timeline-content">
                        <h4>{translateStageName(step.stage)}</h4>
                        {step.date && <p>{formatDate(step.date)}</p>}
                        {step.feedback && (
                          <p className="feedback">
                            {/^https?:\/\//i.test(step.feedback)
                              ? (<a href={step.feedback} target="_blank" rel="noreferrer">{step.feedback}</a>)
                              : step.feedback}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SelectionView; 