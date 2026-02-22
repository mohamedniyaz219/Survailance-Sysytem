import axios from 'axios';

// ❌ DELETE THIS LINE: import { store } from '../redux/store';

const API = axios.create({
  baseURL: 'http://localhost:3000/api/v1', 
});

// Interceptor: Attach Token & Business Code to every request
API.interceptors.request.use((config) => {
  // ✅ FIX: Read directly from localStorage to avoid circular dependency
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  let businessCode = null;
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      businessCode = user.business_code;
    } catch (e) {
      console.error("Error parsing user from local storage", e);
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Critical for Multi-tenancy
  if (businessCode) {
    config.headers['x-business-code'] = businessCode;
  }
  
  return config;
});

export default API;