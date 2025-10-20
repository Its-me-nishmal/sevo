import { useReactMediaRecorder } from 'react-media-recorder';
import { useState, useEffect } from 'react';

const useRecorder = () => {
  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    mimeType: 'audio/webm', // ✅ use a browser-supported type
  });

  const [audioBlob, setAudioBlob] = useState(null);

  useEffect(() => {
    if (mediaBlobUrl) {
      fetch(mediaBlobUrl)
        .then(res => res.blob())
        .then(blob => {
          // ✅ ensure blob type matches actual data
          const correctBlob = new Blob([blob], { type: 'audio/webm' });
          setAudioBlob(correctBlob);
        });
    } else {
      setAudioBlob(null);
    }
  }, [mediaBlobUrl]);

  const resetRecorder = () => {
    clearBlobUrl();
    setAudioBlob(null);
  };

  return [
    mediaBlobUrl,
    status === 'recording',
    startRecording,
    stopRecording,
    audioBlob,
    resetRecorder,
  ];
};

export default useRecorder;
