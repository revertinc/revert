import axios from 'axios';
import { REVERT_BASE_API_URL } from '../../constants';
import { LOCALSTORAGE_KEYS } from '../localstorage';

const axiosInstance = axios.create({
    baseURL: REVERT_BASE_API_URL,
});

axiosInstance.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem(LOCALSTORAGE_KEYS.privateToken);
        if (token) {
            config.headers['x-revert-api-token'] = token;
        }
        config.headers['Content-Type'] = 'application/json';
        return config;
    },
    async (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    async (response) => {
        console.log(response,"]]]]]]]]]]]]]]]]]]]]]]]]]]]]]")
        return response;
    },
    async (error) => {
        if (error.response && error.response.data) {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error.message);
    }
);

export default axiosInstance;
