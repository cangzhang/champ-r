import axios from 'axios';

axios.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response.data;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error);
  },
);

axios.interceptors.request.use((config) => {
  config.params = {
    ...(config.params ?? {}),
    _: +Date.now(),
  };

  return config;
});

export const CancelToken = axios.CancelToken;

export default axios;
