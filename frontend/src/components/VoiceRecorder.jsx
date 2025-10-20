

// ============================================
// VoiceRecorder Component
// ============================================
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Trash2, Play, Pause, Radio } from 'lucide-react';
import useRecorder from '../hooks/useRecorder';

const VoiceRecorder = ({ onSend }) => {
  const [mediaBlobUrl, isRecording, startRecording, stopRecording, audioBlob, resetRecorder] = useRecorder();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (mediaBlobUrl && audioRef.current) {
      audioRef.current.src = mediaBlobUrl;
    }
  }, [mediaBlobUrl]);

  const handleSend = () => {
    if (audioBlob) {
      const filename = `audio-${Date.now()}.wav`;
      const file = new File([audioBlob], filename, { type: audioBlob.type });
      onSend(file);
      resetRecorder();
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex items-center gap-3 w-full">
      {!mediaBlobUrl ? (
        <div className="flex items-center gap-3 w-full">
          {/* Record Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`group relative flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium transition-all duration-300 border overflow-hidden ${
              isRecording
                ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white border-red-400 shadow-lg shadow-red-500/50 scale-105'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-blue-400 hover:scale-105 shadow-lg hover:shadow-blue-500/50'
            }`}
          >
            <div className={`absolute inset-0 bg-white/20 ${isRecording ? 'animate-pulse' : ''}`} />
            {isRecording ? (
              <>
                <Radio className="w-5 h-5 relative z-10 animate-pulse" />
                <span className="relative z-10">Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Record</span>
              </>
            )}
          </button>

          {isRecording && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-red-400 font-medium animate-pulse">
                Recording...
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center w-full rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 px-4 py-3 gap-3 shadow-lg">
          <audio ref={audioRef} onEnded={() => setIsPlaying(false)} preload="auto" />

          {/* Play / Pause */}
          <button
            onClick={() => {
              if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
              } else {
                audioRef.current.play();
                setIsPlaying(true);
              }
            }}
            className="group relative p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-blue-500/50"
          >
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white relative z-10" fill="white" />
            ) : (
              <Play className="w-4 h-4 text-white relative z-10" fill="white" />
            )}
          </button>

          {/* Voice Note Status */}
          <div className="flex-1 flex items-center gap-2">
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-4 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-sm text-slate-300 font-medium">
              Voice note ready
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Delete */}
            <button
              onClick={resetRecorder}
              className="group relative p-2.5 rounded-xl bg-slate-700/50 hover:bg-red-500/20 border border-slate-600 hover:border-red-500/50 transition-all duration-300 hover:scale-110"
              title="Discard"
            >
              <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors duration-200" />
            </button>

            {/* Send */}
            <button
              onClick={handleSend}
              className="group relative p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-green-500/50"
              title="Send"
            >
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Send className="w-4 h-4 text-white relative z-10" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder