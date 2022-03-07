import axios from 'axios';

axios.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const CancelToken = axios.CancelToken;

export default axios;
