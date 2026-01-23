import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Event, EventRequest } from '../types';
import { eventService } from '../services/supabaseService';
import { useAuth } from './AuthContext';
import { logger } from '../utils/logger';

interface EventContextType {
  events: Event[];
  myEvents: Event[];
  isLoading: boolean;
  createEvent: (eventData: Omit<Event, 'id' | 'organizerId' | 'organizerName' | 'currentPlayers' | 'players' | 'createdAt' | 'status' | 'code'>) => Promise<Event>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  requestToJoin: (eventId: string) => Promise<void>;
  approveRequest: (eventId: string, userId: string) => Promise<void>;
  denyRequest: (eventId: string, userId: string) => Promise<void>;
  getEventRequests: (eventId: string) => Promise<EventRequest[]>;
  getEventInvitations: (eventId: string) => Promise<EventRequest[]>;
  getUserPendingRequest: (eventId: string) => Promise<EventRequest | null>;
  getUserEventRequest: (eventId: string) => Promise<EventRequest | null>;
  getUserApprovedRequest: (eventId: string) => Promise<EventRequest | null>;
  inviteFriendToEvent: (eventId: string, friendId: string) => Promise<void>;
  getUserInvitations: () => Promise<EventRequest[]>;
  acceptInvitation: (eventId: string) => Promise<void>;
  denyInvitation: (eventId: string) => Promise<void>;
  joinEvent: (eventId: string) => Promise<void>;
  leaveEvent: (eventId: string) => Promise<void>;
  getEvent: (id: string) => Event | undefined;
  searchEvents: (query: string, filters?: { sport?: string; date?: string }) => Event[];
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [user]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const allEvents = await eventService.getAllEvents();
      setEvents(allEvents);
    } catch (error) {
      logger.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (eventData: Omit<Event, 'id' | 'organizerId' | 'organizerName' | 'currentPlayers' | 'players' | 'createdAt' | 'status' | 'code'>) => {
    if (!user) throw new Error('Must be logged in to create events');
    
    const newEvent = await eventService.createEvent({
      ...eventData,
      organizerId: user.id,
      organizerName: `${user.firstName} ${user.lastName}`,
      currentPlayers: 1, // Creator is automatically the first player
      players: [user.id], // Creator is added to players array
      status: 'open',
    });
    
    loadEvents();
    return newEvent;
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    await eventService.updateEvent(id, updates);
    loadEvents();
  };

  const deleteEvent = async (id: string) => {
    await eventService.deleteEvent(id);
    loadEvents();
  };

  const requestToJoin = async (eventId: string) => {
    if (!user) throw new Error('Must be logged in to request to join events');
    await eventService.requestToJoin(eventId, user.id);
    loadEvents();
  };

  const approveRequest = async (eventId: string, userId: string) => {
    if (!user) throw new Error('Must be logged in to approve requests');
    
    // Optimistically update the local state
    setEvents(prevEvents => {
      return prevEvents.map(event => {
        if (event.id === eventId && !event.players.includes(userId)) {
          const updatedPlayers = [...event.players, userId];
          return {
            ...event,
            players: updatedPlayers,
            currentPlayers: updatedPlayers.length,
            status: updatedPlayers.length >= event.maxPlayers ? 'full' : event.status,
          };
        }
        return event;
      });
    });
    
    try {
      await eventService.approveRequest(eventId, userId);
      // Reload events once to sync with server state
      await loadEvents();
    } catch (error) {
      // Revert optimistic update on error
      await loadEvents();
      throw error;
    }
  };

  const denyRequest = async (eventId: string, userId: string) => {
    if (!user) throw new Error('Must be logged in to deny requests');
    await eventService.denyRequest(eventId, userId);
    loadEvents();
  };

  const getEventRequests = async (eventId: string) => {
    return await eventService.getEventRequests(eventId);
  };

  const getEventInvitations = async (eventId: string) => {
    return await eventService.getEventInvitations(eventId);
  };

  const getUserPendingRequest = async (eventId: string) => {
    if (!user) return null;
    return await eventService.getUserPendingRequest(eventId, user.id);
  };

  const getUserEventRequest = async (eventId: string) => {
    if (!user) return null;
    return await eventService.getUserEventRequest(eventId, user.id);
  };

  const getUserApprovedRequest = async (eventId: string) => {
    if (!user) return null;
    return await eventService.getUserApprovedRequest(eventId, user.id);
  };

  const inviteFriendToEvent = async (eventId: string, friendId: string) => {
    if (!user) throw new Error('Must be logged in to invite friends');
    await eventService.inviteFriendToEvent(eventId, friendId, user.id);
    loadEvents();
  };

  const getUserInvitations = async () => {
    if (!user) return [];
    return await eventService.getUserInvitations(user.id);
  };

  const acceptInvitation = async (eventId: string) => {
    if (!user) throw new Error('Must be logged in to accept invitations');
    await eventService.acceptInvitation(eventId, user.id);
    loadEvents();
  };

  const denyInvitation = async (eventId: string) => {
    if (!user) throw new Error('Must be logged in to deny invitations');
    await eventService.denyInvitation(eventId, user.id);
    loadEvents();
  };

  const joinEvent = async (eventId: string) => {
    if (!user) throw new Error('Must be logged in to join events');
    await eventService.joinEvent(eventId, user.id);
    loadEvents();
  };

  const leaveEvent = async (eventId: string) => {
    if (!user) throw new Error('Must be logged in to leave events');
    await eventService.leaveEvent(eventId, user.id);
    loadEvents();
  };

  const getEvent = (id: string) => {
    return events.find(e => e.id === id);
  };

  const searchEvents = (query: string, filters?: { sport?: string; date?: string }) => {
    let results = events.filter(e => e.status === 'open');
    
    if (query) {
      const lowerQuery = query.toLowerCase().trim();
      // Check if query looks like an event code (3 letters + 3 numbers)
      const isCodeSearch = /^[A-Z]{3}\d{3}$/i.test(lowerQuery);
      
      if (isCodeSearch) {
        // Search by code (case-insensitive)
        results = results.filter(e => e.code?.toUpperCase() === lowerQuery.toUpperCase());
      } else {
        // Regular search
        results = results.filter(e => 
          e.title.toLowerCase().includes(lowerQuery) ||
          e.location.toLowerCase().includes(lowerQuery) ||
          e.sport.toLowerCase().includes(lowerQuery) ||
          e.code?.toUpperCase().includes(lowerQuery.toUpperCase())
        );
      }
    }
    
    if (filters?.sport) {
      results = results.filter(e => e.sport === filters.sport);
    }
    
    if (filters?.date) {
      results = results.filter(e => e.date === filters.date);
    }
    
    return results;
  };

  const myEvents = user 
    ? events.filter(e => 
        e.organizerId === user.id || 
        e.players.includes(user.id)
      )
    : [];

  return (
    <EventContext.Provider
      value={{
        events,
        myEvents,
        isLoading,
        createEvent,
        updateEvent,
        deleteEvent,
        requestToJoin,
        approveRequest,
        denyRequest,
        getEventRequests,
        getEventInvitations,
        getUserPendingRequest,
        getUserEventRequest,
        getUserApprovedRequest,
        inviteFriendToEvent,
        getUserInvitations,
        acceptInvitation,
        denyInvitation,
        joinEvent,
        leaveEvent,
        getEvent,
        searchEvents,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};

