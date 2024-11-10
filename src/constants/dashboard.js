// constants/dashboard.js
export const DASHBOARD_CONSTANTS = {
  PHOTO_MAX_SIZE: 5000000, // 5MB
  DEFAULT_PROFILE_PHOTO: '/default-avatar.jpg',
  
  VIEWS: {
    DISCOVER: 'discover',
    DATES: 'dates',
    PROFILE: 'profile'
  },

  MESSAGES: {
    ERRORS: {
      PHOTO_SIZE: 'Please select a valid image file under 5MB.',
      LOAD_PROFILES: 'Failed to load profiles. Please refresh.',
      LOAD_USER: 'Failed to load user data.',
      UPDATE_PROFILE: 'Failed to update profile. Please try again.',
      SEND_COFFEE: 'Failed to send coffee. Please try again.',
      LOGOUT: 'Failed to log out. Please try again.'
    },
    SUCCESS: {
      PROFILE_UPDATE: 'Profile updated successfully!',
      COFFEE_SENT: 'Coffee sent successfully!'
    }
  },

  TIMEOUTS: {
    MESSAGE_DISPLAY: 3000,
    PROFILE_TRANSITION: 1500
  }
};