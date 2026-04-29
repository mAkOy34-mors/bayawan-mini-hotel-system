import i18next from 'i18next'
export const ROOM_GRADIENTS = {
  STANDARD:    'linear-gradient(135deg,#6b3a1a,#a85e2d)',
  DELUXE:      'linear-gradient(135deg,#1a4a6b,#2d7aa8)',
  SUITE:       'linear-gradient(135deg,#1a6b3a,#2da85e)',
  PRESIDENTIAL:'linear-gradient(135deg,#4a1a6b,#7a2da8)',
  VILLA:       'linear-gradient(135deg,#6b1a3a,#a82d5e)',
};

export const ROOM_ICONS = {
  STANDARD:    '🏠',
  DELUXE:      '💧',
  SUITE:       '🌳',
  PRESIDENTIAL:'💎',
  VILLA:       '🏡',
};

export const STATUS_META = {
  PAID:           { cls: 'paid',      label: i18next.t('paid', 'Paid') },
  PENDING:        { cls: 'pending',   label: i18next.t('pending2', 'Pending') },
  FAILED:         { cls: 'failed',    label: i18next.t('failed', 'Failed') },
  REFUNDED:       { cls: 'refunded',  label: i18next.t('refunded', 'Refunded') },
  PENDING_DEPOSIT:{ cls: 'pending',   label: i18next.t('pendingDeposit', 'Pending Deposit') },
  CONFIRMED:      { cls: 'confirmed', label: i18next.t('confirmed', 'Confirmed') },
  CHECKED_IN:     { cls: 'active',    label: i18next.t('checkedIn', 'Checked In') },
  CHECKED_OUT:    { cls: 'refunded',  label: i18next.t('checkedOut', 'Checked Out') },
  CANCELLED:      { cls: 'failed',    label: i18next.t('cancelled', 'Cancelled') },
  COMPLETED:      { cls: 'paid',      label: i18next.t('completed2', 'Completed') },
};

export const DEMO_BOOKINGS = [
  { id: 101, roomType: 'DELUXE',   checkInDate: '2025-03-10', checkOutDate: '2025-03-13', status: 'CONFIRMED',  totalAmount: 13500 },
  { id: 88,  roomType: 'STANDARD', checkInDate: '2024-11-05', checkOutDate: '2024-11-06', status: 'COMPLETED',  totalAmount: 4800  },
  { id: 72,  roomType: 'DELUXE',   checkInDate: '2024-09-22', checkOutDate: '2024-09-24', status: 'CANCELLED',  totalAmount: 4000  },
];

export const DEMO_PAYMENTS = [
  { id: 'PAY-001', description: i18next.t('deluxeOceanView3Nights', 'Deluxe Ocean View – 3 nights'), amount: 13500, type: 'ROOM_BOOKING',  status: 'PAID',    createdAt: '2025-01-15T10:00:00Z', bookingId: 101 },
  { id: 'PAY-002', description: i18next.t('spaWellnessPackage', 'Spa & Wellness Package'),        amount: 1500,  type: 'SPA_WELLNESS', status: 'PAID',    createdAt: '2025-01-16T14:00:00Z' },
  { id: 'PAY-003', description: i18next.t('restaurantDinnerFor2', 'Restaurant – Dinner for 2'),     amount: 2800,  type: 'RESTAURANT',   status: 'PAID',    createdAt: '2025-01-17T19:30:00Z' },
  { id: 'PAY-007', description: i18next.t('laundryService', 'Laundry Service'),               amount: 400,   type: 'LAUNDRY',      status: 'PENDING', createdAt: '2025-02-01T07:00:00Z' },
  { id: 'PAY-008', description: i18next.t('premiumSuiteBooking', 'Premium Suite Booking'),          amount: 18000, type: 'ROOM_BOOKING', status: 'PENDING', createdAt: '2025-02-15T12:00:00Z', bookingId: 210 },
];

export const DEMO_ROOMS = [
  { id: 1, roomType: 'STANDARD',     pricePerNight: 4800,  maxOccupancy: 2, description: i18next.t('cozyRoomWithGardenViewPerfectForCouples', 'Cozy room with garden view, perfect for couples.'),                                  amenities: 'WiFi,TV,AC,Bathroom',            available: true },
  { id: 2, roomType: 'DELUXE',       pricePerNight: 4500,  maxOccupancy: 3, description: i18next.t('spaciousRoomWithOceanViewAndPremiumAmenities', 'Spacious room with ocean view and premium amenities.'),                               amenities: 'WiFi,TV,AC,Pool,Bathroom',       available: true },
  { id: 3, roomType: 'SUITE',        pricePerNight: 8500,  maxOccupancy: 4, description: i18next.t('luxuriousSuiteWithSeparateLivingAreaAndPanoramicViews', 'Luxurious suite with separate living area and panoramic views.'),                     amenities: 'WiFi,TV,AC,Pool,Breakfast,Gym',  available: true },
  { id: 4, roomType: 'PRESIDENTIAL', pricePerNight: 25000, maxOccupancy: 6, description: i18next.t('thePinnacleOfLuxuryWithButlerServiceAndPrivateTerrace', 'The pinnacle of luxury with butler service and private terrace.'),                    amenities: 'WiFi,TV,AC,Pool,Breakfast,Gym',  available: true },
];
