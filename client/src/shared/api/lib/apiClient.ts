export class ApiError extends Error {
  status: number;
  data: unknown;
  config: RequestConfig & { url: string; method: string; _retry?: boolean };

  constructor(
    message: string,
    status: number,
    data: unknown,
    config: RequestConfig & { url: string; method: string; _retry?: boolean },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.config = config;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

type RequestConfig = {
  headers?: Record<string, string>;
  responseType?: 'json' | 'blob';
  timeout?: number;
  onUploadProgress?: (event: { loaded: number; total: number }) => void;
  signal?: AbortSignal;
  body?: unknown;
  _retry?: boolean;
};

type InterceptorConfig = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
};

type RequestInterceptorFn = (config: InterceptorConfig) => InterceptorConfig;

type ResponseInterceptorFulfilled = (
  response: ApiResponse<unknown>,
) => ApiResponse<unknown> | Promise<ApiResponse<unknown>>;
type ResponseInterceptorRejected = (
  error: ApiError,
) => unknown | Promise<unknown>;

type ApiResponse<T> = {
  data: T;
  status: number;
  headers: Record<string, string>;
};

type Interceptor<F, R = undefined> = {
  id: number;
  fulfilled: F;
  rejected?: R;
};

class InterceptorManager<F, R = undefined> {
  private handlers: (Interceptor<F, R> | null)[] = [];
  private nextId = 0;

  use(fulfilled: F, rejected?: R): number {
    const id = this.nextId++;
    this.handlers.push({ id, fulfilled, rejected });
    return id;
  }

  eject(id: number): void {
    this.handlers = this.handlers.map((h) => (h?.id === id ? null : h));
  }

  forEach(fn: (handler: Interceptor<F, R>) => void): void {
    for (const handler of this.handlers) {
      if (handler !== null) {
        fn(handler);
      }
    }
  }
}

class FetchClient {
  private baseURL: string;

  interceptors = {
    request: new InterceptorManager<RequestInterceptorFn>(),
    response: new InterceptorManager<
      ResponseInterceptorFulfilled,
      ResponseInterceptorRejected
    >(),
  };

  constructor(config: { baseURL: string }) {
    this.baseURL = config.baseURL;
  }

  private runErrorInterceptors(apiError: ApiError): Promise<unknown> {
    let result: Promise<unknown> = Promise.reject(apiError);
    this.interceptors.response.forEach(({ rejected }) => {
      if (rejected) {
        result = result.catch((e) => rejected(e));
      }
    });
    return result;
  }

  async request<T = unknown>(
    config: RequestConfig & { url: string; method: string },
  ): Promise<ApiResponse<T>> {
    let reqConfig: InterceptorConfig = {
      url: config.url,
      method: config.method.toUpperCase(),
      headers: { ...config.headers } as Record<string, string>,
      body: config.body,
    };

    this.interceptors.request.forEach(({ fulfilled }) => {
      reqConfig = fulfilled(reqConfig);
    });

    const fullUrl = this.baseURL + reqConfig.url;

    if (config.onUploadProgress && reqConfig.body instanceof FormData) {
      return this.requestWithXHR<T>(fullUrl, reqConfig, config);
    }

    let fetchBody: BodyInit | undefined;
    if (reqConfig.body !== undefined && reqConfig.body !== null) {
      if (reqConfig.body instanceof FormData) {
        fetchBody = reqConfig.body;
        delete reqConfig.headers['Content-Type'];
      } else {
        fetchBody = JSON.stringify(reqConfig.body);
        if (!reqConfig.headers['Content-Type']) {
          reqConfig.headers['Content-Type'] = 'application/json';
        }
      }
    }

    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (config.timeout) {
      timeoutId = setTimeout(() => controller.abort(), config.timeout);
    }

    let response: Response;
    try {
      response = await fetch(fullUrl, {
        method: reqConfig.method,
        headers: reqConfig.headers,
        body: fetchBody,
        credentials: 'include',
        signal: config.signal ?? controller.signal,
      });
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);

      const message =
        controller.signal.aborted && !config.signal?.aborted
          ? `timeout of ${config.timeout}ms exceeded`
          : err instanceof Error
            ? err.message
            : 'Network Error';

      const apiError = new ApiError(message, 0, null, {
        ...config,
        url: reqConfig.url,
        method: reqConfig.method,
      });

      return this.runErrorInterceptors(apiError) as Promise<ApiResponse<T>>;
    }

    if (timeoutId) clearTimeout(timeoutId);

    const headers = Object.fromEntries(response.headers.entries());

    if (!response.ok) {
      let errorData: unknown = null;
      try {
        if (config.responseType === 'blob') {
          errorData = await response.blob();
        } else {
          errorData = await response.json();
        }
      } catch {
        // empty body or unparseable
      }

      const apiError = new ApiError(
        `Request failed with status ${response.status}`,
        response.status,
        errorData,
        { ...config, url: reqConfig.url, method: reqConfig.method },
      );

      return this.runErrorInterceptors(apiError) as Promise<ApiResponse<T>>;
    }

    let data: T;
    if (response.status === 204) {
      data = null as T;
    } else if (config.responseType === 'blob') {
      data = (await response.blob()) as T;
    } else {
      data = (await response.json()) as T;
    }

    let apiResponse: ApiResponse<unknown> = {
      data,
      status: response.status,
      headers,
    };

    this.interceptors.response.forEach(({ fulfilled }) => {
      const result = fulfilled(apiResponse);
      if (result instanceof Promise) {
        throw new Error(
          'Synchronous response interceptors must not return a Promise. Use the rejected handler for async logic.',
        );
      }
      apiResponse = result;
    });

    return apiResponse as ApiResponse<T>;
  }

  private requestWithXHR<T>(
    url: string,
    reqConfig: {
      method: string;
      headers: Record<string, string>;
      body?: unknown;
    },
    config: RequestConfig & { url: string; method: string },
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(reqConfig.method, url, true);
      xhr.withCredentials = true;

      for (const [key, value] of Object.entries(reqConfig.headers)) {
        if (key.toLowerCase() !== 'content-type') {
          xhr.setRequestHeader(key, value);
        }
      }

      if (config.timeout) {
        xhr.timeout = config.timeout;
      }

      if (config.onUploadProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            config.onUploadProgress!({
              loaded: event.loaded,
              total: event.total,
            });
          }
        };
      }

      xhr.onload = () => {
        const headers: Record<string, string> = {};
        xhr
          .getAllResponseHeaders()
          .trim()
          .split('\r\n')
          .forEach((line) => {
            const idx = line.indexOf(':');
            if (idx > 0) {
              headers[line.slice(0, idx).trim().toLowerCase()] = line
                .slice(idx + 1)
                .trim();
            }
          });

        if (xhr.status >= 200 && xhr.status < 300) {
          let data: T;
          try {
            data = JSON.parse(xhr.responseText) as T;
          } catch {
            data = xhr.responseText as T;
          }
          resolve({ data, status: xhr.status, headers });
        } else {
          let errorData: unknown = null;
          try {
            errorData = JSON.parse(xhr.responseText);
          } catch {
            errorData = xhr.responseText;
          }

          const apiError = new ApiError(
            `Request failed with status ${xhr.status}`,
            xhr.status,
            errorData,
            { ...config, url: config.url, method: reqConfig.method },
          );

          this.runErrorInterceptors(apiError).then(
            (r) => resolve(r as ApiResponse<T>),
            (e) => reject(e),
          );
        }
      };

      xhr.onerror = () => {
        const apiError = new ApiError('Network Error', 0, null, {
          ...config,
          url: config.url,
          method: reqConfig.method,
        });
        this.runErrorInterceptors(apiError).then(
          (r) => resolve(r as ApiResponse<T>),
          (e) => reject(e),
        );
      };

      xhr.ontimeout = () => {
        const apiError = new ApiError(
          `timeout of ${config.timeout}ms exceeded`,
          0,
          null,
          { ...config, url: config.url, method: reqConfig.method },
        );
        this.runErrorInterceptors(apiError).then(
          (r) => resolve(r as ApiResponse<T>),
          (e) => reject(e),
        );
      };

      xhr.send(reqConfig.body as FormData);
    });
  }

  async get<T = unknown>(
    url: string,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  async post<T = unknown>(
    url: string,
    body?: unknown,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'POST', body });
  }

  async patch<T = unknown>(
    url: string,
    body?: unknown,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PATCH', body });
  }

  async delete<T = unknown>(
    url: string,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }
}

export const apiClient = new FetchClient({ baseURL: '/api' });
