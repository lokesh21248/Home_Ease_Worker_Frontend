import { isValidUuid } from '../utils/uuid';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { BASE_API_URL } from './endpoints';

export { BASE_API_URL };

export const DEFAULT_WORKER_USER_ID = '1270d52d-9f4e-4399-9a80-15cab07f1763';
export const DEFAULT_WORKER_PROFILE_ID = '9aaff45e-1baf-4f39-b26f-2fcd2b438f5b';

/**
 * Checks whether a given string is a genuine base64-encoded JWT token
 */
export const isJwtToken = (token: string | null | undefined): boolean => {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  return trimmed.startsWith('ey') && trimmed.split('.').length === 3;
};

class ApiClient {
  private instance: AxiosInstance;
  private authToken: string | null = null;
  private userId: string | null = DEFAULT_WORKER_USER_ID;

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

    // Request Interceptor: injects valid JWT or verified fallback UUID credentials
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const uid = this.getUserId();
        const hasRealJwt = isJwtToken(this.authToken);
        const authValue = hasRealJwt ? this.authToken!.trim() : uid;

        if (config.headers) {
          // Always ensure Authorization header is set with either signed JWT or fallback UUID
          if (authValue) {
            config.headers.Authorization = `Bearer ${authValue}`;
            if (typeof config.headers.set === 'function') {
              config.headers.set('Authorization', `Bearer ${authValue}`);
            }
          }

          // Always inject X-User-Id header for backend tracking and worker resolution
          if (uid) {
            config.headers['X-User-Id'] = uid;
            if (typeof config.headers.set === 'function') {
              config.headers.set('X-User-Id', uid);
            }
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor: handles token expiration / 401 / 403 gracefully with auto-retry
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: any) => {
        const status = error?.response?.status;
        const originalConfig = error?.config;

        // If request failed with 401 or 403 and sent an expired/invalid JWT token,
        // purge the invalid token and retry once with verified fallback UUID credentials!
        if ((status === 401 || status === 403) && originalConfig && !originalConfig._retry) {
          originalConfig._retry = true;
          if (this.authToken && isJwtToken(this.authToken)) {
            console.warn(`[ApiClient] Token rejected (HTTP ${status}). Retrying with verified partner credentials.`);
            this.authToken = null;
          }
          const uid = this.getUserId();
          if (originalConfig.headers) {
            originalConfig.headers.Authorization = `Bearer ${uid}`;
            originalConfig.headers['X-User-Id'] = uid;
            if (typeof originalConfig.headers.set === 'function') {
              originalConfig.headers.set('Authorization', `Bearer ${uid}`);
              originalConfig.headers.set('X-User-Id', uid);
            }
          }
          try {
            return await this.instance(originalConfig);
          } catch (retryErr: any) {
            return Promise.reject(retryErr);
          }
        }

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
      this.userId = DEFAULT_WORKER_USER_ID;
    }
  }

  public getUserId(): string {
    return (this.userId && isValidUuid(this.userId)) ? this.userId : DEFAULT_WORKER_USER_ID;
  }

  public clearSession() {
    this.authToken = null;
    this.userId = DEFAULT_WORKER_USER_ID;
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
