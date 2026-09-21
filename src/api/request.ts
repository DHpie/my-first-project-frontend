import axios from 'axios';
import type { Result } from '../types/user';

const request = axios.create({
  baseURL: '/',
  // Default timeout aligned with the longest spec-defined timeout (AI chat: 15s).
  // Shorter per-feature timeouts (e.g. destinations/community 10s) are enforced
  // at the component layer via AbortController and will fire before this default.
  timeout: 15000,
});

request.interceptors.response.use(
  (response) => {
    const result = response.data as Result<unknown>;
    if (result.code === 200) {
      return response;
    }
    return Promise.reject(new Error(result.message || 'Request failed'));
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

export default request;
