import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Loader, Zap, Send, MessageCircle } from 'lucide-react';
import { useAI } from '../contexts/AIContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAudio } from '../contexts/AudioContext';

export default function ControlPanel() {
  const { 
    isListening, 
    startListening, 
    stopListening, 
    isProcessing,
    sendMessage,
    currentResponse
  } = useAI();
  
  const { settings } = useSettings();
  const { isMuted, toggleMute } = useAudio();
  const [textInput, setTextInput] = useState('');
  const [showChat, setShowChat] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      await sendMessage(textInput);
      setTextInput('');
    }
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Wife Status */}
      <div className="flex-1 flex flex-col justify-center items-center space-y-4">
        <div className="text-center">
          <h3 className="text-white font-semibold text-lg mb-2">{settings.wifeName}</h3>
          <div className="space-y-2">
            {isProcessing && (
              <div className="flex items-center justify-center space-x-2 text-purple-300">
                <Loader className="animate-spin" size={16} />
                <span className="text-sm">Thinking...</span>
              </div>
            )}
            
            {isListening && (
              <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg animate-pulse">
                <div className="flex items-center justify-center space-x-2">
                  <div className="voice-wave"></div>
                  <div className="voice-wave"></div>
                  <div className="voice-wave"></div>
                  <div className="voice-wave"></div>
                  <div className="voice-wave"></div>
                </div>
                <p className="text-xs mt-1">Listening...</p>
              </div>
            )}
            
            {!isListening && !isProcessing && (
              <div className="text-white/60 text-sm text-center">
                <p>{settings.clapDetection ? '👏 Clap to activate' : 'Press voice button'}</p>
                <p className="text-xs text-white/40 mt-1">Ready to help you</p>
              </div>
            )}
          </div>
        </div>

        {/* Clap Detection Status */}
        {settings.clapDetection && (
          <div className="flex items-center space-x-2 text-green-400 text-xs">
            <Zap size={12} />
            <span>Clap detection active</span>
          </div>
        )}

        {/* Current Response Display */}
        {currentResponse && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 max-h-32 overflow-y-auto">
            <p className="text-white/90 text-sm">{currentResponse}</p>
          </div>
        )}
      </div>

      {/* Chat Input Toggle */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
      >
        <MessageCircle size={16} />
        <span className="text-sm">{showChat ? 'Hide Chat' : 'Show Chat'}</span>
      </button>

      {/* Chat Input */}
      {showChat && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </motion.div>
      )}

      {/* Voice Controls */}
      <div className="flex space-x-2">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-all ${
            isListening 
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          <span className="font-medium">{isListening ? 'Stop' : 'Talk'}</span>
        </button>
        
        <button
          onClick={toggleMute}
          className={`p-3 rounded-lg transition-colors ${
            isMuted 
              ? 'bg-gray-600 hover:bg-gray-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white/5 p-2 rounded text-white/60 text-center">
          <p className="font-medium">Voice Commands</p>
          <p>"Play music", "Open camera"</p>
        </div>
        <div className="bg-white/5 p-2 rounded text-white/60 text-center">
          <p className="font-medium">App Control</p>
          <p>"Message John", "Call mom"</p>
        </div>
      </div>

      {/* AI Provider Status */}
      <div className="text-center">
        <span className="text-white/40 text-xs">
          AI: {settings.aiProvider.toUpperCase()} | Lang: {settings.language.toUpperCase()}
        </span>
      </div>
    </div>
  );
}