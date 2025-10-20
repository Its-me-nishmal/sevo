// ============================================
// VoicePlayer Component with Auto-play
// ============================================
import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Clock } from 'lucide-react';
import { addMinutes, addHours, addDays, differenceInSeconds } from 'date-fns';

const VoicePlayer = ({ 
  audioUrl, 
  lifespan, 
  createdAt, 
  expiresAt, 
  isRead, 
  autoPlay = false,          // NEW: Auto-play prop
  onTimeUpdate, 
  onMessageExpired, 
  onMessagePlayed,
  onPlayStarted,             // NEW: Callback when play starts
  onPlayEnded                // NEW: Callback when play ends
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const hasExpiredRef = useRef(false);
  const hasAutoPlayedRef = useRef(false);  // NEW: Track if auto-played

  // NEW: Auto-play effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || hasExpiredRef.current) return;

    // If autoPlay is true and we haven't auto-played yet
    if (autoPlay && !hasAutoPlayedRef.current && !isPlaying) {
      // Wait for audio to be ready
      const playAudio = async () => {
        try {
          await audio.play();
          setIsPlaying(true);
          hasAutoPlayedRef.current = true;
          if (onPlayStarted) onPlayStarted();
        } catch (error) {
          console.error('Auto-play failed:', error);
        }
      };

      // If metadata is already loaded, play immediately
      if (audio.readyState >= 2) {
        playAudio();
      } else {
        // Otherwise wait for metadata to load
        const onCanPlay = () => {
          playAudio();
          audio.removeEventListener('canplay', onCanPlay);
        };
        audio.addEventListener('canplay', onCanPlay);
        
        return () => audio.removeEventListener('canplay', onCanPlay);
      }
    }

    // Reset auto-play flag when autoPlay becomes false
    if (!autoPlay) {
      hasAutoPlayedRef.current = false;
    }
  }, [autoPlay, isPlaying, onPlayStarted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      hasAutoPlayedRef.current = false;  // Reset for next time
      
      // Call both callbacks
      if (onMessagePlayed) onMessagePlayed();
      if (onPlayEnded) onPlayEnded();     // NEW: Trigger next message
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl, onMessagePlayed, onPlayEnded]);

  useEffect(() => {
    if (!createdAt || !lifespan || !expiresAt) return;

    const messageSentTime = new Date(createdAt);
    const messageExpiresAt = new Date(expiresAt);

    let totalLifespanSeconds;
    if (!isRead) {
      totalLifespanSeconds = 7 * 24 * 60 * 60;
    } else {
      switch (lifespan) {
        case '3m':
          totalLifespanSeconds = 3 * 60;
          break;
        case '3h':
          totalLifespanSeconds = 3 * 60 * 60;
          break;
        case '3d':
          totalLifespanSeconds = 3 * 24 * 60 * 60;
          break;
        default:
          totalLifespanSeconds = 3 * 60 * 60;
      }
    }

    let initialRemainingSeconds = differenceInSeconds(messageExpiresAt, new Date());

    const calculateTimeRemaining = () => {
      const now = new Date();
      const currentRemainingSeconds = differenceInSeconds(messageExpiresAt, now);
      
      let timeRemainingPercentage = 100;
      let expired = false;

      if (currentRemainingSeconds <= 0) {
        timeRemainingPercentage = 0;
        expired = true;
        if (!hasExpiredRef.current) {
          hasExpiredRef.current = true;
          onMessageExpired && onMessageExpired();
        }
      } else {
        let lifespanStartTime;
        if (!isRead) {
          lifespanStartTime = messageSentTime;
        } else {
          lifespanStartTime = new Date(messageExpiresAt.getTime() - (totalLifespanSeconds * 1000));
        }
        
        const elapsedSeconds = differenceInSeconds(now, lifespanStartTime);
        timeRemainingPercentage = ((totalLifespanSeconds - elapsedSeconds) / totalLifespanSeconds) * 100;
        if (timeRemainingPercentage < 0) timeRemainingPercentage = 0;
        hasExpiredRef.current = false;
      }

      onTimeUpdate && onTimeUpdate(timeRemainingPercentage, expired, currentRemainingSeconds);
    };

    const updateInterval = (initialRemainingSeconds <= 3 * 60) ? 1000 : 30 * 1000;
    
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, updateInterval);
    return () => clearInterval(interval);
  }, [lifespan, createdAt, expiresAt, isRead, onTimeUpdate, onMessageExpired]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (audio && !hasExpiredRef.current) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play();
        setIsPlaying(true);
        // NEW: Call onPlayStarted when manually playing
        if (onPlayStarted) onPlayStarted();
      }
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        disabled={hasExpiredRef.current}
        className={`group relative p-3 rounded-xl transition-all duration-300 ${
          hasExpiredRef.current 
            ? 'bg-slate-800 cursor-not-allowed opacity-50' 
            : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-110 shadow-lg hover:shadow-blue-500/50'
        }`}
      >
        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {isPlaying ? (
          <Pause className="w-4 h-4 text-white relative z-10" fill="white" />
        ) : (
          <Play className="w-4 h-4 text-white relative z-10" fill="white" />
        )}
      </button>

      {/* Progress Bar */}
      <div className="flex-1 space-y-1">
        <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-700/30 to-slate-600/30" />
          <div
            className="relative h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-200 shadow-lg shadow-blue-500/50"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
        
        {/* Time Display */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">
            {formatTime(currentTime)}
          </span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-400 font-medium">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Status Indicator */}
      {hasExpiredRef.current && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30">
          <Clock className="w-3 h-3 text-red-400" />
          <span className="text-xs text-red-400 font-medium">Expired</span>
        </div>
      )}
    </div>
  );
};

export default VoicePlayer;