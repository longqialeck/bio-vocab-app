import axios from 'axios';

// 输出环境变量中的API URL
console.log('API基础URL:', import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
  config => {
    console.log('API请求:', {
      method: config.method, 
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('API请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  response => {
    console.log('API响应成功:', {
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  error => {
    console.error('API响应错误:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    
    // 增强JWT错误处理
    if (error.response) {
      const status = error.response.status;
      const errorMsg = error.response.data?.message || '';
      
      // 处理所有可能的JWT无效情况
      if (
        status === 401 || 
        errorMsg.includes('令牌无效') || 
        errorMsg.includes('已过期') ||
        errorMsg.includes('无权访问') ||
        error.message.includes('invalid signature')
      ) {
        console.log('检测到令牌无效，正在清除本地存储...');
        
        // 清除所有身份验证相关数据
        localStorage.removeItem('token');
        localStorage.removeItem('bioVocabUser');
        sessionStorage.removeItem('token');
        
        // 使用更友好的提示
        const message = '您的登录会话已过期，请重新登录';
        
        // 避免无限重定向循环
        if (!window.location.pathname.includes('/login')) {
          // 在重定向前显示提示
          if (typeof window.showLoginExpiredMessage === 'function') {
            window.showLoginExpiredMessage(message);
          } else {
            alert(message);
          }
          
          // 记录当前URL以便登录后返回
          if (window.location.pathname !== '/' && !window.location.pathname.includes('/admin')) {
            localStorage.setItem('redirectAfterLogin', window.location.pathname);
          }
          
          // 重定向到登录页
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 