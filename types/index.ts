export interface User {
  id: string;
  userId: string; // Discord-like user ID (e.g., "johndoe#1234")
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  location?: string;
  sports: string[];
  stats: {
    matches: number;
    reliability: number;
    mvps: number;
  };
  level: number;
  tier?: string; // Tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster' | 'challenger'
  friends: string[]; // Array of user IDs who are friends
  friendRequests: string[]; // Array of user IDs who sent friend requests
  createdAt: string;
}

export interface Event {
  id: string;
  code: string; // Unique event code for searching
  title: string;
  sport: string;
  description?: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  locationDetails?: string;
  organizerId: string;
  organizerName: string;
  maxPlayers: number;
  currentPlayers: number;
  players: string[]; // user IDs
  price?: number;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All';
  competitive: boolean;
  image?: string;
  status: 'open' | 'full' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface EventRequest {
  id: string;
  eventId: string;
  userId: string; // clerk_id of the requester
  status: 'pending' | 'approved' | 'denied' | 'invited';
  invitedBy?: string; // clerk_id of the organizer who sent the invitation
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: string[]; // user IDs
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface Rating {
  id: string;
  eventId: string;
  raterId: string;
  ratedUserId: string;
  stars: number;
  skill?: number | string; // Skill rating: 'newbie' | 'intermediate' | 'advanced' (stored as 1, 3, 5 in DB)
  satisfaction?: number | string; // Satisfaction rating: 'bad' | 'ok' | 'great' (stored as 1, 3, 5 in DB)
  tags: string[];
  comment?: string;
  createdAt: string;
}

export interface NotificationSettings {
  gameInvites: boolean;
  scoreUpdates: boolean;
  rosterChanges: boolean;
  friendRequests: boolean;
  directMessages: boolean;
  teamAnnouncements: boolean;
  pauseAll: boolean;
  quietHours: { enabled: boolean; start: string; end: string };
}

