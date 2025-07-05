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
import { ChevronDown } from 'lucide-react';

interface VRMModelProps {
  modelPath: string;
  currentAnimation: string;
  isPlaying: boolean;
  isMusic: boolean;
  manualAnimation?: string;
}

function VRMModel({ modelPath, currentAnimation, isPlaying, isMusic, manualAnimation }: VRMModelProps) {
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

  // Create enhanced animations with proper bone movements
  const createEnhancedAnimations = (vrmModel?: VRM) => {
    const enhancedAnimations: { [key: string]: THREE.AnimationClip } = {};
    
    // Get bone names from VRM model if available
    const getBoneName = (boneName: string) => {
      if (vrmModel?.humanoid) {
        const bone = vrmModel.humanoid.getBoneNode(boneName as any);
        return bone ? bone.name : boneName;
      }
      return boneName;
    };

    // Create more complex animations with multiple bones
    const createDanceAnimation = (name: string, duration: number = 4) => {
      const tracks: THREE.KeyframeTrack[] = [];
      const times = [];
      const numFrames = 60;
      
      for (let i = 0; i <= numFrames; i++) {
        times.push((i / numFrames) * duration);
      }

      // Hip movement for dancing
      const hipPositions: number[] = [];
      const hipRotations: number[] = [];
      
      // Arm movements
      const leftArmRotations: number[] = [];
      const rightArmRotations: number[] = [];
      
      // Head movements
      const headRotations: number[] = [];

      for (let i = 0; i <= numFrames; i++) {
        const t = (i / numFrames) * Math.PI * 2;
        
        // Hip sway
        hipPositions.push(
          Math.sin(t * 2) * 0.1, // x
          Math.cos(t * 4) * 0.05, // y
          0 // z
        );
        
        hipRotations.push(
          0, // x
          Math.sin(t) * 0.2, // y
          Math.cos(t * 2) * 0.1 // z
        );

        // Arm movements
        leftArmRotations.push(
          Math.sin(t + Math.PI/4) * 0.5, // x
          Math.cos(t) * 0.3, // y
          Math.sin(t * 2) * 0.2 // z
        );
        
        rightArmRotations.push(
          Math.sin(t - Math.PI/4) * 0.5, // x
          Math.cos(t + Math.PI) * 0.3, // y
          Math.sin(t * 2 + Math.PI) * 0.2 // z
        );

        // Head movement
        headRotations.push(
          Math.sin(t * 0.5) * 0.1, // x
          Math.cos(t * 0.7) * 0.15, // y
          0 // z
        );
      }

      // Create tracks for different bones
      tracks.push(
        new THREE.VectorKeyframeTrack('.position', times, hipPositions),
        new THREE.QuaternionKeyframeTrack('.quaternion', times, hipRotations),
        new THREE.QuaternionKeyframeTrack('.bones[leftUpperArm].quaternion', times, leftArmRotations),
        new THREE.QuaternionKeyframeTrack('.bones[rightUpperArm].quaternion', times, rightArmRotations),
        new THREE.QuaternionKeyframeTrack('.bones[head].quaternion', times, headRotations)
      );

      return new THREE.AnimationClip(name, duration, tracks);
    };

    // Create different animation types
    enhancedAnimations['Hip Hop Dancing'] = createDanceAnimation('Hip Hop Dancing', 3);
    enhancedAnimations['Rumba Dancing'] = createDanceAnimation('Rumba Dancing', 4);
    
    // Greeting animation
    const greetingTimes = [0, 1, 2, 3];
    const greetingArmRotations = [
      0, 0, 0,  // Start
      0, 0, 1.5,  // Raise arm
      0, 0, 1.5,  // Hold
      0, 0, 0   // Lower
    ];
    
    enhancedAnimations['Standing Greeting'] = new THREE.AnimationClip('Standing Greeting', 3, [
      new THREE.QuaternionKeyframeTrack('.bones[rightUpperArm].quaternion', greetingTimes, greetingArmRotations)
    ]);

    // Happy animation - bouncing
    const happyTimes = [0, 0.5, 1];
    const happyPositions = [0, 0, 0, 0, 0.2, 0, 0, 0, 0];
    enhancedAnimations['Happy'] = new THREE.AnimationClip('Happy', 1, [
      new THREE.VectorKeyframeTrack('.position', happyTimes, happyPositions)
    ]);

    // Idle animation
    const idleTimes = [0, 2, 4];
    const idleRotations = [0, 0, 0, 0, 0.1, 0, 0, 0, 0];
    enhancedAnimations['Female Laying Pose'] = new THREE.AnimationClip('Female Laying Pose', 4, [
      new THREE.QuaternionKeyframeTrack('.quaternion', idleTimes, idleRotations)
    ]);

    // Add other emotion animations
    enhancedAnimations['Sad Idle'] = enhancedAnimations['Female Laying Pose'];
    enhancedAnimations['Angry'] = enhancedAnimations['Happy'];
    enhancedAnimations['Laughing'] = enhancedAnimations['Happy'];
    enhancedAnimations['Kiss'] = enhancedAnimations['Standing Greeting'];
    enhancedAnimations['Praying'] = enhancedAnimations['Standing Greeting'];

    return enhancedAnimations;
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
          
          // Load enhanced animations
          setAnimations(createEnhancedAnimations(vrmModel));
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
    
    // Load enhanced animations for fallback
    setAnimations(createEnhancedAnimations());
    setIsInitialized(true);
    
    console.log('Using fallback model with enhanced animations');
  };

  // Load FBX animations with fallback to enhanced animations
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

    const checkComplete = () => {
      if (loadedCount === totalFiles) {
        if (Object.keys(loadedAnimations).length > 0) {
          setAnimations(prev => ({ ...prev, ...loadedAnimations }));
          console.log('Loaded FBX animations:', Object.keys(loadedAnimations));
        } else {
          console.log('Using enhanced procedural animations');
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
            console.log(`Loaded FBX animation: ${animName}`);
          }
          
          loadedCount++;
          checkComplete();
        },
        (progress) => {
          console.log(`Loading ${file}:`, (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          console.warn(`Could not load animation ${file}:`, error);
          loadedCount++;
          checkComplete();
        }
      );
    });

    // Timeout fallback
    setTimeout(() => {
      if (loadedCount < totalFiles) {
        console.log('Animation loading timeout, using enhanced animations');
        checkComplete();
      }
    }, 5000);
  }, []);

  // Handle animation changes
  useEffect(() => {
    const animationToPlay = manualAnimation || currentAnimation;
    
    if (!mixer || !animations[animationToPlay]) {
      console.log('Animation not available:', animationToPlay, 'Available:', Object.keys(animations));
      return;
    }

    // Stop current animation
    if (currentAction) {
      currentAction.fadeOut(0.5);
    }

    // Start new animation
    const clip = animations[animationToPlay];
    const action = mixer.clipAction(clip);
    action.reset().fadeIn(0.5);
    
    // Set loop mode based on animation type
    if (isMusic && danceAnimations.includes(animationToPlay)) {
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.timeScale = 1.2; // Slightly faster for dancing
    } else if (animationToPlay === 'Standing Greeting') {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    } else {
      action.setLoop(THREE.LoopRepeat, Infinity);
    }
    
    action.play();
    setCurrentAction(action);
    console.log('Playing animation:', animationToPlay, 'isMusic:', isMusic);
  }, [manualAnimation, currentAnimation, animations, mixer, isMusic]);

  // Auto-switch dance animations when music is playing (only if no manual animation)
  useEffect(() => {
    if (!isMusic || !mixer || danceAnimations.length === 0 || manualAnimation) return;

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
  }, [isMusic, mixer, animations, danceIndex, currentAction, manualAnimation]);

  // Start with greeting animation when initialized
  useEffect(() => {
    if (isInitialized && mixer && animations['Standing Greeting'] && !hasGreeted && !manualAnimation) {
      const greetingClip = animations['Standing Greeting'];
      const greetingAction = mixer.clipAction(greetingClip);
      greetingAction.reset().play();
      greetingAction.setLoop(THREE.LoopOnce, 1);
      greetingAction.clampWhenFinished = true;
      setCurrentAction(greetingAction);
      setHasGreeted(true);
      
      // Switch to idle after greeting
      setTimeout(() => {
        if (animations['Female Laying Pose'] && !isMusic && !manualAnimation) {
          const idleAction = mixer.clipAction(animations['Female Laying Pose']);
          idleAction.reset().fadeIn(1).play();
          idleAction.setLoop(THREE.LoopRepeat, Infinity);
          setCurrentAction(idleAction);
        }
      }, 3000);
    }
  }, [isInitialized, mixer, animations, hasGreeted, isMusic, manualAnimation]);

  // Animation loop
  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta);
    }
    
    if (vrm) {
      vrm.update(delta);
    }
    
    // Add subtle floating animation when dancing
    if (isMusic && meshRef.current && !manualAnimation) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1 - 1;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return <group ref={meshRef} />;
}

export default function VirtualWife() {
  const { currentEmotion, isListening } = useAI();
  const { settings } = useSettings();
  const { isPlaying, currentTrack } = useAudio();
  const [showAnimationDropdown, setShowAnimationDropdown] = useState(false);
  const [manualAnimation, setManualAnimation] = useState<string>('');
  
  const availableAnimations = [
    'Standing Greeting',
    'Happy',
    'Sad Idle',
    'Angry',
    'Laughing',
    'Hip Hop Dancing',
    'Rumba Dancing',
    'Kiss',
    'Praying',
    'Female Laying Pose'
  ];
  
  const getAnimationForEmotion = (emotion: string, musicPlaying: boolean) => {
    // If manual animation is selected, use it
    if (manualAnimation) {
      return manualAnimation;
    }
    
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

  const handleAnimationSelect = (animation: string) => {
    setManualAnimation(animation);
    setShowAnimationDropdown(false);
  };

  const clearManualAnimation = () => {
    setManualAnimation('');
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
          manualAnimation={manualAnimation}
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

      {/* Animation Control Panel */}
      <div className="absolute bottom-4 right-4 space-y-2">
        <div className="bg-black/50 backdrop-blur-md text-white px-3 py-2 rounded-lg text-xs">
          <div className="flex items-center justify-between space-x-3">
            <span>Animation: {manualAnimation || getAnimationForEmotion(currentEmotion, isPlaying)}</span>
            <div className="relative">
              <button
                onClick={() => setShowAnimationDropdown(!showAnimationDropdown)}
                className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs transition-colors"
              >
                <span>Select</span>
                <ChevronDown size={12} />
              </button>
              
              {showAnimationDropdown && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-md rounded-lg border border-white/20 min-w-48 max-h-64 overflow-y-auto">
                  <div className="p-2">
                    <button
                      onClick={clearManualAnimation}
                      className="w-full text-left px-2 py-1 text-xs text-yellow-400 hover:bg-white/10 rounded"
                    >
                      🔄 Auto (Follow emotions/music)
                    </button>
                    <div className="border-t border-white/20 my-1"></div>
                    {availableAnimations.map((animation) => (
                      <button
                        key={animation}
                        onClick={() => handleAnimationSelect(animation)}
                        className={`w-full text-left px-2 py-1 text-xs hover:bg-white/10 rounded transition-colors ${
                          (manualAnimation || getAnimationForEmotion(currentEmotion, isPlaying)) === animation 
                            ? 'text-purple-400 bg-white/10' 
                            : 'text-white'
                        }`}
                      >
                        {animation}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {isPlaying && <p className="text-green-400 mt-1">🎵 Music Mode Active</p>}
          {manualAnimation && (
            <p className="text-yellow-400 mt-1">🎭 Manual Animation Override</p>
          )}
        </div>
      </div>
    </div>
  );
}