// src/utils/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // Automatically sends cookies with every request!
});

export default API;