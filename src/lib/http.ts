import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosRequestHeaders } from 'axios'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: unknown
}

const rawBase = (import.meta.env.VITE_API_URL as string) || ''
const API_BASE_URL = rawBase ? `${rawBase.replace(/\/$/, '')}/api` : '/api'

const instance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    const headers: AxiosRequestHeaders = (config.headers || {}) as AxiosRequestHeaders
    headers['Authorization'] = `Bearer ${token}`
    config.headers = headers
  }
  return config
})

function unwrap<T>(res: AxiosResponse): T {
  const body = res.data
  if (body && typeof body === 'object' && 'success' in body) {
    return (body as ApiResponse<T>).data as T
  }
  return body as T
}

export async function getData<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await instance.get(url, config)
  return unwrap<T>(res)
}

export async function postData<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await instance.post(url, data, config)
  return unwrap<T>(res)
}

export async function putData<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await instance.put(url, data, config)
  return unwrap<T>(res)
}

export async function deleteData<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await instance.delete(url, config)
  return unwrap<T>(res)
}

export const http = instance