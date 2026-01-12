import { Chat, Message } from '../types';
import { userService } from './userService';

const CHATS_KEY = 'teamup_chats';
const MESSAGES_KEY = 'teamup_messages';

export const messageService = {
  getAllChats(): Chat[] {
    const data = localStorage.getItem(CHATS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveChats(chats: Chat[]): void {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  },

  getAllMessages(): Record<string, Message[]> {
    const data = localStorage.getItem(MESSAGES_KEY);
    return data ? JSON.parse(data) : {};
  },

  saveMessages(messages: Record<string, Message[]>): void {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  },

  getUserChats(userId: string): Chat[] {
    const chats = this.getAllChats();
    return chats.filter(chat => chat.participants.includes(userId));
  },

  getChatMessages(chatId: string): Message[] {
    const messages = this.getAllMessages();
    return messages[chatId] || [];
  },

  async createChat(participantIds: string[]): Promise<string> {
    const chats = this.getAllChats();
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newChat: Chat = {
      id: chatId,
      participants: participantIds,
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    };
    
    chats.push(newChat);
    this.saveChats(chats);
    
    return chatId;
  },

  async sendMessage(chatId: string, senderId: string, content: string): Promise<void> {
    const chats = this.getAllChats();
    const chat = chats.find(c => c.id === chatId);
    
    if (!chat) {
      throw new Error('Chat not found');
    }
    
    const messages = this.getAllMessages();
    if (!messages[chatId]) {
      messages[chatId] = [];
    }
    
    // Get user info
    const sender = userService.getUser(senderId);
    
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      senderId,
      senderName: sender ? `${sender.firstName} ${sender.lastName}` : 'Unknown',
      senderAvatar: sender?.avatar,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    messages[chatId].push(newMessage);
    this.saveMessages(messages);
    
    // Update chat
    chat.lastMessage = newMessage;
    chat.updatedAt = newMessage.timestamp;
    chat.unreadCount = chat.participants.filter(id => id !== senderId).length;
    this.saveChats(chats);
  },

  markAsRead(chatId: string, userId: string): void {
    const chats = this.getAllChats();
    const chat = chats.find(c => c.id === chatId);
    
    if (!chat) return;
    
    const messages = this.getAllMessages();
    const chatMessages = messages[chatId] || [];
    
    chatMessages.forEach(msg => {
      if (msg.senderId !== userId) {
        msg.read = true;
      }
    });
    
    chat.unreadCount = 0;
    this.saveChats(chats);
    this.saveMessages(messages);
  },
};

