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
      default: 'Female Laying Pose'
    };
    
    return emotionMap[emotion] || emotionMap.default;
  };

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 1, 3], fov: 50 }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.3} />
        
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
      
      {/* Status indicators */}
      <div className="absolute top-4 left-4 space-y-2">
        {isListening && (
          <div className="bg-red-500/80 text-white px-3 py-1 rounded-full text-sm animate-pulse">
            Listening...
          </div>
        )}
        {isPlaying && (
          <div className="bg-green-500/80 text-white px-3 py-1 rounded-full text-sm">
            Dancing to music
          </div>
        )}
      </div>
    </div>
  );
}