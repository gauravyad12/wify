import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { Camera, CameraOff, Capture, RotateCcw } from 'lucide-react';
import { useCamera } from '../contexts/CameraContext';
import { useAI } from '../contexts/AIContext';
import { useSettings } from '../contexts/SettingsContext';

export default function CameraView() {
  const webcamRef = useRef<Webcam>(null);
  const { isCameraEnabled, toggleCamera } = useCamera();
  const { analyzeImage } = useAI();
  const { settings } = useSettings();
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<string>('');

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc && settings.realtimeAnalysis) {
      setIsAnalyzing(true);
      try {
        const analysis = await analyzeImage(imageSrc);
        setLastAnalysis(analysis);
      } catch (error) {
        console.error('Error analyzing image:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [analyzeImage, settings.realtimeAnalysis]);

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: facingMode
  };

  return (
    <div className="h-full flex flex-col">
      {/* Camera Controls */}
      <div className="bg-black/20 backdrop-blur-md p-4 flex justify-between items-center">
        <h2 className="text-white font-semibold text-lg">Camera View</h2>
        <div className="flex space-x-2">
          <button
            onClick={switchCamera}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={capture}
            disabled={!isCameraEnabled || isAnalyzing}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
          >
            <Capture size={20} />
          </button>
          <button
            onClick={toggleCamera}
            className={`p-2 rounded-lg transition-colors ${
              isCameraEnabled 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {isCameraEnabled ? <CameraOff size={20} /> : <Camera size={20} />}
          </button>
        </div>
      </div>

      {/* Camera Feed */}
      <div className="flex-1 relative bg-black">
        {isCameraEnabled ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-white/50">
              <Camera size={64} className="mx-auto mb-4" />
              <p>Camera is disabled</p>
              <p className="text-sm">Enable camera to start visual interaction</p>
            </div>
          </div>
        )}

        {/* Analysis Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
            />
          </div>
        )}

        {/* Status Indicators */}
        <div className="absolute top-4 left-4 space-y-2">
          {isCameraEnabled && (
            <div className="bg-green-500/80 text-white px-3 py-1 rounded-full text-sm">
              Camera Active
            </div>
          )}
          {settings.realtimeAnalysis && (
            <div className="bg-blue-500/80 text-white px-3 py-1 rounded-full text-sm">
              AI Analysis Enabled
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {lastAnalysis && (
        <div className="bg-black/20 backdrop-blur-md p-4">
          <h3 className="text-white font-semibold mb-2">AI Analysis</h3>
          <p className="text-white/80 text-sm">{lastAnalysis}</p>
        </div>
      )}
    </div>
  );
}