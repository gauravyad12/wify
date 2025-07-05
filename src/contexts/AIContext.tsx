import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { useSettings } from './SettingsContext';
import { AppAutomation, parseAppCommand } from '../utils/appAutomation';
import { BrowserAutomation, parseBrowserCommand } from '../utils/browserAutomation';

interface AIContextType {
  sendMessage: (message: string) => Promise<string>;
  analyzeImage: (imageData: string) => Promise<string>;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  currentResponse: string;
  currentEmotion: string;
  isProcessing: boolean;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [isListening, setIsListening] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [currentEmotion, setCurrentEmotion] = useState('default');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = getLanguageCode(settings.language);

      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        if (event.results[event.results.length - 1].isFinal) {
          sendMessage(transcript);
          setIsListening(false);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [settings.language]);

  // Clap detection
  useEffect(() => {
    if (!settings.clapDetection) return;

    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let microphone: MediaStreamAudioSourceNode;
    let dataArray: Uint8Array;

    const initClapDetection = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        
        microphone.connect(analyser);
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        const detectClap = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          
          if (average > 100) { // Clap threshold
            if (!isListening) {
              startListening();
            }
          }
          
          requestAnimationFrame(detectClap);
        };
        
        detectClap();
      } catch (error) {
        console.error('Error initializing clap detection:', error);
      }
    };

    initClapDetection();

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [settings.clapDetection, isListening]);

  const getLanguageCode = (lang: string): string => {
    const langMap: { [key: string]: string } = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'bh': 'hi-IN', // Bhojpuri uses Hindi recognition
      'fr': 'fr-FR',
      'ta': 'ta-IN',
      'ur': 'ur-PK',
      'ar': 'ar-SA',
      'bn': 'bn-BD',
      'es': 'es-ES',
      'de': 'de-DE',
      'id': 'id-ID',
      'ja': 'ja-JP'
    };
    return langMap[lang] || 'en-US';
  };

  const detectEmotion = (text: string): string => {
    const emotions = {
      happy: ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'love'],
      sad: ['sad', 'cry', 'upset', 'depressed', 'down', 'hurt'],
      angry: ['angry', 'mad', 'furious', 'annoyed', 'frustrated'],
      laughing: ['funny', 'hilarious', 'laugh', 'joke', 'haha'],
      greeting: ['hello', 'hi', 'hey', 'good morning', 'good evening'],
      kiss: ['kiss', 'love you', 'romantic', 'darling', 'sweetheart'],
      praying: ['pray', 'god', 'bless', 'spiritual', 'divine'],
      dancing: ['music', 'dance', 'song', 'play']
    };

    const lowerText = text.toLowerCase();
    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return emotion;
      }
    }
    return 'default';
  };

  const handleAutomationCommands = async (message: string): Promise<string | null> => {
    // Check for app automation commands
    const appCommand = parseAppCommand(message);
    if (appCommand) {
      const result = await AppAutomation.executeCommand(appCommand);
      return `${result}. Is there anything else you'd like me to help you with?`;
    }

    // Check for browser automation commands
    const browserCommand = parseBrowserCommand(message);
    if (browserCommand) {
      const result = await BrowserAutomation.executeCommand(browserCommand);
      return `${result}. Let me know if you need anything else!`;
    }

    return null;
  };

  const sendMessage = async (message: string): Promise<string> => {
    setIsProcessing(true);
    setCurrentEmotion(detectEmotion(message));

    try {
      // Check for automation commands first
      const automationResponse = await handleAutomationCommands(message);
      if (automationResponse) {
        setCurrentResponse(automationResponse);
        speakResponse(automationResponse);
        saveTrainingData(message, automationResponse);
        return automationResponse;
      }

      // Regular AI conversation
      let response = '';
      const context = `You are ${settings.wifeName}, a loving virtual wife. Your personality: ${settings.personality}. User context: ${settings.relationshipContext}. User's name: ${settings.userName}. 

You can help with:
- Opening apps (Windows/Mobile)
- Messaging and calling contacts
- Playing music and entertainment
- General conversation and support

Respond in a caring, loving manner as a wife would. Keep responses concise and natural.`;

      switch (settings.aiProvider) {
        case 'gemini':
          if (settings.apiKey) {
            const genAI = new GoogleGenerativeAI(settings.apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const result = await model.generateContent(`${context}\n\nUser: ${message}`);
            response = result.response.text();
          }
          break;

        case 'openai':
          if (settings.apiKey) {
            const openai = new OpenAI({ apiKey: settings.apiKey, dangerouslyAllowBrowser: true });
            const completion = await openai.chat.completions.create({
              model: 'gpt-3.5-turbo',
              messages: [
                { role: 'system', content: context },
                { role: 'user', content: message }
              ]
            });
            response = completion.choices[0]?.message?.content || '';
          }
          break;

        case 'groq':
          if (settings.apiKey) {
            const groq = new Groq({ apiKey: settings.apiKey, dangerouslyAllowBrowser: true });
            const completion = await groq.chat.completions.create({
              model: 'mixtral-8x7b-32768',
              messages: [
                { role: 'system', content: context },
                { role: 'user', content: message }
              ]
            });
            response = completion.choices[0]?.message?.content || '';
          }
          break;

        case 'together':
          if (settings.apiKey) {
            const response_data = await fetch('https://api.together.xyz/inference', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${settings.apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'togethercomputer/RedPajama-INCITE-Chat-3B-v1',
                prompt: `${context}\n\nUser: ${message}\nAssistant:`,
                max_tokens: 512
              })
            });
            const data = await response_data.json();
            response = data.output?.choices?.[0]?.text || '';
          }
          break;
      }

      if (!response) {
        response = `Hello ${settings.userName}! I'm ${settings.wifeName}. I'd love to chat with you, but I need an API key to be configured in settings first.`;
      }

      setCurrentResponse(response);
      speakResponse(response);
      saveTrainingData(message, response);

      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      const errorResponse = `I'm sorry ${settings.userName}, I'm having trouble connecting right now. Please check the settings and try again.`;
      setCurrentResponse(errorResponse);
      speakResponse(errorResponse);
      return errorResponse;
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (response: string) => {
    if ('speechSynthesis' in window && !settings.isMuted) {
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.lang = getLanguageCode(settings.language);
      utterance.volume = settings.voiceVolume / 100;
      speechSynthesis.speak(utterance);
    }
  };

  const analyzeImage = async (imageData: string): Promise<string> => {
    if (!settings.apiKey || settings.aiProvider !== 'gemini') {
      return 'Image analysis requires Google Gemini API key';
    }

    try {
      const genAI = new GoogleGenerativeAI(settings.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
      
      const result = await model.generateContent([
        `As ${settings.wifeName}, analyze this image and respond lovingly to ${settings.userName}. Describe what you see and how it makes you feel.`,
        {
          inlineData: {
            data: imageData.split(',')[1],
            mimeType: 'image/jpeg'
          }
        }
      ]);
      
      return result.response.text();
    } catch (error) {
      console.error('Error analyzing image:', error);
      return 'I had trouble seeing that image, my love. Could you try again?';
    }
  };

  const startListening = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      setIsListening(false);
      recognition.stop();
    }
  };

  const saveTrainingData = (input: string, output: string) => {
    const trainingData = {
      timestamp: new Date().toISOString(),
      user: settings.userName,
      input,
      output,
      language: settings.language,
      emotion: currentEmotion
    };

    // Save to localStorage (in a real app, this would be sent to a server)
    const existingData = JSON.parse(localStorage.getItem('trainingData') || '[]');
    existingData.push(trainingData);
    localStorage.setItem('trainingData', JSON.stringify(existingData));
  };

  return (
    <AIContext.Provider value={{
      sendMessage,
      analyzeImage,
      isListening,
      startListening,
      stopListening,
      currentResponse,
      currentEmotion,
      isProcessing
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}