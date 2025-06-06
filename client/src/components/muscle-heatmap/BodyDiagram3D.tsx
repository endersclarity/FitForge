// FitForge 3D Body Diagram Component
// WebGL-powered 3D muscle visualization with interactive rotation and zoom
// Created: June 6, 2025

import React, { Suspense, useState, useCallback, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { MuscleRecoveryState, MuscleGroupType, MUSCLE_GROUPS } from '@/types/muscle-recovery';
import { cn } from '@/lib/utils';
import { useMobileOptimization, usePerformanceOptimization } from './MobileOptimizations';

interface BodyDiagram3DProps {
  muscleStates: MuscleRecoveryState[];
  onMuscleHover?: (muscle: MuscleGroupType, data: MuscleRecoveryState | null) => void;
  onMuscleClick?: (muscle: MuscleGroupType, data: MuscleRecoveryState) => void;
  className?: string;
  interactive?: boolean;
  showMetrics?: boolean;
  fallbackTo2D?: () => void;
}

interface MuscleGroup3D {
  id: MuscleGroupType;
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  shape: 'box' | 'sphere' | 'cylinder';
  label: string;
}

// 3D muscle group definitions
const MUSCLE_GROUPS_3D: MuscleGroup3D[] = [
  // Upper body
  {
    id: MUSCLE_GROUPS.CHEST,
    position: [0, 0.8, 0.3],
    scale: [0.6, 0.3, 0.2],
    shape: 'box',
    label: 'Chest'
  },
  {
    id: MUSCLE_GROUPS.SHOULDERS,
    position: [0, 1.2, 0],
    scale: [0.8, 0.2, 0.2],
    shape: 'cylinder',
    rotation: [0, 0, Math.PI / 2],
    label: 'Shoulders'
  },
  {
    id: MUSCLE_GROUPS.BACK,
    position: [0, 0.8, -0.3],
    scale: [0.6, 0.4, 0.2],
    shape: 'box',
    label: 'Back'
  },
  {
    id: MUSCLE_GROUPS.BICEPS,
    position: [0.5, 0.6, 0],
    scale: [0.15, 0.3, 0.15],
    shape: 'cylinder',
    label: 'Biceps'
  },
  {
    id: MUSCLE_GROUPS.TRICEPS,
    position: [-0.5, 0.6, 0],
    scale: [0.15, 0.3, 0.15],
    shape: 'cylinder',
    label: 'Triceps'
  },
  {
    id: MUSCLE_GROUPS.FOREARMS,
    position: [0.5, 0.2, 0],
    scale: [0.12, 0.25, 0.12],
    shape: 'cylinder',
    label: 'Forearms'
  },
  {
    id: MUSCLE_GROUPS.CORE,
    position: [0, 0.3, 0],
    scale: [0.4, 0.3, 0.2],
    shape: 'box',
    label: 'Core'
  },
  // Lower body
  {
    id: MUSCLE_GROUPS.GLUTES,
    position: [0, -0.1, -0.2],
    scale: [0.4, 0.2, 0.25],
    shape: 'box',
    label: 'Glutes'
  },
  {
    id: MUSCLE_GROUPS.QUADRICEPS,
    position: [0.2, -0.5, 0.1],
    scale: [0.15, 0.4, 0.15],
    shape: 'cylinder',
    label: 'Quadriceps'
  },
  {
    id: MUSCLE_GROUPS.HAMSTRINGS,
    position: [0.2, -0.5, -0.1],
    scale: [0.15, 0.4, 0.15],
    shape: 'cylinder',
    label: 'Hamstrings'
  },
  {
    id: MUSCLE_GROUPS.CALVES,
    position: [0.2, -1.1, 0],
    scale: [0.12, 0.25, 0.12],
    shape: 'cylinder',
    label: 'Calves'
  }
];

// Individual muscle component
interface MuscleGroupMeshProps {
  muscle: MuscleGroup3D;
  color: string;
  isHovered: boolean;
  isSelected: boolean;
  onHover: () => void;
  onUnhover: () => void;
  onClick: () => void;
  interactive: boolean;
}

function MuscleGroupMesh({
  muscle,
  color,
  isHovered,
  isSelected,
  onHover,
  onUnhover,
  onClick,
  interactive
}: MuscleGroupMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Animation for hover/selection
  useFrame((state) => {
    if (meshRef.current) {
      const scale = isHovered || isSelected ? 1.1 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
      
      // Subtle breathing animation for selected muscle
      if (isSelected) {
        const breathe = Math.sin(state.clock.elapsedTime * 2) * 0.02 + 1;
        meshRef.current.scale.multiplyScalar(breathe);
      }
    }
  });

  const handlePointerEnter = useCallback(() => {
    if (interactive) {
      setHovered(true);
      onHover();
      document.body.style.cursor = 'pointer';
    }
  }, [interactive, onHover]);

  const handlePointerLeave = useCallback(() => {
    if (interactive) {
      setHovered(false);
      onUnhover();
      document.body.style.cursor = 'auto';
    }
  }, [interactive, onUnhover]);

  const handleClick = useCallback(() => {
    if (interactive) {
      onClick();
    }
  }, [interactive, onClick]);

  // Render different shapes based on muscle type
  const renderShape = () => {
    const props = {
      ref: meshRef,
      position: muscle.position,
      scale: muscle.scale,
      rotation: muscle.rotation,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
      onClick: handleClick
    };

    const material = (
      <meshStandardMaterial
        color={color}
        transparent
        opacity={isHovered ? 0.9 : 0.8}
        emissive={isSelected ? color : '#000000'}
        emissiveIntensity={isSelected ? 0.2 : 0}
      />
    );

    switch (muscle.shape) {
      case 'sphere':
        return (
          <Sphere {...props}>
            {material}
          </Sphere>
        );
      case 'cylinder':
        return (
          <Cylinder {...props}>
            {material}
          </Cylinder>
        );
      case 'box':
      default:
        return (
          <Box {...props}>
            {material}
          </Box>
        );
    }
  };

  return (
    <group>
      {renderShape()}
      {/* Muscle label */}
      {(isHovered || isSelected) && (
        <Text
          position={[muscle.position[0], muscle.position[1] + 0.3, muscle.position[2]]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {muscle.label}
        </Text>
      )}
    </group>
  );
}

// Main 3D body model
interface BodyModel3DProps {
  muscleStates: MuscleRecoveryState[];
  onMuscleHover?: (muscle: MuscleGroupType, data: MuscleRecoveryState | null) => void;
  onMuscleClick?: (muscle: MuscleGroupType, data: MuscleRecoveryState) => void;
  interactive: boolean;
}

function BodyModel3D({
  muscleStates,
  onMuscleHover,
  onMuscleClick,
  interactive
}: BodyModel3DProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleGroupType | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroupType | null>(null);

  // Get muscle state by muscle group
  const getMuscleState = useCallback((muscleGroup: MuscleGroupType): MuscleRecoveryState | null => {
    return muscleStates.find(state => state.muscleGroup === muscleGroup) || null;
  }, [muscleStates]);

  // Get muscle color based on fatigue level
  const getMuscleColor = useCallback((muscleGroup: MuscleGroupType): string => {
    const state = getMuscleState(muscleGroup);
    if (!state) return '#22c55e'; // Green for no data (fresh/ready to train)

    const fatigue = state.currentFatiguePercentage;
    
    if (fatigue >= 70) {
      return '#ef4444'; // Bright red - heavily worked
    } else if (fatigue >= 50) {
      return '#f97316'; // Orange - moderately worked
    } else if (fatigue >= 30) {
      return '#eab308'; // Yellow - lightly worked  
    } else if (fatigue >= 15) {
      return '#22c55e'; // Green - fresh
    } else {
      return '#3b82f6'; // Blue - undertrained/very fresh
    }
  }, [getMuscleState]);

  // Handle muscle interactions
  const handleMuscleHover = useCallback((muscleGroup: MuscleGroupType) => {
    setHoveredMuscle(muscleGroup);
    const state = getMuscleState(muscleGroup);
    onMuscleHover?.(muscleGroup, state);
  }, [getMuscleState, onMuscleHover]);

  const handleMuscleUnhover = useCallback(() => {
    setHoveredMuscle(null);
    onMuscleHover?.(hoveredMuscle as MuscleGroupType, null);
  }, [onMuscleHover, hoveredMuscle]);

  const handleMuscleClick = useCallback((muscleGroup: MuscleGroupType) => {
    setSelectedMuscle(selectedMuscle === muscleGroup ? null : muscleGroup);
    const state = getMuscleState(muscleGroup);
    if (state && onMuscleClick) {
      onMuscleClick(muscleGroup, state);
    }
  }, [selectedMuscle, getMuscleState, onMuscleClick]);

  return (
    <group>
      {/* Basic body structure */}
      <group name="body-structure">
        {/* Head */}
        <Sphere position={[0, 1.6, 0]} scale={[0.2, 0.2, 0.2]}>
          <meshBasicMaterial color="#f0f0f0" transparent opacity={0.3} />
        </Sphere>
        
        {/* Torso outline */}
        <Box position={[0, 0.5, 0]} scale={[0.8, 1.2, 0.4]}>
          <meshBasicMaterial color="#f0f0f0" transparent opacity={0.1} wireframe />
        </Box>
        
        {/* Arms outline */}
        <Cylinder position={[0.6, 0.4, 0]} scale={[0.1, 0.5, 0.1]}>
          <meshBasicMaterial color="#f0f0f0" transparent opacity={0.1} wireframe />
        </Cylinder>
        <Cylinder position={[-0.6, 0.4, 0]} scale={[0.1, 0.5, 0.1]}>
          <meshBasicMaterial color="#f0f0f0" transparent opacity={0.1} wireframe />
        </Cylinder>
        
        {/* Legs outline */}
        <Cylinder position={[0.2, -0.8, 0]} scale={[0.12, 0.8, 0.12]}>
          <meshBasicMaterial color="#f0f0f0" transparent opacity={0.1} wireframe />
        </Cylinder>
        <Cylinder position={[-0.2, -0.8, 0]} scale={[0.12, 0.8, 0.12]}>
          <meshBasicMaterial color="#f0f0f0" transparent opacity={0.1} wireframe />
        </Cylinder>
      </group>

      {/* Muscle groups */}
      <group name="muscle-groups">
        {MUSCLE_GROUPS_3D.map((muscle) => (
          <MuscleGroupMesh
            key={muscle.id}
            muscle={muscle}
            color={getMuscleColor(muscle.id)}
            isHovered={hoveredMuscle === muscle.id}
            isSelected={selectedMuscle === muscle.id}
            onHover={() => handleMuscleHover(muscle.id)}
            onUnhover={handleMuscleUnhover}
            onClick={() => handleMuscleClick(muscle.id)}
            interactive={interactive}
          />
        ))}
      </group>
    </group>
  );
}

// Performance and error boundary component
function Scene3D({ children }: { children: React.ReactNode }) {
  const { size } = useThree();
  const { isMobile } = useMobileOptimization();
  
  // Adjust camera based on device
  const cameraPosition: [number, number, number] = isMobile ? [0, 0, 4] : [0, 0, 3];
  
  return (
    <>
      {/* Lighting setup */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, -10, -5]} intensity={0.4} />
      
      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={8}
        maxPolarAngle={Math.PI}
        autoRotate={false}
        dampingFactor={0.05}
      />
      
      {children}
    </>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <div>Loading 3D visualization...</div>
      </div>
    </div>
  );
}

// Error fallback
function ErrorFallback({ fallbackTo2D }: { fallbackTo2D?: () => void }) {
  return (
    <div className="flex items-center justify-center h-64 text-center">
      <div>
        <div className="text-red-500 mb-2">3D visualization unavailable</div>
        <div className="text-sm text-muted-foreground mb-4">
          Your device may not support WebGL
        </div>
        {fallbackTo2D && (
          <button
            onClick={fallbackTo2D}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Use 2D Diagram
          </button>
        )}
      </div>
    </div>
  );
}

// Main component
export function BodyDiagram3D({
  muscleStates,
  onMuscleHover,
  onMuscleClick,
  className,
  interactive = true,
  showMetrics = true,
  fallbackTo2D
}: BodyDiagram3DProps) {
  const { isMobile, isTablet } = useMobileOptimization();
  const { shouldUseReducedAnimations } = usePerformanceOptimization();
  const [webglSupported, setWebglSupported] = useState(true);

  // Check WebGL support
  React.useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
      }
    } catch (e) {
      setWebglSupported(false);
    }
  }, []);

  // Memoize expensive calculations for performance
  const { daysSinceLastWorkout, freshMuscleGroups } = useMemo(() => {
    if (muscleStates.length === 0) {
      return { daysSinceLastWorkout: 0, freshMuscleGroups: 0 };
    }

    const daysSince = Math.min(...muscleStates.map(state => {
      const workoutDate = state.lastWorkoutDate instanceof Date 
        ? state.lastWorkoutDate 
        : new Date(state.lastWorkoutDate);
      const daysDiff = Math.floor((Date.now() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff;
    }));

    const freshCount = muscleStates.filter(state => 
      state.recoveryStatus === 'undertrained' || 
      (state.recoveryStatus === 'optimal' && state.currentFatiguePercentage < 30)
    ).length;

    return { daysSinceLastWorkout: daysSince, freshMuscleGroups: freshCount };
  }, [muscleStates]);

  if (!webglSupported) {
    return <ErrorFallback fallbackTo2D={fallbackTo2D} />;
  }

  return (
    <div className={cn("relative w-full max-w-lg mx-auto", className)}>
      {/* Metrics Header */}
      {showMetrics && (
        <div className="flex justify-between items-center mb-6 px-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{daysSinceLastWorkout}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Days Since Your<br />Last Workout
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{freshMuscleGroups}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Fresh Muscle<br />Groups
            </div>
          </div>
        </div>
      )}

      {/* 3D Visualization */}
      <div className="bg-muted/30 rounded-3xl p-6 relative overflow-hidden">
        <div 
          className="w-full aspect-square"
          style={{ 
            height: isMobile ? '300px' : '400px',
            touchAction: 'none' // Prevent scrolling conflicts on mobile
          }}
        >
          <Canvas
            camera={{ 
              position: [0, 0, isMobile ? 4 : 3], 
              fov: isMobile ? 60 : 50 
            }}
            gl={{ 
              antialias: !isMobile, // Disable antialiasing on mobile for performance
              alpha: true,
              powerPreference: isMobile ? 'low-power' : 'high-performance'
            }}
            performance={{ 
              min: 0.5,
              max: isMobile ? 30 : 60,
              debounce: shouldUseReducedAnimations ? 300 : 200
            }}
            onCreated={({ gl }) => {
              // Optimize renderer settings for mobile
              if (isMobile) {
                gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
              }
            }}
          >
            <Suspense fallback={null}>
              <Scene3D>
                <BodyModel3D
                  muscleStates={muscleStates}
                  onMuscleHover={onMuscleHover}
                  onMuscleClick={onMuscleClick}
                  interactive={interactive}
                />
              </Scene3D>
            </Suspense>
          </Canvas>
        </div>

        {/* Controls hint */}
        <div className="mt-2 text-xs text-center text-muted-foreground">
          {isMobile ? 'Touch to rotate • Pinch to zoom' : 'Click and drag to rotate • Scroll to zoom'}
        </div>

        {/* Muscle Legend */}
        <div className="flex justify-center space-x-6 mt-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-400">Worked</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-orange-400"></div>
            <span className="text-gray-400">Moderate</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-400">Fresh</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BodyDiagram3D;