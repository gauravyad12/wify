import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Send, Loader } from 'lucide-react';
import { useAI } from '../contexts/AIContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAudio } from '../contexts/AudioContext';

export default function ControlPanel() {
  const { 
    sendMessage, 
    isListening, 
    startListening, 
    stopListening, 
    currentResponse,
    isProcessing 
  } = useAI();
  
  const { settings } = useSettings();
  const { isMuted, toggleMute } = useAudio();
  const [textInput, setTextInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{id: string, type: 'user' | 'ai', message: string, timestamp: Date}>>([]);

  const handleSendMessage = async () => {
    if (!textInput.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      message: textInput,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    
    try {
      const response = await sendMessage(textInput);
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        message: response,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
    
    setTextInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Chat History */}
      <div className="flex-1 overflow-y-auto space-y-2 bg-black/20 rounded-lg p-3">
        <h3 className="text-white font-semibold text-sm mb-2">Conversation</h3>
        {chatHistory.length === 0 ? (
          <p className="text-white/50 text-xs">Start a conversation with your virtual wife...</p>
        ) : (
          chatHistory.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-2 rounded text-xs ${
                msg.type === 'user' 
                  ? 'bg-purple-600/50 text-white ml-4' 
                  : 'bg-blue-600/50 text-white mr-4'
              }`}
            >
              <p>{msg.message}</p>
              <span className="text-xs opacity-50">
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </motion.div>
          ))
        )}
        {isProcessing && (
          <div className="flex items-center space-x-2 text-white/70 text-xs">
            <Loader className="animate-spin" size={12} />
            <span>Thinking...</span>
          </div>
        )}
      </div>

      {/* Text Input */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={handleSendMessage}
          disabled={!textInput.trim() || isProcessing}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
        >
          <Send size={16} />
        </button>
      </div>

      {/* Voice Controls */}
      <div className="flex space-x-2">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg transition-colors ${
            isListening 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          <span className="text-sm">{isListening ? 'Stop' : 'Talk'}</span>
        </button>
        
        <button
          onClick={toggleMute}
          className={`p-2 rounded-lg transition-colors ${
            isMuted 
              ? 'bg-gray-600 hover:bg-gray-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* Current Response */}
      {currentResponse && (
        <div className="bg-blue-600/20 text-white p-3 rounded-lg">
          <p className="text-xs font-semibold mb-1">Current Response:</p>
          <p className="text-sm">{currentResponse}</p>
        </div>
      )}

      {/* AI Provider Status */}
      <div className="text-center">
        <span className="text-white/50 text-xs">
          Using: {settings.aiProvider.toUpperCase()}
        </span>
      </div>
    </div>
  );
}