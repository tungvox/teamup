/**
 * Generates a unique user ID in Discord-like format: username#1234
 * The numeric part is 4 digits (0000-9999)
 */
export const generateUserId = (username: string): string => {
  // Clean username: remove spaces, special chars, convert to lowercase
  const cleanUsername = username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20); // Max 20 chars
  
  // Generate 4-digit number
  const discriminator = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  
  return `${cleanUsername}#${discriminator}`;
};

/**
 * Validates if a user ID is in the correct format
 */
export const isValidUserId = (userId: string): boolean => {
  return /^[a-z0-9]{1,20}#\d{4}$/.test(userId);
};
