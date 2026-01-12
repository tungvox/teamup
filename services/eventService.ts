import { Event } from '../types';
import { generateEventCode } from '../utils/eventCode';

const STORAGE_KEY = 'teamup_events';

export const eventService = {
  getAllEvents(): Event[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveEvents(events: Event[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  },

  async createEvent(eventData: Omit<Event, 'id' | 'createdAt'>): Promise<Event> {
    const events = this.getAllEvents();
    
    // Generate unique code if not provided
    let code = eventData.code || generateEventCode();
    // Ensure code is unique
    while (events.some(e => e.code === code)) {
      code = generateEventCode();
    }
    
    const newEvent: Event = {
      ...eventData,
      code,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    
    events.push(newEvent);
    this.saveEvents(events);
    return newEvent;
  },

  async updateEvent(id: string, updates: Partial<Event>): Promise<void> {
    const events = this.getAllEvents();
    const index = events.findIndex(e => e.id === id);
    
    if (index === -1) {
      throw new Error('Event not found');
    }
    
    events[index] = { ...events[index], ...updates };
    
    // Update currentPlayers if players array changed
    if (updates.players !== undefined) {
      events[index].currentPlayers = updates.players.length;
      if (events[index].currentPlayers >= events[index].maxPlayers) {
        events[index].status = 'full';
      } else if (events[index].status === 'full') {
        events[index].status = 'open';
      }
    }
    
    this.saveEvents(events);
  },

  async deleteEvent(id: string): Promise<void> {
    const events = this.getAllEvents();
    const filtered = events.filter(e => e.id !== id);
    this.saveEvents(filtered);
  },

  async joinEvent(eventId: string, userId: string): Promise<void> {
    const events = this.getAllEvents();
    const event = events.find(e => e.id === eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    if (event.status === 'full') {
      throw new Error('Event is full');
    }
    
    if (event.players.includes(userId)) {
      throw new Error('Already joined this event');
    }
    
    event.players.push(userId);
    event.currentPlayers = event.players.length;
    
    if (event.currentPlayers >= event.maxPlayers) {
      event.status = 'full';
    }
    
    this.saveEvents(events);
  },

  async leaveEvent(eventId: string, userId: string): Promise<void> {
    const events = this.getAllEvents();
    const event = events.find(e => e.id === eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    event.players = event.players.filter(id => id !== userId);
    event.currentPlayers = event.players.length;
    
    if (event.status === 'full' && event.currentPlayers < event.maxPlayers) {
      event.status = 'open';
    }
    
    this.saveEvents(events);
  },

  getEvent(id: string): Event | undefined {
    const events = this.getAllEvents();
    return events.find(e => e.id === id);
  },
};

