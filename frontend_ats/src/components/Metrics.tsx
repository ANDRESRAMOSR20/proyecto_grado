import React, { useEffect, useState } from 'react';
import authService from '../services/authService';

const Metrics: React.FC = () => {
  const breadcrumbs = [
    { label: '', active: true }
  ];

  const [summary, setSummary] = useState<any>(null);
  const [plotPerJob, setPlotPerJob] = useState<string>('');
  const [plotResultOutcome, setPlotResultOutcome] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const token = authService.getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {} as any;
    // Fetch summary
    fetch('/api/admin/metrics/summary', { headers })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then(setSummary)
      .catch(() => setError('No se pudieron cargar las métricas'));
    // Fetch plots
    const fetchPlot = (kind: string, setter: (v: string) => void) => {
      fetch(`/api/admin/metrics/plots/${kind}`, { headers })
        .then(async (r) => {
          if (!r.ok) throw new Error(await r.text());
          return r.json();
        })
        .then((d) => setter(d.image_base64 || ''))
        .catch(() => setter(''));
    };
    fetchPlot('per_job_bar', setPlotPerJob);
    fetchPlot('result_outcome_pie', setPlotResultOutcome);
  }, []);

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
        <h1>Métricas</h1>
      </div>
      
      <div className="page-content">
        {!!error && <div className="bulk-actions-bar" style={{ marginBottom: 12 }}><div className="bulk-count">{error}</div></div>}
        {summary && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
            <div className="home-card" style={{ textAlign: 'center', flex: '1 1 220px', minWidth: 220 }}><h3 className="home-card-title">Usuarios</h3><div style={{ fontSize: 24 }}>{summary.totals?.users ?? 0}</div></div>
            <div className="home-card" style={{ textAlign: 'center', flex: '1 1 220px', minWidth: 220 }}><h3 className="home-card-title">Vacantes</h3><div style={{ fontSize: 24 }}>{summary.totals?.jobs ?? 0}</div></div>
            <div className="home-card" style={{ textAlign: 'center', flex: '1 1 220px', minWidth: 220 }}><h3 className="home-card-title">Postulaciones</h3><div style={{ fontSize: 24 }}>{summary.totals?.applications ?? 0}</div></div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))', gap: 24 }}>
          <div className="home-card" style={{ padding: 24 }}><h3 className="home-card-title">Postulaciones por vacante</h3>{plotPerJob ? <img src={plotPerJob} alt="per job" style={{ width: '100%', maxHeight: 520, objectFit: 'contain' }} /> : <div className="home-muted">Sin datos</div>}</div>
          <div className="home-card" style={{ padding: 24 }}><h3 className="home-card-title">Resultados del proceso</h3>{plotResultOutcome ? <img src={plotResultOutcome} alt="result outcome" style={{ width: '100%', maxHeight: 520, objectFit: 'contain' }} /> : <div className="home-muted">Sin datos</div>}</div>
        </div>
      </div>
    </div>
  );
};

export default Metrics; 