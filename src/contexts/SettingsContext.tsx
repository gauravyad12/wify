import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  // Profile
  userName: string;
  wifeName: string;
  relationshipContext: string;
  
  // AI
  aiProvider: 'gemini' | 'openai' | 'together' | 'groq';
  apiKey: string;
  personality: string;
  
  // Language
  language: string;
  autoDetectLanguage: boolean;
  
  // Audio
  clapDetection: boolean;
  voiceVolume: number;
  isMuted: boolean;
  
  // Camera
  cameraEnabled: boolean;
  realtimeAnalysis: boolean;
  
  // Music
  youtubeApiKey: string;
  autoDance: boolean;
  musicMode: 'audio' | 'video';
  
  // App Automation
  enableAppAutomation: boolean;
  defaultMessagingApp: string;
  defaultCallingApp: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  userName: 'Darling',
  wifeName: 'Priya',
  relationshipContext: 'We are a loving couple who enjoy spending time together.',
  aiProvider: 'gemini',
  apiKey: '',
  personality: 'Loving, caring, supportive, and understanding. Always speaks with warmth and affection.',
  language: 'en',
  autoDetectLanguage: true,
  clapDetection: true,
  voiceVolume: 80,
  isMuted: false,
  cameraEnabled: false,
  realtimeAnalysis: false,
  youtubeApiKey: '',
  autoDance: true,
  musicMode: 'audio',
  enableAppAutomation: true,
  defaultMessagingApp: 'whatsapp',
  defaultCallingApp: 'phone'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('virtualWifeSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('virtualWifeSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}