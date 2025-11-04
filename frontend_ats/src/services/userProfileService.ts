import axios from 'axios';

interface ProfileData {
  fullname: string;
  celular: string;
  resume_pdf?: string | null;
}

interface ProfileResponse {
  success: boolean;
  message: string;
  profile?: {
    user_id: number;
    fullname: string;
    celular: string;
    resume_pdf?: string | null;
  };
}

interface ProfileCheckResponse {
  success: boolean;
  has_profile: boolean;
  message?: string;
  profile?: {
    user_id: number;
    fullname: string;
    celular: string;
    resume_pdf?: string | null;
  };
}

export const saveUserProfile = async (userId: number, profileData: ProfileData): Promise<ProfileResponse> => {
  try {
    const response = await axios.post<ProfileResponse>('/api/user/profile', {
      user_id: userId,
      fullname: profileData.fullname,
      celular: profileData.celular,
      resume_pdf: profileData.resume_pdf ?? null
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Error al guardar el perfil');
    }
    throw new Error('Error al guardar el perfil. Por favor, intente nuevamente.');
  }
};

export const getUserProfile = async (userId: number): Promise<ProfileCheckResponse> => {
  try {
    const response = await axios.post<ProfileCheckResponse>('/api/user/profile/get', {
      user_id: userId
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Error al obtener el perfil');
    }
    throw new Error('Error al obtener el perfil. Por favor, intente nuevamente.');
  }
};