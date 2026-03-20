export const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

export const LANGUAGES = [
  { code: 'en',  flag: '🇺🇸', label: 'EN' },
  { code: 'fil', flag: '🇵🇭', label: 'FIL' },
  { code: 'ceb', flag: '🇵🇭', label: 'CEB' },
];

export const PAGE_TITLES = {
  dashboard: 'Dashboard',
  bookings:  'Room Booking',
  rewards:   'Rewards',
  payments:  'Payments',
  profile:   'My Profile',
  settings:  'Settings',
  support:   'Support',
};
