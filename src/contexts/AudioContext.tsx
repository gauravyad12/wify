import React, { createContext, useContext, useState, ReactNode } from 'react';

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

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    
    // In a real implementation, you would integrate with YouTube Player API
    // For now, we'll just simulate playback
    console.log('Playing track:', track.title);
  };

  const pauseTrack = () => {
    setIsPlaying(false);
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    // Update actual audio volume here
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
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