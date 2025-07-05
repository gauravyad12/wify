import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { useAI } from '../contexts/AIContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAudio } from '../contexts/AudioContext';

interface VRMModelProps {
  modelPath: string;
  currentAnimation: string;
  isPlaying: boolean;
}

function VRMModel({ modelPath, currentAnimation, isPlaying }: VRMModelProps) {
  const meshRef = useRef<THREE.Group>();
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [animations, setAnimations] = useState<{ [key: string]: THREE.AnimationClip }>({});
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null);
  const [currentAction, setCurrentAction] = useState<THREE.AnimationAction | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load VRM model
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    
    loader.load(
      modelPath,
      (gltf) => {
        const vrmModel = gltf.userData.vrm as VRM;
        setVrm(vrmModel);
        
        if (meshRef.current) {
          meshRef.current.add(vrmModel.scene);
        }
        
        // Create animation mixer
        const animMixer = new THREE.AnimationMixer(vrmModel.scene);
        setMixer(animMixer);
        setIsInitialized(true);
      },
      undefined,
      (error) => console.error('Error loading VRM:', error)
    );
  }, [modelPath]);

  // Load animations
  useEffect(() => {
    const animationFiles = [
      'Administering Cpr.fbx',
      'Angry.fbx',
      'Female Laying Pose.fbx',
      'Happy.fbx',
      'Hip Hop Dancing.fbx',
      'Kiss.fbx',
      'Laughing.fbx',
      'Praying.fbx',
      'Rumba Dancing.fbx',
      'Sad Idle.fbx',
      'Standing Greeting.fbx'
    ];

    const fbxLoader = new FBXLoader();
    const loadedAnimations: { [key: string]: THREE.AnimationClip } = {};

    animationFiles.forEach((file) => {
      fbxLoader.load(
        `/animations/${file}`,
        (fbx) => {
          if (fbx.animations.length > 0) {
            const animName = file.replace('.fbx', '');
            loadedAnimations[animName] = fbx.animations[0];
          }
        },
        undefined,
        (error) => console.warn(`Could not load animation ${file}:`, error)
      );
    });

    setAnimations(loadedAnimations);
  }, []);

  // Handle animation changes
  useEffect(() => {
    if (!mixer || !animations[currentAnimation]) return;

    // Stop current animation
    if (currentAction) {
      currentAction.fadeOut(0.5);
    }

    // Start new animation
    const clip = animations[currentAnimation];
    const action = mixer.clipAction(clip);
    action.reset().fadeIn(0.5);
    
    if (isPlaying) {
      action.play();
    }
    
    setCurrentAction(action);
  }, [currentAnimation, animations, mixer, isPlaying]);

  // Start with greeting animation when initialized
  useEffect(() => {
    if (isInitialized && mixer && animations['Standing Greeting'] && !currentAction) {
      const greetingClip = animations['Standing Greeting'];
      const greetingAction = mixer.clipAction(greetingClip);
      greetingAction.reset().play();
      setCurrentAction(greetingAction);
      
      // After greeting, switch to idle
      setTimeout(() => {
        if (animations['Female Laying Pose']) {
          greetingAction.fadeOut(1);
          const idleAction = mixer.clipAction(animations['Female Laying Pose']);
          idleAction.reset().fadeIn(1).play();
          setCurrentAction(idleAction);
        }
      }, 3000);
    }
  }, [isInitialized, mixer, animations, currentAction]);

  // Animation loop
  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta);
    }
    
    if (vrm) {
      vrm.update(delta);
    }
  });

  return <group ref={meshRef} />;
}

export default function VirtualWife() {
  const { currentEmotion, isListening } = useAI();
  const { settings } = useSettings();
  const { isPlaying } = useAudio();
  
  const getAnimationForEmotion = (emotion: string) => {
    const emotionMap: { [key: string]: string } = {
      happy: 'Happy',
      sad: 'Sad Idle',
      angry: 'Angry',
      laughing: 'Laughing',
      greeting: 'Standing Greeting',
      dancing: isPlaying ? 'Hip Hop Dancing' : 'Rumba Dancing',
      praying: 'Praying',
      kiss: 'Kiss',
      default: 'Female Laying Pose' // Idle animation
    };
    
    return emotionMap[emotion] || emotionMap.default;
  };

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20">
      <Canvas
        camera={{ position: [0, 1, 3], fov: 50 }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <pointLight position={[-10, -10, -5]} intensity={0.4} />
        <spotLight position={[0, 10, 0]} intensity={0.8} angle={0.3} penumbra={1} />
        
        <VRMModel
          modelPath="/wife.vrm"
          currentAnimation={getAnimationForEmotion(currentEmotion)}
          isPlaying={true}
        />
        
        <Environment preset="sunset" />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={10}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 6}
        />
      </Canvas>
      
      {/* Enhanced status indicators */}
      <div className="absolute top-4 left-4 space-y-2">
        {isListening && (
          <div className="bg-red-500/90 text-white px-4 py-2 rounded-full text-sm animate-pulse backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              <span>Listening...</span>
            </div>
          </div>
        )}
        {isPlaying && (
          <div className="bg-green-500/90 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
              <span>Dancing to music</span>
            </div>
          </div>
        )}
      </div>

      {/* Wife name display */}
      <div className="absolute bottom-4 left-4">
        <div className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-lg">
          <h3 className="font-semibold text-lg">{settings.wifeName}</h3>
          <p className="text-sm text-white/70">Your Virtual Wife</p>
        </div>
      </div>

      {/* Emotion indicator */}
      <div className="absolute top-4 right-4">
        <div className="bg-purple-600/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm">
          {currentEmotion === 'default' ? 'Relaxed' : currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)}
        </div>
      </div>
    </div>
  );
}