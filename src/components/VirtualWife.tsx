import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { useAI } from '../contexts/AIContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAudio } from '../contexts/AudioContext';

interface VRMModelProps {
  modelPath: string;
  currentAnimation: string;
  isPlaying: boolean;
  isMusic: boolean;
}

function VRMModel({ modelPath, currentAnimation, isPlaying, isMusic }: VRMModelProps) {
  const meshRef = useRef<THREE.Group>();
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [animations, setAnimations] = useState<{ [key: string]: THREE.AnimationClip }>({});
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null);
  const [currentAction, setCurrentAction] = useState<THREE.AnimationAction | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [danceIndex, setDanceIndex] = useState(0);
  const [hasGreeted, setHasGreeted] = useState(false);

  // Dance animations for music
  const danceAnimations = ['Hip Hop Dancing', 'Rumba Dancing'];

  // Create fallback animations if FBX files don't load
  const createFallbackAnimations = () => {
    const fallbackAnimations: { [key: string]: THREE.AnimationClip } = {};
    
    // Create simple keyframe animations
    const times = [0, 1, 2];
    const values = [0, 1, 0]; // Simple up-down motion
    
    // Create tracks for different animations
    const tracks = [
      new THREE.NumberKeyframeTrack('.position[y]', times, values),
      new THREE.NumberKeyframeTrack('.rotation[y]', times, [0, Math.PI * 0.5, 0])
    ];
    
    // Create clips for each animation type
    const animationNames = [
      'Standing Greeting', 'Happy', 'Sad Idle', 'Angry', 'Laughing',
      'Hip Hop Dancing', 'Rumba Dancing', 'Kiss', 'Praying', 'Female Laying Pose'
    ];
    
    animationNames.forEach(name => {
      fallbackAnimations[name] = new THREE.AnimationClip(name, 2, tracks);
    });
    
    return fallbackAnimations;
  };

  // Load VRM model
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    
    loader.load(
      modelPath,
      (gltf) => {
        const vrmModel = gltf.userData.vrm as VRM;
        if (vrmModel) {
          // Rotate the model to face forward
          VRMUtils.rotateVRM0(vrmModel);
          
          setVrm(vrmModel);
          
          if (meshRef.current) {
            meshRef.current.add(vrmModel.scene);
            // Position the model properly - centered and at ground level
            vrmModel.scene.position.set(0, -1, 0);
            vrmModel.scene.rotation.set(0, 0, 0);
            vrmModel.scene.scale.set(1, 1, 1);
          }
          
          // Create animation mixer
          const animMixer = new THREE.AnimationMixer(vrmModel.scene);
          setMixer(animMixer);
          setIsInitialized(true);
          
          console.log('VRM model loaded successfully');
        }
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading VRM:', error);
        createFallbackModel();
      }
    );
  }, [modelPath]);

  const createFallbackModel = () => {
    // Create a simple fallback model if VRM fails to load
    const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xff69b4,
      transparent: true,
      opacity: 0.8
    });
    const fallbackMesh = new THREE.Mesh(geometry, material);
    fallbackMesh.position.set(0, 0, 0);
    
    if (meshRef.current) {
      meshRef.current.add(fallbackMesh);
    }
    
    // Create mixer for fallback model
    const animMixer = new THREE.AnimationMixer(fallbackMesh);
    setMixer(animMixer);
    setIsInitialized(true);
    
    console.log('Using fallback model with animations');
  };

  // Load animations with fallback
  useEffect(() => {
    const animationFiles = [
      'Standing Greeting.fbx',
      'Happy.fbx',
      'Sad Idle.fbx',
      'Angry.fbx',
      'Laughing.fbx',
      'Hip Hop Dancing.fbx',
      'Rumba Dancing.fbx',
      'Kiss.fbx',
      'Praying.fbx',
      'Female Laying Pose.fbx'
    ];

    const fbxLoader = new FBXLoader();
    const loadedAnimations: { [key: string]: THREE.AnimationClip } = {};

    let loadedCount = 0;
    const totalFiles = animationFiles.length;
    let hasErrors = false;

    const checkComplete = () => {
      if (loadedCount === totalFiles) {
        if (Object.keys(loadedAnimations).length === 0 || hasErrors) {
          console.log('Using fallback animations');
          setAnimations(createFallbackAnimations());
        } else {
          setAnimations(loadedAnimations);
          console.log('Loaded animations:', Object.keys(loadedAnimations));
        }
      }
    };

    animationFiles.forEach((file) => {
      fbxLoader.load(
        `/animations/${file}`,
        (fbx) => {
          if (fbx.animations && fbx.animations.length > 0) {
            const animName = file.replace('.fbx', '');
            loadedAnimations[animName] = fbx.animations[0];
            console.log(`Loaded animation: ${animName}`);
          }
          
          loadedCount++;
          checkComplete();
        },
        (progress) => {
          console.log(`Loading ${file}:`, (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          console.warn(`Could not load animation ${file}:`, error);
          hasErrors = true;
          loadedCount++;
          checkComplete();
        }
      );
    });

    // Timeout fallback
    setTimeout(() => {
      if (loadedCount < totalFiles) {
        console.log('Animation loading timeout, using fallback');
        setAnimations(createFallbackAnimations());
      }
    }, 10000);
  }, []);

  // Handle animation changes
  useEffect(() => {
    if (!mixer || !animations[currentAnimation]) {
      console.log('Animation not available:', currentAnimation, 'Available:', Object.keys(animations));
      return;
    }

    // Stop current animation
    if (currentAction) {
      currentAction.fadeOut(0.5);
    }

    // Start new animation
    const clip = animations[currentAnimation];
    const action = mixer.clipAction(clip);
    action.reset().fadeIn(0.5);
    
    // Set loop mode based on animation type
    if (isMusic && danceAnimations.includes(currentAnimation)) {
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.timeScale = 1.2; // Slightly faster for dancing
    } else if (currentAnimation === 'Standing Greeting') {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    } else {
      action.setLoop(THREE.LoopRepeat, Infinity);
    }
    
    if (isPlaying) {
      action.play();
    }
    
    setCurrentAction(action);
    console.log('Playing animation:', currentAnimation, 'isMusic:', isMusic);
  }, [currentAnimation, animations, mixer, isPlaying, isMusic]);

  // Auto-switch dance animations when music is playing
  useEffect(() => {
    if (!isMusic || !mixer || danceAnimations.length === 0) return;

    const switchDance = () => {
      const nextIndex = (danceIndex + 1) % danceAnimations.length;
      setDanceIndex(nextIndex);
      
      const nextDance = danceAnimations[nextIndex];
      if (animations[nextDance]) {
        if (currentAction) {
          currentAction.fadeOut(1);
        }
        
        const newAction = mixer.clipAction(animations[nextDance]);
        newAction.reset().fadeIn(1).play();
        newAction.setLoop(THREE.LoopRepeat, Infinity);
        newAction.timeScale = 1.2; // Faster dancing
        setCurrentAction(newAction);
        
        console.log('Switched to dance:', nextDance);
      }
    };

    // Switch dance every 15 seconds when music is playing
    const interval = setInterval(switchDance, 15000);
    
    return () => clearInterval(interval);
  }, [isMusic, mixer, animations, danceIndex, currentAction]);

  // Start with greeting animation when initialized
  useEffect(() => {
    if (isInitialized && mixer && animations['Standing Greeting'] && !hasGreeted) {
      const greetingClip = animations['Standing Greeting'];
      const greetingAction = mixer.clipAction(greetingClip);
      greetingAction.reset().play();
      greetingAction.setLoop(THREE.LoopOnce, 1);
      greetingAction.clampWhenFinished = true;
      setCurrentAction(greetingAction);
      setHasGreeted(true);
      
      // Switch to idle after greeting
      setTimeout(() => {
        if (animations['Female Laying Pose'] && !isMusic) {
          const idleAction = mixer.clipAction(animations['Female Laying Pose']);
          idleAction.reset().fadeIn(1).play();
          idleAction.setLoop(THREE.LoopRepeat, Infinity);
          setCurrentAction(idleAction);
        }
      }, 3000);
    }
  }, [isInitialized, mixer, animations, hasGreeted, isMusic]);

  // Animation loop
  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta);
    }
    
    if (vrm) {
      vrm.update(delta);
    }
    
    // Add subtle floating animation when dancing
    if (isMusic && meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1 - 1;
    }
  });

  return <group ref={meshRef} />;
}

export default function VirtualWife() {
  const { currentEmotion, isListening } = useAI();
  const { settings } = useSettings();
  const { isPlaying, currentTrack } = useAudio();
  
  const getAnimationForEmotion = (emotion: string, musicPlaying: boolean) => {
    // If music is playing, prioritize dance animations
    if (musicPlaying && settings.autoDance) {
      return 'Hip Hop Dancing'; // Will auto-switch between dance animations
    }
    
    const emotionMap: { [key: string]: string } = {
      happy: 'Happy',
      sad: 'Sad Idle',
      angry: 'Angry',
      laughing: 'Laughing',
      greeting: 'Standing Greeting',
      dancing: 'Hip Hop Dancing',
      praying: 'Praying',
      kiss: 'Kiss',
      default: 'Female Laying Pose' // Idle animation
    };
    
    return emotionMap[emotion] || emotionMap.default;
  };

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20">
      <Canvas
        camera={{ position: [0, 1.5, 4], fov: 50 }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <pointLight position={[-10, -10, -5]} intensity={0.4} />
        <spotLight position={[0, 10, 0]} intensity={0.8} angle={0.3} penumbra={1} />
        
        <VRMModel
          modelPath="/wife.vrm"
          currentAnimation={getAnimationForEmotion(currentEmotion, isPlaying)}
          isPlaying={true}
          isMusic={isPlaying}
        />
        
        <Environment preset="sunset" />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={8}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 6}
          target={[0, 0, 0]}
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
        {isPlaying && currentTrack && (
          <div className="bg-green-500/90 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
              <span>Dancing to: {currentTrack.title.substring(0, 30)}...</span>
            </div>
          </div>
        )}
      </div>

      {/* Wife name display */}
      <div className="absolute bottom-4 left-4">
        <div className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-lg">
          <h3 className="font-semibold text-lg">{settings.wifeName}</h3>
          <p className="text-sm text-white/70">Your Virtual Wife</p>
          {isPlaying && (
            <p className="text-xs text-green-400 mt-1">🎵 Dancing to music</p>
          )}
        </div>
      </div>

      {/* Emotion indicator */}
      <div className="absolute top-4 right-4">
        <div className="bg-purple-600/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm">
          {isPlaying ? 'Dancing' : currentEmotion === 'default' ? 'Relaxed' : currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)}
        </div>
      </div>

      {/* Animation Status */}
      <div className="absolute bottom-4 right-4">
        <div className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs">
          <p>Animation: {getAnimationForEmotion(currentEmotion, isPlaying)}</p>
          {isPlaying && <p className="text-green-400">🎵 Music Mode Active</p>}
        </div>
      </div>
    </div>
  );
}