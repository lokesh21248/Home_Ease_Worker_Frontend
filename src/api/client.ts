import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { BASE_API_URL } from './endpoints';

export { BASE_API_URL };

class ApiClient {
  private instance: AxiosInstance;
  private authToken: string | null = null;
  private userId: string | null = '6f2e1a3b-4c5d-6e7f-6a9b-1c2d3e4f5a6b'; // Default Worker UUID from backend guide

  constructor() {
    this.instance = axios.create({
      baseURL: BASE_API_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Client-App': 'HomeEase-Worker-App',
        'X-App-Platform': 'react-native',
      },
    });

    // Request Interceptor (injects JWT auth token & X-User-Id required by backend)
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (config.headers) {
          if (this.authToken && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${this.authToken}`;
          }
          if (this.userId && !config.headers['X-User-Id']) {
            config.headers['X-User-Id'] = this.userId;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response Interceptor (graceful logging & contract-compliant error handling)
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: any) => {
        // Structured error handling for mobile frontend preserving Axios error and response structure
        if (error.response) {
          error.status = error.response.status;
          error.statusCode = error.response.status;
          error.data = error.response.data;
          error.details = error.response.data;
        }
        return Promise.reject(error);
      }
    );
  }

  public setAuthToken(token: string | null) {
    this.authToken = token;
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  public setUserId(userId: string | null) {
    this.userId = userId;
  }

  public getUserId(): string | null {
    return this.userId;
  }

  public clearSession() {
    this.authToken = null;
    this.userId = null;
  }

  public setBaseUrl(url: string) {
    this.instance.defaults.baseURL = url;
  }

  public getBaseUrl(): string {
    return this.instance.defaults.baseURL || BASE_API_URL;
  }

  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config);
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }

  /**
   * Multipart Form-Data file upload helper (for Worker Avatar, PAN, Aadhaar docs)
   */
  public uploadFile<T = any>(
    url: string,
    fileUri: string,
    fieldName: string = 'file',
    fileName: string = 'upload.jpg',
    mimeType: string = 'image/jpeg',
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);

    return this.instance.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
