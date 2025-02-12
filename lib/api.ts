import axios, { AxiosError } from 'axios'
import { toast } from 'react-hot-toast'

// Create an Axios instance
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add request interceptor (optional: e.g., add auth token)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error),
)

// Add response interceptor to handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            toast.error('Invalid credentials. Please try again.');
        } 
        else if (error.response?.status !== 404) {
            toast.error('An error occurred. Please try again.');
        }
        return Promise.reject(error);
    },
);


export default api
