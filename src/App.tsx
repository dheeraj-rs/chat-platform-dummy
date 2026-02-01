import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { supabase } from './lib/supabase';
import type { Chat } from './lib/supabase';
import './App.css';

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading chats:', error);
      return;
    }

    setChats(data || []);

    if (data && data.length > 0 && !currentChatId) {
      setCurrentChatId(data[0].id);
    }
  };

  const createNewChat = async () => {
    const { data, error } = await supabase
      .from('chats')
      .insert([{ title: 'New Chat' }])
      .select()
      .single();

    if (error) {
      console.error('Error creating chat:', error);
      return;
    }

    if (data) {
      setChats([data, ...chats]);
      setCurrentChatId(data.id);
    }
  };

  const deleteChat = async (chatId: string) => {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId);

    if (error) {
      console.error('Error deleting chat:', error);
      return;
    }

    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);

    if (currentChatId === chatId) {
      setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
    }
  };

  const updateChatTitle = async (chatId: string, title: string) => {
    const { error } = await supabase
      .from('chats')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', chatId);

    if (error) {
      console.error('Error updating chat title:', error);
      return;
    }

    setChats(chats.map(chat =>
      chat.id === chatId ? { ...chat, title } : chat
    ));
  };

  return (
    <div className="app">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <ChatArea
        chatId={currentChatId}
        onUpdateTitle={updateChatTitle}
        sidebarCollapsed={sidebarCollapsed}
      />
    </div>
  );
}

export default App;
