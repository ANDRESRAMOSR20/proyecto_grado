import authService from './authService';

export interface JobDto {
  id: number;
  title_job: string;
  description: string;
  perfil_ideal?: string | null;
  posted_date?: string | null;
  created_at?: string | null;
}

export interface ApplicationDto {
  id: number;
  job: JobDto;
  status: string;
  created_at?: string | null;
  timeline: Array<{
    name: 'application' | 'interview' | 'test' | 'result' | string;
    status: 'pending' | 'in_progress' | 'scheduled' | 'completed' | 'rejected' | 'accepted' | string;
    date?: string | null;
    feedback?: string | null;
  }>;
}

const API_URL = '/api';

export const jobsService = {
  async listJobs(): Promise<JobDto[]> {
    const res = await fetch(`${API_URL}/jobs`);
    if (!res.ok) throw new Error('Failed to load jobs');
    return res.json();
  },

  async applyToJob(jobId: number): Promise<{ success: boolean; application_id?: number }>{
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ job_id: jobId }),
    });
    if (!res.ok) throw new Error('Failed to apply');
    return res.json();
  },

  async listApplications(): Promise<ApplicationDto[]>{
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/applications`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Failed to load applications');
    return res.json();
  },
  
  async deleteApplication(applicationId: number): Promise<{ success: boolean }>{
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/applications/${applicationId}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Failed to delete application');
    return res.json();
  },
};

export default jobsService;
