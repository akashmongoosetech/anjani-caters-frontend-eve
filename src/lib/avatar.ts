export function getInitials(name: string): string {
  if (!name) return 'A';
  return name
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 3)
    .join('')
    .toUpperCase();
}

export function getAvatarColor(name: string): string {
  if (!name) return 'hsl(140, 55%, 50%)';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 55%, 50%)`;
}

const API_URL = (import.meta as any).env?.VITE_API_URL || '/api';
const BACKEND_ORIGIN = API_URL.startsWith('http') ? API_URL.replace(/\/api\/?$/, '') : '';

export function getImageUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/uploads/')) {
    return `${BACKEND_ORIGIN}${url}`;
  }
  if (url.startsWith('uploads/')) {
    return `${BACKEND_ORIGIN}/${url}`;
  }
  return `${BACKEND_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}
