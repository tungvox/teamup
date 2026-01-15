import { supabase } from '../../lib/supabase';
import { Message, Chat } from '../../types';
import { getUserProfile } from '../users/userProfileService';

// Mapper functions
function mapMessageFromDB(row: any): Message {
  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderAvatar: row.sender_avatar,
    content: row.content,
    timestamp: row.timestamp,
    read: row.read,
  };
}

function mapChatFromDB(row: any): Chat {
  return {
    id: row.id,
    participants: row.participants,
    unreadCount: row.unread_count,
    updatedAt: row.updated_at,
  };
}

export const messageService = {
  async getChatMessages(chatId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: true });
    
    if (error) throw error;
    return data.map(mapMessageFromDB);
  },

  async sendMessage(chatId: string, senderId: string, content: string): Promise<Message> {
    // Get user info
    const user = await getUserProfile(senderId);
    
    const messageData = {
      chat_id: chatId,
      sender_id: senderId,
      sender_name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      sender_avatar: user?.avatar || null,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update chat's last message and unread count
    await supabase
      .from('chats')
      .update({
        last_message_id: data.id,
        updated_at: new Date().toISOString(),
        unread_count: 1, // Simplified - should count unread for other participants
      })
      .eq('id', chatId);
    
    return mapMessageFromDB(data);
  },

  async getUserChats(userId: string): Promise<Chat[]> {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .contains('participants', [userId])
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    // Fetch last message for each chat
    const chatsWithMessages = await Promise.all(
      data.map(async (chat) => {
        let lastMessage: Message | undefined;
        if (chat.last_message_id) {
          const { data: msgData } = await supabase
            .from('messages')
            .select('*')
            .eq('id', chat.last_message_id)
            .single();
          if (msgData) lastMessage = mapMessageFromDB(msgData);
        }
        return { ...mapChatFromDB(chat), lastMessage };
      })
    );
    
    return chatsWithMessages;
  },

  async createChat(participantIds: string[]): Promise<string> {
    const { data, error } = await supabase
      .from('chats')
      .insert({
        participants: participantIds,
        unread_count: 0,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data.id;
  },

  async markAsRead(chatId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('chat_id', chatId)
      .neq('sender_id', userId);
    
    if (error) throw error;
    
    await supabase
      .from('chats')
      .update({ unread_count: 0 })
      .eq('id', chatId);
  },
};
