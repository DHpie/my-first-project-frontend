import axios from 'axios';
import type { Result } from '../types/user';

const request = axios.create({
  baseURL: '/',
  timeout: 10000,
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
