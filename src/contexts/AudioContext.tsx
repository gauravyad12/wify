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
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noteIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Web Audio API for generating tones
  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.log('Web Audio API not supported, using fallback');
    }

    return () => {
      if (noteIntervalRef.current) {
        clearInterval(noteIntervalRef.current);
        noteIntervalRef.current = null;
      }
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playTrack = async (track: Track) => {
    setCurrentTrack(track);
    
    try {
      // Clear any existing interval
      if (noteIntervalRef.current) {
        clearInterval(noteIntervalRef.current);
        noteIntervalRef.current = null;
      }

      // Stop any currently playing audio
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }

      // Generate a pleasant musical tone using Web Audio API
      if (audioContextRef.current) {
        const audioContext = audioContextRef.current;
        
        // Resume audio context if suspended (required by some browsers)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        // Create oscillator for background music simulation
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Set up a pleasant musical pattern
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
        
        // Create a simple melody pattern
        const notes = [440, 493.88, 523.25, 587.33, 659.25]; // A, B, C, D, E
        let noteIndex = 0;
        
        const playNextNote = () => {
          if (oscillatorRef.current) {
            const frequency = notes[noteIndex % notes.length];
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            noteIndex++;
          }
        };
        
        // Change notes every 2 seconds and store the interval reference
        noteIntervalRef.current = setInterval(playNextNote, 2000);
        
        // Set volume
        gainNode.gain.setValueAtTime((isMuted ? 0 : volume / 100) * 0.1, audioContext.currentTime);
        
        // Start playing
        oscillator.start();
        oscillatorRef.current = oscillator;
        
        // Handle oscillator end
        oscillator.onended = () => {
          if (noteIntervalRef.current) {
            clearInterval(noteIntervalRef.current);
            noteIntervalRef.current = null;
          }
          setIsPlaying(false);
          oscillatorRef.current = null;
        };
        
        setIsPlaying(true);
        console.log('Playing simulated music for:', track.title);
        
        // Announce the track using speech synthesis
        speakTrackInfo(track);
        
      } else {
        // Fallback: just use speech synthesis
        speakTrackInfo(track);
        setIsPlaying(true);
        
        // Auto-stop after 30 seconds for demo
        setTimeout(() => {
          setIsPlaying(false);
        }, 30000);
      }
      
    } catch (error) {
      console.error('Error playing track:', error);
      // Fallback: just set playing state for animation
      speakTrackInfo(track);
      setIsPlaying(true);
      
      // Auto-stop after 30 seconds
      setTimeout(() => {
        setIsPlaying(false);
      }, 30000);
    }
  };

  const pauseTrack = () => {
    // Clear the note interval
    if (noteIntervalRef.current) {
      clearInterval(noteIntervalRef.current);
      noteIntervalRef.current = null;
    }

    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
    }
    setIsPlaying(false);
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    
    // Update Web Audio API volume if playing
    if (audioContextRef.current && oscillatorRef.current) {
      const gainNodes = audioContextRef.current.destination;
      // Note: In a real implementation, you'd store the gain node reference
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  // Use text-to-speech to announce the track
  const speakTrackInfo = (track: Track) => {
    if ('speechSynthesis' in window && !isMuted) {
      // Stop any current speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(`Now playing ${track.title}. I'm going to dance for you!`);
      utterance.volume = volume / 100;
      utterance.rate = 1;
      utterance.pitch = 1.2; // Slightly higher pitch for feminine voice
      
      // Use a female voice if available
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('hazel')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
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