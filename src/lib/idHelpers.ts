// ID Helper functions for auto-generating prefixes

export const getIdPrefix = (userType: string, position?: string): string => {
  switch (userType) {
    case 'teacher':
      return 'T';
    case 'parent':
      return 'P';
    case 'student':
      return 'S';
    case 'user':
      // For users, prefix depends on position
      switch (position) {
        case 'MAIN_DIRECTOR':
          return 'MD';
        case 'SUPPORT_DIRECTOR':
          return 'SD';
        case 'MAIN_HR':
          return 'MH';
        case 'SUPPORT_HR':
          return 'SH';
        case 'MAIN_ADMISSION':
          return 'MA';
        case 'SUPPORT_ADMISSION':
          return 'SA';
        case 'DOCTOR':
          return 'D';
        case 'CHIEF':
          return 'C';
        default:
          return 'U'; // Default for user
      }
    default:
      return '';
  }
};

export const generateIdSuggestion = (userType: string, position?: string): string => {
  const prefix = getIdPrefix(userType, position);
  const randomNumbers = Math.floor(10000 + Math.random() * 90000); // 5-digit number
  return `${prefix}${randomNumbers}`;
};

export const validateIdFormat = (id: string, userType: string, position?: string): boolean => {
  const expectedPrefix = getIdPrefix(userType, position);
  const pattern = new RegExp(`^${expectedPrefix}\\d{5}$`);
  return pattern.test(id);
};
