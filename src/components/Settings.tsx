import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, User, Brain, Globe, Mic, Camera, Music, Smartphone } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const [activeSection, setActiveSection] = useState<'profile' | 'ai' | 'language' | 'audio' | 'camera' | 'music' | 'automation'>('profile');

  const handleSave = () => {
    // Settings are automatically saved via context
    alert('Settings saved successfully!');
  };

  const sections = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'ai', icon: Brain, label: 'AI Settings' },
    { id: 'language', icon: Globe, label: 'Language' },
    { id: 'audio', icon: Mic, label: 'Audio' },
    { id: 'camera', icon: Camera, label: 'Camera' },
    { id: 'music', icon: Music, label: 'Music' },
    { id: 'automation', icon: Smartphone, label: 'Automation' }
  ];

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 bg-black/20 backdrop-blur-md p-4">
        <h2 className="text-white font-bold text-lg mb-4">Settings</h2>
        <div className="space-y-2">
          {sections.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id as any)}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                activeSection === id
                  ? 'bg-purple-600 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-2xl"
        >
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-white text-xl font-semibold">Profile Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Your Name</label>
                  <input
                    type="text"
                    value={settings.userName}
                    onChange={(e) => updateSettings({ userName: e.target.value })}
                    className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Wife's Name</label>
                  <input
                    type="text"
                    value={settings.wifeName}
                    onChange={(e) => updateSettings({ wifeName: e.target.value })}
                    className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter wife's name"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Relationship Details</label>
                  <textarea
                    value={settings.relationshipContext}
                    onChange={(e) => updateSettings({ relationshipContext: e.target.value })}
                    rows={4}
                    className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Tell your wife about your relationship, interests, and preferences..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'ai' && (
            <div className="space-y-6">
              <h3 className="text-white text-xl font-semibold">AI Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">AI Provider</label>
                  <select
                    value={settings.aiProvider}
                    onChange={(e) => updateSettings({ aiProvider: e.target.value as any })}
                    className="w-full bg-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="gemini">Google Gemini (Default)</option>
                    <option value="openai">OpenAI GPT</option>
                    <option value="together">Together AI</option>
                    <option value="groq">Groq</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">API Key</label>
                  <input
                    type="password"
                    value={settings.apiKey}
                    onChange={(e) => updateSettings({ apiKey: e.target.value })}
                    className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter your API key"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Personality</label>
                  <textarea
                    value={settings.personality}
                    onChange={(e) => updateSettings({ personality: e.target.value })}
                    rows={3}
                    className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Describe your wife's personality..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'language' && (
            <div className="space-y-6">
              <h3 className="text-white text-xl font-semibold">Language Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Primary Language</label>
                  <select
                    value={settings.language}
                    onChange={(e) => updateSettings({ language: e.target.value })}
                    className="w-full bg-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="en">English (Default)</option>
                    <option value="hi">Hindi</option>
                    <option value="bh">Bhojpuri</option>
                    <option value="fr">French</option>
                    <option value="ta">Tamil</option>
                    <option value="ur">Urdu</option>
                    <option value="ar">Arabic</option>
                    <option value="bn">Bengali</option>
                    <option value="es">Spanish</option>
                    <option value="de">German</option>
                    <option value="id">Indonesian</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="autoDetect"
                    checked={settings.autoDetectLanguage}
                    onChange={(e) => updateSettings({ autoDetectLanguage: e.target.checked })}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/30 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="autoDetect" className="text-white/80 text-sm">
                    Auto-detect language from user input
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'audio' && (
            <div className="space-y-6">
              <h3 className="text-white text-xl font-semibold">Audio Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="clapDetection"
                    checked={settings.clapDetection}
                    onChange={(e) => updateSettings({ clapDetection: e.target.checked })}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/30 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="clapDetection" className="text-white/80 text-sm">
                    Enable clap detection for voice activation
                  </label>
                </div>

                <div className="bg-blue-600/20 p-3 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    👏 Clap twice quickly to activate voice mode. Works best in quiet environments.
                  </p>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Voice Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.voiceVolume}
                    onChange={(e) => updateSettings({ voiceVolume: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-white/60 text-sm">{settings.voiceVolume}%</span>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'camera' && (
            <div className="space-y-6">
              <h3 className="text-white text-xl font-semibold">Camera Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="cameraEnabled"
                    checked={settings.cameraEnabled}
                    onChange={(e) => updateSettings({ cameraEnabled: e.target.checked })}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/30 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="cameraEnabled" className="text-white/80 text-sm">
                    Enable camera for visual interaction
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="realtimeAnalysis"
                    checked={settings.realtimeAnalysis}
                    onChange={(e) => updateSettings({ realtimeAnalysis: e.target.checked })}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/30 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="realtimeAnalysis" className="text-white/80 text-sm">
                    Real-time video analysis and response
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'music' && (
            <div className="space-y-6">
              <h3 className="text-white text-xl font-semibold">Music Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">YouTube API Key</label>
                  <input
                    type="password"
                    value={settings.youtubeApiKey}
                    onChange={(e) => updateSettings({ youtubeApiKey: e.target.value })}
                    className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter YouTube API key for music playback"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Default Music Mode</label>
                  <select
                    value={settings.musicMode}
                    onChange={(e) => updateSettings({ musicMode: e.target.value as 'audio' | 'video' })}
                    className="w-full bg-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="audio">Audio Only (Background Music)</option>
                    <option value="video">Video Mode (Full YouTube Player)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="autoDance"
                    checked={settings.autoDance}
                    onChange={(e) => updateSettings({ autoDance: e.target.checked })}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/30 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="autoDance" className="text-white/80 text-sm">
                    Auto-dance when music is playing
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'automation' && (
            <div className="space-y-6">
              <h3 className="text-white text-xl font-semibold">App Automation Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableAppAutomation"
                    checked={settings.enableAppAutomation}
                    onChange={(e) => updateSettings({ enableAppAutomation: e.target.checked })}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/30 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="enableAppAutomation" className="text-white/80 text-sm">
                    Enable app automation (Windows/Mobile)
                  </label>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Default Messaging App</label>
                  <select
                    value={settings.defaultMessagingApp}
                    onChange={(e) => updateSettings({ defaultMessagingApp: e.target.value })}
                    className="w-full bg-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="telegram">Telegram</option>
                    <option value="sms">SMS/Messages</option>
                    <option value="facebook">Facebook Messenger</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Default Calling App</label>
                  <select
                    value={settings.defaultCallingApp}
                    onChange={(e) => updateSettings({ defaultCallingApp: e.target.value })}
                    className="w-full bg-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="phone">Phone</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="facetime">FaceTime</option>
                    <option value="skype">Skype</option>
                    <option value="teams">Microsoft Teams</option>
                  </select>
                </div>

                <div className="bg-blue-600/20 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Supported Commands:</h4>
                  <div className="text-white/80 text-sm space-y-1">
                    <p>• "Open camera" - Opens camera app</p>
                    <p>• "Message John" - Opens messaging app</p>
                    <p>• "Call mom" - Initiates phone call</p>
                    <p>• "WhatsApp video call Sarah" - Video call</p>
                    <p>• "Open Instagram" - Opens social apps</p>
                    <p>• "Open Chrome and search cats" - Browser automation</p>
                  </div>
                </div>

                <div className="bg-yellow-600/20 p-4 rounded-lg">
                  <h4 className="text-yellow-300 font-medium mb-2">Platform Support:</h4>
                  <div className="text-yellow-200 text-sm space-y-1">
                    <p>🖥️ Windows: Native app launching via protocols</p>
                    <p>📱 Mobile: Deep linking to iOS/Android apps</p>
                    <p>🌐 Browser: Cross-platform web app support</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            className="mt-8 flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Save size={20} />
            <span>Save Settings</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}