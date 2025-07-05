import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CameraContextType {
  isCameraEnabled: boolean;
  toggleCamera: () => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export function CameraProvider({ children }: { children: ReactNode }) {
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);

  const toggleCamera = () => {
    setIsCameraEnabled(prev => !prev);
  };

  return (
    <CameraContext.Provider value={{
      isCameraEnabled,
      toggleCamera
    }}>
      {children}
    </CameraContext.Provider>
  );
}

export function useCamera() {
  const context = useContext(CameraContext);
  if (context === undefined) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
}