/**
 * @deprecated This file is kept for backward compatibility.
 * Please import directly from the modular services:
 * - services/events/eventService
 * - services/messages/messageService
 * - services/users/userProfileService
 * - services/friends/friendService
 * - services/sports/sportsService
 * - services/ratings/ratingService
 */

// Re-export event service
export { eventService } from './events/eventService';

// Re-export message service
export { messageService } from './messages/messageService';

// Re-export user profile functions
export {
  getUserProfile,
  createUserProfile,
  getUserByUserId,
  updateUserProfile,
} from './users/userProfileService';

// Re-export friend service functions
export {
  sendFriendRequest,
  acceptFriendRequest,
  denyFriendRequest,
  removeFriend,
} from './friends/friendService';

// Re-export sports service
export { sportsService } from './sports/sportsService';

// Re-export rating service
export { ratingService } from './ratings/ratingService';
