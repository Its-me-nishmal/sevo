import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import VoiceRecorder from '../components/VoiceRecorder';
import VoicePlayer from '../components/VoicePlayer';
import api from '../services/api';
import socket from '../services/socket';
import { Clock } from 'lucide-react';

const Chat = () => {
  const { id: receiverId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [receiver, setReceiver] = useState(null);
  const [isChatPartnerOpened, setIsChatPartnerOpened] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const shouldScrollToBottom = useRef(true);

  // Lifespan
  const [selectedLifespan, setSelectedLifespan] = useState(() => {
    const stored = localStorage.getItem(`chat_lifespan_${receiverId}`);
    return stored || '3h';
  });

  useEffect(() => {
    if (receiverId) {
      localStorage.setItem(`chat_lifespan_${receiverId}`, selectedLifespan);
    }
  }, [selectedLifespan, receiverId]);

  const cycleLifespan = () => {
    setSelectedLifespan(prev => (prev === '3m' ? '3h' : prev === '3h' ? '3d' : '3m'));
  };

  const getLifespanDisplay = (l) => ({ '3m': '3m', '3h': '3h', '3d': '3d' }[l] || '3h');
  const getLifespanColor = (l) => ({
    '3m': 'bg-red-500 hover:bg-red-600',
    '3h': 'bg-amber-500 hover:bg-amber-600',
    '3d': 'bg-blue-500 hover:bg-blue-600',
  }[l] || 'bg-amber-500');

  const handleMessagePlayed = useCallback(async (id) => {
    try { await api.put(`/messages/${id}/read`); } catch (e) { console.error(e); }
  }, []);

  const buildAutoPlayQueue = useCallback((startId) => {
    const idx = messages.findIndex(m => m._id === startId);
    if (idx === -1) return [];
    const queue = [startId];
    const sender = messages[idx].senderId._id;
    for (let i = idx + 1; i < messages.length; i++) {
      if (messages[i].senderId._id === sender) queue.push(messages[i]._id);
      else break;
    }
    return queue;
  }, [messages]);

  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const [autoPlayQueue, setAutoPlayQueue] = useState([]);

  const handleMessageStarted = useCallback((id) => {
    setCurrentPlayingId(id);
    setAutoPlayQueue(buildAutoPlayQueue(id));
  }, [buildAutoPlayQueue]);

  const handleMessageFinished = useCallback((id) => {
    setAutoPlayQueue(prev => {
      const idx = prev.indexOf(id);
      if (idx > -1 && idx < prev.length - 1) {
        setCurrentPlayingId(prev[idx + 1]);
        return prev;
      }
      setCurrentPlayingId(null);
      return [];
    });
  }, []);

  // Scroll
  useEffect(() => {
    if (shouldScrollToBottom.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      shouldScrollToBottom.current = scrollHeight - scrollTop - clientHeight < 50;
    };
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // Load data
  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      try {
        const [userRes, msgRes] = await Promise.all([
          api.get(`/users/${receiverId}`),
          api.get(`/messages/${receiverId}`)
        ]);
        setReceiver(userRes.data);
        setMessages(msgRes.data.map(m => ({
          ...m,
          timeRemainingPercentage: 100,
          isExpired: false,
          _isBeingRemoved: false,
          remainingSeconds: 0,
        })));
      } catch (e) {
        console.error(e);
        navigate('/');
      }
    };

    fetch();

    socket.emit('joinChat', user._id);
    socket.emit('chatOpened', { userId: user._id, chatPartnerId: receiverId });

    socket.on('newVoiceMessage', (msg) => {
      setMessages(p => [...p, { ...msg, timeRemainingPercentage: 100, isExpired: false, _isBeingRemoved: false, remainingSeconds: 0 }]);
    });

    socket.on('messageRead', (msg) => {
      setMessages(p => p.map(m => m._id === msg._id ? { ...m, isRead: msg.isRead, expiresAt: msg.expiresAt } : m));
    });

    socket.on('chatStatus', ({ friendId, status, context }) => {
      if (context === 'chatWindow' && friendId === receiverId) {
        setIsChatPartnerOpened(status === 'opened');
      }
    });

    return () => {
      socket.emit('leaveChat', user._id);
      socket.emit('chatClosed', { userId: user._id, chatPartnerId: receiverId });
      socket.off('newVoiceMessage');
      socket.off('messageRead');
      socket.off('chatStatus');
    };
  }, [receiverId, user, navigate]);

  useEffect(() => {
    messages.forEach(m => {
      if (!m.isRead && m.receiverId._id === user._id) {
        handleMessagePlayed(m._id);
      }
    });
  }, [messages, user, handleMessagePlayed]);

  const handleSendVoiceMessage = async (audioBlob) => {
    if (!audioBlob || !receiverId) return;
    shouldScrollToBottom.current = true;

    const formData = new FormData();
    const ext = audioBlob.type.split('/')[1] || 'webm';
    formData.append('audio', audioBlob, `voice.${ext}`);
    formData.append('receiverId', receiverId);
    formData.append('lifespan', selectedLifespan);

    try {
      await api.post('/messages/send', formData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMessageTimeUpdate = useCallback((id, p, e, r) => {
    setMessages(prev => {
      let changed = false;
      const updated = prev.map(m => {
        if (m._id !== id) return m;
        let newR = m.remainingSeconds;
        if (m.lifespan === '3m' || !m.isRead || Math.abs(m.remainingSeconds - r) >= 30) {
          newR = r;
        }
        if (m.timeRemainingPercentage !== p || m.isExpired !== e || m.remainingSeconds !== newR) {
          changed = true;
          return { ...m, timeRemainingPercentage: p, isExpired: e, remainingSeconds: newR };
        }
        return m;
      });
      return changed ? updated : prev;
    });
  }, []);

  const handleMessageExpired = useCallback((id) => {
    setMessages(p => p.map(m => m._id === id ? { ...m, _isBeingRemoved: true } : m));
    setTimeout(() => setMessages(p => p.filter(m => m._id !== id)), 300);
  }, []);

  const getProgressColor = (sec, read) => {
    if (!read) return 'text-blue-500';
    if (sec > 3 * 3600) return 'text-green-500';
    if (sec > 180) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
        <Header
          title={receiver?.name || 'Chat'}
          showBackButton={true}
          onBack={() => navigate('/')}
          chatPartnerStatus={isChatPartnerOpened ? 'opened' : 'closed'}
        />
      </div>

      {/* Messages */}
      <main
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700"
      >
        {messages.map((message) => {
          const isSender = message.senderId._id === user._id;
          const img = message.senderId.profilePhoto || message.senderId.profileImage || 'https://via.placeholder.com/32';
          const name = message.senderId.name || 'User';
          const c = 2 * Math.PI * 14;
          const offset = c - (message.timeRemainingPercentage / 100) * c;
          const color = getProgressColor(message.remainingSeconds, message.isRead);
          const autoPlay = currentPlayingId === message._id;

          return (
            <div
              key={message._id}
              className={`flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'} ${message._isBeingRemoved ? 'animate-fadeOut' : ''}`}
            >
             {/* Avatar */}
<div className="relative w-8 h-8 flex-shrink-0 p-1 bg-white dark:bg-gray-950 rounded-full">
  <img
    src={img}
    alt={name}
    className="w-full h-full rounded-full object-cover ring-1 ring-gray-300 dark:ring-gray-700"
  />
  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
    <circle cx="16" cy="16" r="14.5" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-gray-200 dark:text-gray-800" />
    <circle
      cx="16" cy="16" r="14.5"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeDasharray={2 * Math.PI * 14.5}
      strokeDashoffset={offset}
      strokeLinecap="round"
      className={`transition-all duration-1000 ease-linear ${color}`}
    />
  </svg>
</div>


              {/* Bubble */}
              <div className={`
                max-w-[75%] px-3 py-2 rounded-2xl text-sm
                ${isSender
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
                }
              `}>
                <p className="text-xs opacity-70 mb-1 font-medium">{name}</p>
                <VoicePlayer
                  audioUrl={message.audioUrl}
                  lifespan={message.lifespan}
                  createdAt={message.createdAt}
                  isRead={message.isRead}
                  expiresAt={message.expiresAt}
                  autoPlay={autoPlay}
                  onTimeUpdate={(p, e, r) => handleMessageTimeUpdate(message._id, p, e, r)}
                  onMessageExpired={() => handleMessageExpired(message._id)}
                  onMessagePlayed={() => handleMessagePlayed(message._id)}
                  onPlayStarted={() => handleMessageStarted(message._id)}
                  onPlayEnded={() => handleMessageFinished(message._id)}
                />
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Bar */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3">
        <div className="flex items-center gap-2">
          {/* Lifespan Button */}
          <button
            onClick={cycleLifespan}
            className={`
              flex items-center gap-1.5 px-3 h-9 rounded-full text-white text-xs font-medium
              transition-all active:scale-95 flex-shrink-0
              ${getLifespanColor(selectedLifespan)}
            `}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{getLifespanDisplay(selectedLifespan)}</span>
          </button>

          {/* Mic on Right */}
          <div className="flex-1" /> {/* Spacer */}
          <div className="flex-shrink-0">
            <VoiceRecorder onSend={handleSendVoiceMessage} />
          </div>
        </div>
      </div>

      {/* CSS */}
      <style jsx>{`
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-8px); }
        }
        .animate-fadeOut { animation: fadeOut 0.3s ease-out forwards; }
        .scrollbar-thin { scrollbar-width: thin; }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        .dark .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(107, 114, 128, 0.5);
        }
      `}</style>
    </div>
  );
};

export default Chat;