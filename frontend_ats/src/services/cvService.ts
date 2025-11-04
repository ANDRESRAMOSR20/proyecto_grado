import axios from 'axios';

interface UploadResponse {
  success: boolean;
  cv_id: number;
  message: string;
  filename: string;
  chunks: number;
}

export const uploadCV = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await axios.post<UploadResponse>('/api/cv/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to upload CV');
    }
    throw new Error('Failed to upload CV. Please try again.');
  }
};

export const searchSimilarCVs = async (query: string): Promise<any> => {
  try {
    const response = await axios.post('/api/cv/search', { query });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to search CVs');
    }
    throw new Error('Failed to search CVs. Please try again.');
  }
}; 