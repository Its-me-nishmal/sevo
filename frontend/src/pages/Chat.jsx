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
  const messageRefs = useRef({});
  
  // Auto-play state
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const [autoPlayQueue, setAutoPlayQueue] = useState([]);

  // Lifespan state with localStorage persistence per chat
  const [selectedLifespan, setSelectedLifespan] = useState(() => {
    const stored = localStorage.getItem(`chat_lifespan_${receiverId}`);
    return stored || '3h';
  });

  // Save to localStorage whenever lifespan changes
  useEffect(() => {
    if (receiverId) {
      localStorage.setItem(`chat_lifespan_${receiverId}`, selectedLifespan);
    }
  }, [selectedLifespan, receiverId]);

  // Cycle through lifespan options
  const cycleLifespan = () => {
    setSelectedLifespan(prev => {
      if (prev === '3m') return '3h';
      if (prev === '3h') return '3d';
      return '3m';
    });
  };

  // Get display text for lifespan
  const getLifespanDisplay = (lifespan) => {
    switch (lifespan) {
      case '3m': return 'Whisper (3m)';
      case '3h': return 'Echo (3h)';
      case '3d': return 'Memory (3d)';
      default: return 'Echo (3h)';
    }
  };

  // Get color for lifespan button
  const getLifespanColor = (lifespan) => {
    switch (lifespan) {
      case '3m': return 'bg-red-500 hover:bg-red-600';
      case '3h': return 'bg-yellow-500 hover:bg-yellow-600';
      case '3d': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-yellow-500 hover:bg-yellow-600';
    }
  };

  const calculateTotalLifespanSeconds = useCallback((lifespan) => {
    switch (lifespan) {
      case '3m': return 3 * 60;
      case '3h': return 3 * 60 * 60;
      case '3d': return 3 * 24 * 60 * 60;
      default: return 3 * 60 * 60;
    }
  }, []);

  const handleMessagePlayed = useCallback(async (messageId) => {
    try {
      await api.put(`/messages/${messageId}/read`);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, []);

  // Build auto-play queue: get consecutive messages from same sender
  const buildAutoPlayQueue = useCallback((startMessageId) => {
    const startIndex = messages.findIndex(msg => msg._id === startMessageId);
    if (startIndex === -1) return [];

    const queue = [startMessageId];
    const startSenderId = messages[startIndex].senderId._id;

    // Look forward for consecutive messages from same sender
    for (let i = startIndex + 1; i < messages.length; i++) {
      if (messages[i].senderId._id === startSenderId) {
        queue.push(messages[i]._id);
      } else {
        break; // Stop when sender changes
      }
    }

    return queue;
  }, [messages]);

  // Handle when a message finishes playing
  const handleMessageFinished = useCallback((messageId) => {
    setAutoPlayQueue(prevQueue => {
      const currentIndex = prevQueue.indexOf(messageId);
      
      // If this message is in the queue and there's a next message
      if (currentIndex !== -1 && currentIndex < prevQueue.length - 1) {
        const nextMessageId = prevQueue[currentIndex + 1];
        setCurrentPlayingId(nextMessageId);
        return prevQueue;
      } else {
        // Queue finished
        setCurrentPlayingId(null);
        return [];
      }
    });
  }, []);

  // Handle when user manually starts playing a message
  const handleMessageStarted = useCallback((messageId) => {
    setCurrentPlayingId(messageId);
    const queue = buildAutoPlayQueue(messageId);
    setAutoPlayQueue(queue);
  }, [buildAutoPlayQueue]);

  useEffect(() => {
    if (shouldScrollToBottom.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      shouldScrollToBottom.current = isAtBottom;
    };

    chatContainer.addEventListener('scroll', handleScroll);
    return () => chatContainer.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchReceiver = async () => {
      try {
        const res = await api.get(`/users/${receiverId}`);
        setReceiver(res.data);
      } catch (error) {
        console.error('Error fetching receiver details:', error);
        navigate('/');
      }
    };

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${receiverId}`);
        setMessages(res.data.map(msg => ({
          ...msg,
          timeRemainingPercentage: 100,
          isExpired: false,
          _isBeingRemoved: false,
          remainingSeconds: 0,
        })));
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchReceiver();
    fetchMessages();

    socket.emit('joinChat', user._id);
    socket.emit('chatOpened', { userId: user._id, chatPartnerId: receiverId });

    socket.on('newVoiceMessage', (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, {
        ...newMessage,
        timeRemainingPercentage: 100,
        isExpired: false,
        _isBeingRemoved: false,
        remainingSeconds: 0,
      }]);
    });

    socket.on('messageRead', (updatedMessage) => {
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg._id === updatedMessage._id
            ? { ...msg, isRead: updatedMessage.isRead, expiresAt: updatedMessage.expiresAt }
            : msg
        )
      );
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
      socket.off('chatStatus');
      socket.off('messageRead');
      socket.off('unreadCountsUpdated');
    };
  }, [receiverId, user, navigate]);

  // Effect to mark messages as read when chat is opened
  useEffect(() => {
    if (messages.length > 0 && user) {
      messages.forEach(message => {
        if (!message.isRead && message.receiverId._id === user._id) {
          handleMessagePlayed(message._id);
        }
      });
    }
  }, [messages, user, handleMessagePlayed]);

  const handleSendVoiceMessage = async (audioBlob) => {
    if (!user || !receiverId || !audioBlob) return;

    shouldScrollToBottom.current = true;

    const fileType = audioBlob.type.split('/')[1] || 'webm';
    const formData = new FormData();
    formData.append('audio', audioBlob, `voice_message.${fileType}`);
    formData.append('receiverId', receiverId);
    formData.append('lifespan', selectedLifespan);

    try {
      await api.post('/messages/send', formData);
    } catch (error) {
      console.error('Error sending voice message:', error);
    }
  };

  const handleMessageTimeUpdate = useCallback((messageId, percentage, expired, currentRemainingSeconds) => {
    setMessages(prevMessages => {
      let messageUpdated = false;
      const updatedMessages = prevMessages.map(msg => {
        if (msg._id === messageId) {
          let newRemainingSeconds = msg.remainingSeconds;
          if (msg.lifespan === '3m' || !msg.isRead || Math.abs(msg.remainingSeconds - currentRemainingSeconds) >= 30) {
            newRemainingSeconds = currentRemainingSeconds;
          }

          if (msg.timeRemainingPercentage !== percentage || msg.isExpired !== expired || msg.remainingSeconds !== newRemainingSeconds) {
            messageUpdated = true;
            return { ...msg, timeRemainingPercentage: percentage, isExpired: expired, remainingSeconds: newRemainingSeconds };
          }
        }
        return msg;
      });
      return messageUpdated ? updatedMessages : prevMessages;
    });
  }, []);

  const handleMessageExpired = useCallback((messageId) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg._id === messageId
          ? { ...msg, _isBeingRemoved: true }
          : msg
      )
    );
    setTimeout(() => {
      setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
    }, 500);
  }, []);

  const getProgressColorClass = useCallback((message) => {
    if (!message.isRead) {
      return 'text-blue-500';
    }

    if (message.remainingSeconds > 3 * 24 * 60 * 60) {
      return 'text-green-500';
    } else if (message.remainingSeconds > 3 * 60 * 60) {
      return 'text-green-500';
    } else if (message.remainingSeconds > 3 * 60) {
      return 'text-orange-500';
    } else if (message.remainingSeconds > 0) {
      return 'text-red-500';
    } else {
      return 'text-red-500';
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex-shrink-0">
        <Header
          title={receiver?.name || 'Chat'}
          showBackButton={true}
          onBack={() => navigate('/')}
          chatPartnerStatus={isChatPartnerOpened ? 'opened' : 'closed'}
        />
      </div>

      {/* Messages Container */}
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 custom-scrollbar">
        {messages.map((message) => {
          const isSender = message.senderId._id === user._id;
          const profileImage = message.senderId.profilePhoto || message.senderId.profileImage || 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=NA';
          const senderName = message.senderId.name || 'Unknown User';
          const circumference = 2 * Math.PI * 18;
          const strokeDashoffset = circumference - (message.timeRemainingPercentage / 100) * circumference;
          const progressColorClass = getProgressColorClass(message);
          const shouldAutoPlay = currentPlayingId === message._id;

          return (
            <div
              key={message._id}
              ref={el => (messageRefs.current[message._id] = el)}
              data-message-id={message._id}
              className={`flex items-end gap-3 ${isSender ? 'justify-end' : 'justify-start'} ${message._isBeingRemoved ? 'fade-out' : ''}`}
            >
              {/* Left Avatar (Receiver) */}
              {!isSender && (
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                  <img
                    src={profileImage}
                    alt={senderName}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ring-2 ring-slate-700"
                  />
                  <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                    <circle
                      className="text-slate-700"
                      strokeWidth="2"
                      stroke="currentColor"
                      fill="transparent"
                      r="18"
                      cx="20"
                      cy="20"
                    />
                    <circle
                      className={`${progressColorClass} transition-all duration-1000 ease-linear`}
                      strokeWidth="2"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="18"
                      cx="20"
                      cy="20"
                    />
                  </svg>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[80%] sm:max-w-[70%] p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
                  isSender
                    ? 'bg-gradient-to-br from-blue-500/90 to-purple-600/90 border-blue-400/30 rounded-br-none shadow-lg shadow-blue-500/20'
                    : 'bg-gradient-to-br from-slate-800/90 to-slate-700/90 border-slate-600/30 rounded-bl-none shadow-lg'
                }`}
              >
                <p className={`text-[0.65rem] sm:text-xs font-medium mb-2 ${isSender ? 'text-blue-100' : 'text-slate-300'}`}>
                  {senderName}
                </p>
                <VoicePlayer
                  audioUrl={message.audioUrl}
                  lifespan={message.lifespan}
                  createdAt={message.createdAt}
                  isRead={message.isRead}
                  expiresAt={message.expiresAt}
                  autoPlay={shouldAutoPlay}
                  onTimeUpdate={(percentage, expired, remainingSeconds) => handleMessageTimeUpdate(message._id, percentage, expired, remainingSeconds)}
                  onMessageExpired={() => handleMessageExpired(message._id)}
                  onMessagePlayed={() => handleMessagePlayed(message._id)}
                  onPlayStarted={() => handleMessageStarted(message._id)}
                  onPlayEnded={() => handleMessageFinished(message._id)}
                />
              </div>

              {/* Right Avatar (Sender) */}
              {isSender && (
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                  <img
                    src={profileImage}
                    alt={senderName}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ring-2 ring-slate-700"
                  />
                  <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                    <circle
                      className="text-slate-700"
                      strokeWidth="2"
                      stroke="currentColor"
                      fill="transparent"
                      r="18"
                      cx="20"
                      cy="20"
                    />
                    <circle
                      className={`${progressColorClass} transition-all duration-1000 ease-linear`}
                      strokeWidth="2"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="18"
                      cx="20"
                      cy="20"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Footer - Input Area */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-t border-slate-700/50 backdrop-blur-xl bg-slate-900/95">
        <div className="flex items-center gap-3">
          {/* Lifespan Toggle Button */}
          <button
            onClick={cycleLifespan}
            className={`flex items-center justify-center gap-2 h-9 sm:h-10 px-3 sm:px-4 rounded-full text-white text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95 flex-shrink-0 ${getLifespanColor(selectedLifespan)}`}
            title="Click to change message lifespan"
          >
            <Clock className="w-4 h-4" />
            <span className="whitespace-nowrap">{getLifespanDisplay(selectedLifespan)}</span>
          </button>

          {/* Voice Recorder */}
          <div className="flex-1">
            <VoiceRecorder onSend={handleSendVoiceMessage} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;