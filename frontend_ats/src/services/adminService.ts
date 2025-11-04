import authService from './authService';

export interface AdminApplicationDto {
  id: number;
  user: { id: number | null; email: string | null; name: string | null } | null;
  job: { id: number; title_job: string; description: string } | null;
  status: string;
  created_at?: string | null;
  timeline: Array<{
    name: 'application' | 'preselection' | 'interview' | 'test' | 'result' | string;
    status: 'pending' | 'in_progress' | 'scheduled' | 'completed' | 'rejected' | 'accepted' | string;
    date?: string | null;
    feedback?: string | null;
  }>;
}

const API_URL = '/api/admin';

export const adminService = {
  async listApplications(): Promise<AdminApplicationDto[]>{
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/applications`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Failed to load admin applications');
    return res.json();
  },

  async updateStage(applicationId: number, payload: { name: string; status: string; date?: string; feedback?: string }): Promise<{ success: boolean }>{
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/applications/${applicationId}/stage`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update stage');
    return res.json();
  },

  async updateApplicationStatus(applicationId: number, payload: { status: string }): Promise<{ success: boolean }>{
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/applications/${applicationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update application status');
    return res.json();
  },

  // Jobs CRUD
  async listJobs() {
    const token = authService.getToken();
    const res = await fetch(`/api/admin/jobs`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Failed to load jobs');
    return res.json();
  },

  async createJob(payload: { title_job: string; description: string; perfil_ideal?: string; posted_date?: string }){
    const token = authService.getToken();
    const res = await fetch(`/api/admin/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create job');
    return res.json();
  },

  async updateJob(jobId: number, payload: { title_job?: string; description?: string; perfil_ideal?: string | null; posted_date?: string | null }){
    const token = authService.getToken();
    const res = await fetch(`/api/admin/jobs/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update job');
    return res.json();
  },

  async deleteJob(jobId: number){
    const token = authService.getToken();
    const res = await fetch(`/api/admin/jobs/${jobId}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Failed to delete job');
    return res.json();
  },

  async matchJobsFromCv(filename: string): Promise<Array<{ job: { id: number; title_job: string; description: string }; similarity_percent: number | null }>>{
    const token = authService.getToken();
    const res = await fetch(`/api/admin/cv/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ filename }),
    });
    if (!res.ok) throw new Error('Failed to match jobs from CV');
    return res.json();
  },

  async createApplicationFromCv(payload: { filename: string; job_id: number; candidate: { name: string; email: string; celular: string; identity_document?: string } }): Promise<{ success: boolean; application_id?: number }>{
    const token = authService.getToken();
    const res = await fetch(`/api/admin/applications/from_cv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create application from CV');
    return res.json();
  }
};

export default adminService;

