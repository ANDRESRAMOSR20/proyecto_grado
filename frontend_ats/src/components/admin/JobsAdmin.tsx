import React, { useEffect, useMemo, useState } from 'react';
import adminService from '../../services/adminService';

interface EditableJob {
  id?: number;
  title_job: string;
  description: string;
  perfil_ideal?: string | null;
  posted_date?: string;
}

function formatForDatetimeLocal(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  } catch {
    return '';
  }
}

const JobsAdmin: React.FC = () => {
  const [jobs, setJobs] = useState<EditableJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<EditableJob>({ title_job: '', description: '', perfil_ideal: '', posted_date: '' });

  const canCreate = useMemo(() => form.title_job.trim().length > 2 && form.description.trim().length > 5, [form]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.listJobs();
      const normalized = (data as EditableJob[]).map(j => ({
        ...j,
        posted_date: formatForDatetimeLocal(j.posted_date),
      }));
      setJobs(normalized);
    } catch (e) {
      setError('No se pudieron cargar las vacantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createJob = async () => {
    if (!canCreate) return;
    try {
      await adminService.createJob({ title_job: form.title_job, description: form.description, perfil_ideal: form.perfil_ideal || undefined, posted_date: form.posted_date || undefined });
      setForm({ title_job: '', description: '', perfil_ideal: '', posted_date: '' });
      await load();
    } catch (e) {
      alert('No se pudo crear la vacante');
    }
  };

  const updateJob = async (job: EditableJob) => {
    if (!job.id) return;
    try {
      await adminService.updateJob(job.id, { title_job: job.title_job, description: job.description, perfil_ideal: job.perfil_ideal ?? null, posted_date: job.posted_date || null });
      await load();
    } catch (e) {
      alert('No se pudo actualizar la vacante');
    }
  };

  const deleteJob = async (jobId?: number) => {
    if (!jobId) return;
    if (!confirm('¿Eliminar esta vacante definitivamente?')) return;
    try {
      await adminService.deleteJob(jobId);
      await load();
    } catch (e) {
      alert('No se pudo eliminar la vacante');
    }
  };

  return (
    <div className="jobs-admin">
      <div className="jobs-admin-header">
        <h1>Publicar vacantes</h1>
        <p>Gestiona ofertas: crea nuevas y edita existentes</p>
      </div>

      {loading && <div className="loading">Cargando...</div>}
      {error && !loading && <div className="error">{error}</div>}

      <div className="jobs-admin-grid">
        <div className="job-form-card">
          <h2>Nueva vacante</h2>
          <div className="form-row">
            <label>Título</label>
            <input
              placeholder="Ej. Desarrollador Frontend"
              value={form.title_job}
              onChange={(e) => setForm({ ...form, title_job: e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>Descripción</label>
            <textarea
              placeholder="Describe responsabilidades, requisitos, beneficios..."
              value={form.description}
              rows={6}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>Perfil ideal (texto usado para preselección)</label>
            <textarea
              placeholder="Ej. 3+ años en React, TypeScript, pruebas unitarias, CI/CD..."
              value={form.perfil_ideal || ''}
              rows={4}
              onChange={(e) => setForm({ ...form, perfil_ideal: e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>Fecha publicación</label>
            <input
              type="datetime-local"
              value={form.posted_date}
              onChange={(e) => setForm({ ...form, posted_date: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button className="btn-gradient" disabled={!canCreate} onClick={createJob}>Publicar</button>
          </div>
        </div>

        <div className="jobs-list">
          <h2>Vacantes publicadas</h2>
          {jobs.map((j) => (
            <div key={j.id} className="job-edit-card">
              <div className="form-row">
                <label>Título</label>
                <input
                  value={j.title_job}
                  onChange={(e) => setJobs(jobs.map(x => x.id === j.id ? { ...x, title_job: e.target.value } : x))}
                />
              </div>
              <div className="form-row">
                <label>Descripción</label>
                <textarea
                  value={j.description}
                  rows={5}
                  onChange={(e) => setJobs(jobs.map(x => x.id === j.id ? { ...x, description: e.target.value } : x))}
                />
              </div>
              <div className="form-row">
                <label>Perfil ideal</label>
                <textarea
                  value={j.perfil_ideal || ''}
                  rows={4}
                  onChange={(e) => setJobs(jobs.map(x => x.id === j.id ? { ...x, perfil_ideal: e.target.value } : x))}
                />
              </div>
              <div className="form-row">
                <label>Fecha publicación</label>
                <input
                  type="datetime-local"
                  value={j.posted_date || ''}
                  onChange={(e) => setJobs(jobs.map(x => x.id === j.id ? { ...x, posted_date: e.target.value } : x))}
                />
              </div>
              <div className="form-actions">
                <button className="btn-outline" onClick={() => updateJob(j)}>Guardar</button>
                <button className="btn-danger" onClick={() => deleteJob(j.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JobsAdmin;

