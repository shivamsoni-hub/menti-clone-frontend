// src/utils/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'https://menti-clone-backend-3.onrender.com/api',
  withCredentials: true, // Automatically sends cookies with every request!
});

export default API;