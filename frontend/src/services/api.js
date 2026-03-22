import axios from 'axios';

// Automatically use the live backend URL if deployed to Render, otherwise fallback to local development.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});
