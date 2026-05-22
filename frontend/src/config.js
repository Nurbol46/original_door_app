// В dev режиме Vite проксирует /api/* на localhost:8000
// Поэтому BASE_URL всегда '/api' — работает и локально и в prod
const BASE_URL = '/api';

export { BASE_URL };
