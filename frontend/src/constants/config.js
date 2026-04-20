// constants/config.js
export const API_BASE = `http://127.0.0.1:8000/api/v1`;

export const LANGUAGES = [
  { code: 'en',  flag: '🇺🇸', label: 'English' },
  { code: 'es',  flag: '🇪🇸', label: 'Español' },
  { code: 'fr',  flag: '🇫🇷', label: 'Français' },
  { code: 'de',  flag: '🇩🇪', label: 'Deutsch' },
  { code: 'ja',  flag: '🇯🇵', label: '日本語' },
  { code: 'zh',  flag: '🇨🇳', label: '中文' },
  { code: 'ko',  flag: '🇰🇷', label: '한국어' },
  { code: 'fil', flag: '🇵🇭', label: 'Filipino' },
  { code: 'ceb', flag: '🇵🇭', label: 'Cebuano' },
];

export const PAGE_TITLES = {
  dashboard: 'Dashboard',
  bookings: 'Book a Room',
  mybookings: 'My Bookings',
  rewards: 'Rewards',
  payments: 'Payments',
  profile: 'My Profile',
  settings: 'Settings',
  support: 'Help & Support',
  emergency: 'Emergency Assistance',
  complaints: 'Guest Complaints',
  services: 'Hotel Services',
};