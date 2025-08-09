import axios from 'axios';
import toast from 'react-hot-toast';

export const api = axios.create({
  baseURL: '/api',
});

// Interceptador de resposta para tratar erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data.message || 'Erro no servidor';
      toast.error(message);
      
      // Se token expirou, redirecionar para login
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else {
      toast.error('Erro de conexão com o servidor');
    }
    return Promise.reject(error);
  }
);