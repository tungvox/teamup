import { User } from '../types';

const STORAGE_KEY = 'teamup_users';
const SESSION_KEY = 'teamup_session';

export const authService = {
  getCurrentUser(): User | null {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    
    try {
      const userId = JSON.parse(session).userId;
      const users = this.getAllUsers();
      return users.find(u => u.id === userId) || null;
    } catch {
      return null;
    }
  },

  getAllUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  },

  async login(email: string, password: string): Promise<User> {
    const users = this.getAllUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // In a real app, password would be hashed and verified
    // For demo, we'll just check if user exists
    const session = { userId: user.id, email: user.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    return user;
  },

  async signup(email: string, password: string, firstName: string, lastName: string): Promise<User> {
    const users = this.getAllUsers();
    
    if (users.some(u => u.email === email)) {
      throw new Error('Email already registered');
    }
    
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      firstName,
      lastName,
      sports: [],
      stats: {
        matches: 0,
        reliability: 100,
        mvps: 0,
      },
      level: 1,
      createdAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    this.saveUsers(users);
    
    const session = { userId: newUser.id, email: newUser.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    return newUser;
  },

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  updateUser(user: User): void {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      this.saveUsers(users);
    }
  },
};

