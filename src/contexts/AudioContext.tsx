import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

interface Track {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
}

interface AudioContextType {
  isPlaying: boolean;
  currentTrack: Track | null;
  volume: number;
  isMuted: boolean;
  playTrack: (track: Track) => void;
  pauseTrack: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [volume, setVolumeState] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.crossOrigin = 'anonymous';
    audioRef.current.volume = volume / 100;
    
    // Audio event listeners
    const audio = audioRef.current;
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: any) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
    };
    
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const playTrack = async (track: Track) => {
    setCurrentTrack(track);
    
    if (audioRef.current) {
      try {
        // For YouTube videos, we'll use a placeholder audio or try to extract audio
        // In a real implementation, you'd use YouTube API or a service to get audio stream
        
        // For now, we'll simulate with a placeholder audio file or use text-to-speech
        // to announce the song is playing
        const audioUrl = getAudioUrl(track);
        
        audioRef.current.src = audioUrl;
        audioRef.current.currentTime = 0;
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              console.log('Playing track:', track.title);
            })
            .catch(error => {
              console.error('Error playing audio:', error);
              // Fallback: use text-to-speech to announce the song
              speakTrackInfo(track);
              setIsPlaying(true); // Set playing state for animation
            });
        }
      } catch (error) {
        console.error('Error setting up audio:', error);
        speakTrackInfo(track);
        setIsPlaying(true);
      }
    }
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  // Helper function to get audio URL (placeholder implementation)
  const getAudioUrl = (track: Track): string => {
    // In a real implementation, you would:
    // 1. Use YouTube API to get audio stream
    // 2. Use a service like youtube-dl or similar
    // 3. Use embedded player with audio extraction
    
    // For now, return a placeholder or use a sample audio file
    return '/sample-music.mp3'; // You would need to add this file to public folder
  };

  // Fallback: use text-to-speech to announce the track
  const speakTrackInfo = (track: Track) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`Now playing: ${track.title}`);
      utterance.volume = volume / 100;
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <AudioContext.Provider value={{
      isPlaying,
      currentTrack,
      volume,
      isMuted,
      playTrack,
      pauseTrack,
      setVolume,
      toggleMute
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}