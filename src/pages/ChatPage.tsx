import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatApi, ChatMessage } from '../api/client';
import { Send, MessageCircle } from 'lucide-react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/chat';

// Demo messages
const DEMO_MESSAGES: ChatMessage[] = [
  { id: 1, username: 'Анна', message: 'Привет! Кто-нибудь смотрел новые коллекции?', timestamp: '2024-01-20 10:30' },
  { id: 2, username: 'Максим', message: 'Да, есть классные куртки в Zara', timestamp: '2024-01-20 10:32' },
  { id: 3, username: 'Ольга', message: 'А я ищу зимние ботинки, посоветуйте', timestamp: '2024-01-20 10:35' },
];

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [useDemo, setUseDemo] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await chatApi.getMessages();
      setMessages(data);
      setUseDemo(false);
    } catch {
      setMessages(DEMO_MESSAGES);
      setUseDemo(true);
    }
  };

  const connectWebSocket = () => {
    try {
      const token = localStorage.getItem('token');
      const ws = new WebSocket(`${WS_URL}?token=${token}`);

      ws.onopen = () => {
        setWsConnected(true);
        setUseDemo(false);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          setMessages(prev => [...prev, msg]);
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
      };

      ws.onerror = () => {
        setWsConnected(false);
        setUseDemo(true);
      };

      wsRef.current = ws;
    } catch {
      setUseDemo(true);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: newMessage }));
    } else {
      // Demo mode - add message locally
      const msg: ChatMessage = {
        id: messages.length + 1,
        username: user?.username || 'Аноним',
        message: newMessage,
        timestamp: new Date().toLocaleString('ru-RU'),
      };
      setMessages(prev => [...prev, msg]);
    }

    setNewMessage('');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col h-[calc(100vh-80px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="w-7 h-7" />
          Чат
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-gray-300'}`}></span>
          <span className="text-xs text-gray-500">
            {wsConnected ? 'Подключено к серверу' : useDemo ? 'Демо-режим' : 'Отключено'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 bg-white rounded-lg p-3 border">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Нет сообщений</p>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.username === user?.username ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                msg.username === user?.username
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {msg.username !== user?.username && (
                  <p className="text-xs font-medium mb-0.5 opacity-70">{msg.username}</p>
                )}
                <p className="text-sm">{msg.message}</p>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 px-1">{msg.timestamp}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          placeholder="Введите сообщение..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
