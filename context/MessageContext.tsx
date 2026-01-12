import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Chat, Message } from '../types';
import { messageService } from '../services/supabaseService';
import { useAuth } from './AuthContext';

interface MessageContextType {
  chats: Chat[];
  getChat: (chatId: string) => Chat | undefined;
  getMessages: (chatId: string) => Promise<Message[]>;
  sendMessage: (chatId: string, content: string) => Promise<void>;
  createChat: (participantIds: string[]) => Promise<string>;
  getOrCreateChat: (otherUserId: string) => Promise<string>;
  markAsRead: (chatId: string) => Promise<void>;
  unreadCount: number;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  const loadChats = async () => {
    if (!user) return;
    try {
      const userChats = await messageService.getUserChats(user.id);
      setChats(userChats);
      
      // Load messages for each chat
      const messagesMap: Record<string, Message[]> = {};
      for (const chat of userChats) {
        messagesMap[chat.id] = await messageService.getChatMessages(chat.id);
      }
      setMessages(messagesMap);
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]);
      setMessages({});
    }
  };

  const getChat = (chatId: string) => {
    return chats.find(c => c.id === chatId);
  };

  const getMessages = async (chatId: string): Promise<Message[]> => {
    if (messages[chatId]) {
      return messages[chatId];
    }
    // Load messages if not cached
    try {
      const chatMessages = await messageService.getChatMessages(chatId);
      setMessages(prev => ({ ...prev, [chatId]: chatMessages }));
      return chatMessages;
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  };

  const sendMessage = async (chatId: string, content: string) => {
    if (!user) throw new Error('Must be logged in to send messages');
    
    await messageService.sendMessage(chatId, user.id, content);
    loadChats();
  };

  const createChat = async (participantIds: string[]) => {
    if (!user) throw new Error('Must be logged in to create chats');
    
    const chatId = await messageService.createChat([user.id, ...participantIds]);
    loadChats();
    return chatId;
  };

  const getOrCreateChat = async (otherUserId: string) => {
    if (!user) throw new Error('Must be logged in');
    
    const existingChat = chats.find(chat => 
      chat.participants.includes(user.id) && 
      chat.participants.includes(otherUserId) &&
      chat.participants.length === 2
    );
    
    if (existingChat) {
      return existingChat.id;
    }
    
    return await createChat([otherUserId]);
  };

  const markAsRead = async (chatId: string) => {
    if (!user) return;
    try {
      await messageService.markAsRead(chatId, user.id);
      loadChats();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const unreadCount = chats.reduce((sum, chat) => sum + chat.unreadCount, 0);

  return (
    <MessageContext.Provider
      value={{
        chats,
        getChat,
        getMessages,
        sendMessage,
        createChat,
        getOrCreateChat,
        markAsRead,
        unreadCount,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

