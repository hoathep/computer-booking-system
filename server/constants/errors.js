// Error messages constants
export const ERROR_MESSAGES = {
  START_TIME_PAST: 'Start time cannot be in the past',
  END_TIME_BEFORE_START: 'End time must be after start time',
  INVALID_TIME_FORMAT: 'Invalid time format',
  BOOKING_CONFLICT: 'Time slot is already booked',
  BOOKING_LIMIT_EXCEEDED: 'Booking limit exceeded',
  COMPUTER_NOT_FOUND: 'Computer not found',
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_CREDENTIALS: 'Invalid credentials',
  SERVER_ERROR: 'Internal server error'
};

// Note: For client-side i18n, these keys should be mapped to:
// bookings.startTimePast
// bookings.endTimeBeforeStart
// etc.
