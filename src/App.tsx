import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VirtualWife from './components/VirtualWife';
import ControlPanel from './components/ControlPanel';
import Settings from './components/Settings';
import CameraView from './components/CameraView';
import MusicPlayer from './components/MusicPlayer';
import { AIProvider } from './contexts/AIContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AudioProvider } from './contexts/AudioContext';
import { CameraProvider } from './contexts/CameraContext';
import { Settings as SettingsIcon, Camera, Music, Bot } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'main' | 'settings' | 'camera' | 'music'>('main');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <SettingsProvider>
      <AIProvider>
        <AudioProvider>
          <CameraProvider>
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
              {/* Navigation */}
              <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
                <div className="flex justify-center space-x-1 p-2">
                  {[
                    { id: 'main', icon: Bot, label: 'Wife' },
                    { id: 'camera', icon: Camera, label: 'Camera' },
                    { id: 'music', icon: Music, label: 'Music' },
                    { id: 'settings', icon: SettingsIcon, label: 'Settings' }
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as any)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                        activeTab === id
                          ? 'bg-purple-600 text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon size={isMobile ? 16 : 20} />
                      {!isMobile && <span className="text-sm">{label}</span>}
                    </button>
                  ))}
                </div>
              </nav>

              {/* Main Content */}
              <div className="pt-16 h-screen">
                <AnimatePresence mode="wait">
                  {activeTab === 'main' && (
                    <motion.div
                      key="main"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="h-full"
                    >
                      <div className={`h-full ${isMobile ? 'flex flex-col' : 'grid grid-cols-4'}`}>
                        <div className={`${isMobile ? 'flex-1' : 'col-span-3'}`}>
                          <VirtualWife />
                        </div>
                        <div className={`${isMobile ? 'h-48' : 'col-span-1'} bg-black/20 backdrop-blur-md`}>
                          <ControlPanel />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'camera' && (
                    <motion.div
                      key="camera"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="h-full"
                    >
                      <CameraView />
                    </motion.div>
                  )}

                  {activeTab === 'music' && (
                    <motion.div
                      key="music"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="h-full"
                    >
                      <MusicPlayer />
                    </motion.div>
                  )}

                  {activeTab === 'settings' && (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="h-full"
                    >
                      <Settings />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </CameraProvider>
        </AudioProvider>
      </AIProvider>
    </SettingsProvider>
  );
}

export default App;