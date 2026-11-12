import { isValidUuid } from '../utils/uuid';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { BASE_API_URL } from './endpoints';

export { BASE_API_URL };

class ApiClient {
  private instance: AxiosInstance;
  private authToken: string | null = null;
  private userId: string | null = null;

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
        const uid = this.getUserId();

        if (config.headers) {
          // Only inject Authorization if we have a real auth token
          if (this.authToken) {
            if (!config.headers.Authorization) {
              config.headers.Authorization = `Bearer ${this.authToken}`;
            }
            if (typeof config.headers.set === 'function' && !config.headers.has('Authorization')) {
              config.headers.set('Authorization', `Bearer ${this.authToken}`);
            }
          }
          // Only inject X-User-Id if we have a valid authenticated user ID
          if (uid) {
            if (!config.headers['X-User-Id']) {
              config.headers['X-User-Id'] = uid;
            }
            if (typeof config.headers.set === 'function' && !config.headers.has('X-User-Id')) {
              config.headers.set('X-User-Id', uid);
            }
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
    if (userId && isValidUuid(userId)) {
      this.userId = userId.trim();
    } else if (userId === null) {
      this.userId = null;
    }
  }

  public getUserId(): string | null {
    return (this.userId && isValidUuid(this.userId)) ? this.userId : null;
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

    const customHeaders: Record<string, any> = { ...((config?.headers as any) || {}) };
    delete customHeaders['Content-Type'];

    return this.instance.post<T>(url, formData, {
      ...config,
      headers: customHeaders,
      transformRequest: (data) => data,
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
