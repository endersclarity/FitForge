// FitForge Body Diagram Component
// SVG body diagram with muscle activation heat map - inspired by fitness app design
// Created: June 3, 2025

import React, { useState, useCallback } from 'react';
import { MuscleRecoveryState, MuscleGroupType, MUSCLE_GROUPS } from '@/types/muscle-recovery';
import { cn } from '@/lib/utils';

interface BodyDiagramProps {
  muscleStates: MuscleRecoveryState[];
  onMuscleHover?: (muscle: MuscleGroupType, data: MuscleRecoveryState | null) => void;
  onMuscleClick?: (muscle: MuscleGroupType, data: MuscleRecoveryState) => void;
  className?: string;
  interactive?: boolean;
  showMetrics?: boolean;
}

interface MuscleGroupPath {
  id: MuscleGroupType;
  path: string;
  strokePath?: string; // Optional outline path
  center: { x: number; y: number };
  label: string;
}

export function BodyDiagram({
  muscleStates,
  onMuscleHover,
  onMuscleClick,
  className,
  interactive = true,
  showMetrics = true
}: BodyDiagramProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleGroupType | null>(null);

  // Calculate key metrics
  const daysSinceLastWorkout = muscleStates.length > 0 
    ? Math.min(...muscleStates.map(state => {
        const daysDiff = Math.floor((Date.now() - state.lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff;
      }))
    : 0;

  const freshMuscleGroups = muscleStates.filter(state => 
    state.recoveryStatus === 'undertrained' || 
    (state.recoveryStatus === 'optimal' && state.currentFatiguePercentage < 30)
  ).length;

  // Get muscle state by muscle group
  const getMuscleState = useCallback((muscleGroup: MuscleGroupType): MuscleRecoveryState | null => {
    return muscleStates.find(state => state.muscleGroup === muscleGroup) || null;
  }, [muscleStates]);

  // Get muscle color based on fatigue level (following the reference design)
  const getMuscleColor = useCallback((muscleGroup: MuscleGroupType): string => {
    const state = getMuscleState(muscleGroup);
    if (!state) return '#374151'; // Dark gray for no data

    const fatigue = state.currentFatiguePercentage;
    
    // Reference design uses red/pink for worked muscles, gray for fresh
    if (fatigue >= 70) {
      return '#ef4444'; // Bright red - heavily worked
    } else if (fatigue >= 50) {
      return '#f87171'; // Light red - moderately worked
    } else if (fatigue >= 30) {
      return '#fca5a5'; // Pink - lightly worked
    } else {
      return '#6b7280'; // Gray - fresh/undertrained
    }
  }, [getMuscleState]);

  // Handle muscle interaction
  const handleMuscleEnter = useCallback((muscleGroup: MuscleGroupType) => {
    if (!interactive) return;
    setHoveredMuscle(muscleGroup);
    const state = getMuscleState(muscleGroup);
    onMuscleHover?.(muscleGroup, state);
  }, [interactive, getMuscleState, onMuscleHover]);

  const handleMuscleLeave = useCallback(() => {
    if (!interactive) return;
    setHoveredMuscle(null);
    onMuscleHover?.(hoveredMuscle as MuscleGroupType, null);
  }, [interactive, onMuscleHover, hoveredMuscle]);

  const handleMuscleClick = useCallback((muscleGroup: MuscleGroupType) => {
    if (!interactive) return;
    const state = getMuscleState(muscleGroup);
    if (state && onMuscleClick) {
      onMuscleClick(muscleGroup, state);
    }
  }, [interactive, getMuscleState, onMuscleClick]);

  // Anatomically accurate muscle group paths
  const muscleGroups: MuscleGroupPath[] = [
    // Chest
    {
      id: MUSCLE_GROUPS.CHEST,
      path: "M150 110 Q160 105 170 110 L170 130 Q165 135 160 135 Q155 135 150 130 Z M190 110 Q200 105 210 110 L210 130 Q205 135 200 135 Q195 135 190 130 Z",
      center: { x: 180, y: 120 },
      label: "Chest"
    },
    // Shoulders (deltoids)
    {
      id: MUSCLE_GROUPS.SHOULDERS,
      path: "M135 100 Q145 95 150 105 L150 125 Q140 125 135 120 Z M210 105 Q215 95 225 100 L225 120 Q220 125 210 125 Z",
      center: { x: 180, y: 105 },
      label: "Shoulders"
    },
    // Biceps
    {
      id: MUSCLE_GROUPS.BICEPS,
      path: "M135 125 Q140 120 145 125 L145 150 Q140 155 135 150 Z M215 125 Q220 120 225 125 L225 150 Q220 155 215 150 Z",
      center: { x: 180, y: 137 },
      label: "Biceps"
    },
    // Forearms
    {
      id: MUSCLE_GROUPS.FOREARMS,
      path: "M135 155 Q140 150 145 155 L145 180 Q140 185 135 180 Z M215 155 Q220 150 225 155 L225 180 Q220 185 215 180 Z",
      center: { x: 180, y: 167 },
      label: "Forearms"
    },
    // Core/Abs
    {
      id: MUSCLE_GROUPS.CORE,
      path: "M155 140 Q165 135 175 140 L175 180 Q170 185 165 185 Q160 185 155 180 Z M185 140 Q195 135 205 140 L205 180 Q200 185 195 185 Q190 185 185 180 Z",
      center: { x: 180, y: 160 },
      label: "Core"
    },
    // Quadriceps
    {
      id: MUSCLE_GROUPS.QUADRICEPS,
      path: "M155 190 Q165 185 170 190 L170 240 Q165 245 160 245 Q155 245 155 240 Z M190 190 Q195 185 205 190 L205 240 Q200 245 195 245 Q190 245 190 240 Z",
      center: { x: 180, y: 215 },
      label: "Quadriceps"
    },
    // Calves
    {
      id: MUSCLE_GROUPS.CALVES,
      path: "M158 250 Q163 245 168 250 L168 280 Q163 285 158 280 Z M192 250 Q197 245 202 250 L202 280 Q197 285 192 280 Z",
      center: { x: 180, y: 265 },
      label: "Calves"
    },
    // Back (shown on right side)
    {
      id: MUSCLE_GROUPS.BACK,
      path: "M280 110 Q290 105 300 110 L300 160 Q295 165 290 165 Q285 165 280 160 Z M310 110 Q320 105 330 110 L330 160 Q325 165 320 165 Q315 165 310 160 Z",
      center: { x: 305, y: 135 },
      label: "Back"
    },
    // Triceps (back view)
    {
      id: MUSCLE_GROUPS.TRICEPS,
      path: "M265 125 Q270 120 275 125 L275 150 Q270 155 265 150 Z M335 125 Q340 120 345 125 L345 150 Q340 155 335 150 Z",
      center: { x: 305, y: 137 },
      label: "Triceps"
    },
    // Glutes (back view)
    {
      id: MUSCLE_GROUPS.GLUTES,
      path: "M285 170 Q295 165 305 170 L305 200 Q300 205 295 205 Q290 205 285 200 Z M315 170 Q325 165 335 170 L335 200 Q330 205 325 205 Q320 205 315 200 Z",
      center: { x: 310, y: 185 },
      label: "Glutes"
    },
    // Hamstrings (back view)
    {
      id: MUSCLE_GROUPS.HAMSTRINGS,
      path: "M285 210 Q295 205 300 210 L300 240 Q295 245 290 245 Q285 245 285 240 Z M320 210 Q325 205 335 210 L335 240 Q330 245 325 245 Q320 245 320 240 Z",
      center: { x: 310, y: 225 },
      label: "Hamstrings"
    }
  ];

  return (
    <div className={cn("relative w-full max-w-lg mx-auto", className)}>
      {/* Metrics Header */}
      {showMetrics && (
        <div className="flex justify-between items-center mb-6 px-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{daysSinceLastWorkout}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">
              Days Since Your<br />Last Workout
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{freshMuscleGroups}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">
              Fresh Muscle<br />Groups
            </div>
          </div>
        </div>
      )}

      {/* Body Diagram */}
      <div className="bg-gray-900 rounded-3xl p-6 relative overflow-hidden">
        <svg
          viewBox="0 0 450 300"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Body Outline - Front View */}
          <g className="body-outline-front">
            {/* Head */}
            <circle cx="180" cy="60" r="20" fill="none" stroke="#4b5563" strokeWidth="1.5" />
            
            {/* Torso outline */}
            <path
              d="M150 85 Q160 80 180 80 Q200 80 210 85 L210 190 Q200 195 180 195 Q160 195 150 190 Z"
              fill="none"
              stroke="#4b5563"
              strokeWidth="1.5"
            />
            
            {/* Arms outline */}
            <path
              d="M130 100 Q140 95 150 100 L150 185 Q140 190 130 185 Z"
              fill="none"
              stroke="#4b5563"
              strokeWidth="1.5"
            />
            <path
              d="M210 100 Q220 95 230 100 L230 185 Q220 190 210 185 Z"
              fill="none"
              stroke="#4b5563"
              strokeWidth="1.5"
            />
            
            {/* Legs outline */}
            <path
              d="M155 195 Q160 190 165 195 L165 285 Q160 290 155 285 Z"
              fill="none"
              stroke="#4b5563"
              strokeWidth="1.5"
            />
            <path
              d="M195 195 Q200 190 205 195 L205 285 Q200 290 195 285 Z"
              fill="none"
              stroke="#4b5563"
              strokeWidth="1.5"
            />
          </g>

          {/* Body Outline - Back View */}
          <g className="body-outline-back">
            {/* Head */}
            <circle cx="305" cy="60" r="20" fill="none" stroke="#4b5563" strokeWidth="1.5" />
            
            {/* Torso outline */}
            <path
              d="M275 85 Q285 80 305 80 Q325 80 335 85 L335 210 Q325 215 305 215 Q285 215 275 210 Z"
              fill="none"
              stroke="#4b5563"
              strokeWidth="1.5"
            />
            
            {/* Arms outline */}
            <path
              d="M255 100 Q265 95 275 100 L275 185 Q265 190 255 185 Z"
              fill="none"
              stroke="#4b5563"
              strokeWidth="1.5"
            />
            <path
              d="M335 100 Q345 95 355 100 L355 185 Q345 190 335 185 Z"
              fill="none"
              stroke="#4b5563"
              strokeWidth="1.5"
            />
            
            {/* Legs outline */}
            <path
              d="M285 215 Q290 210 295 215 L295 285 Q290 290 285 285 Z"
              fill="none"
              stroke="#4b5563"
              strokeWidth="1.5"
            />
            <path
              d="M315 215 Q320 210 325 215 L325 285 Q320 290 315 285 Z"
              fill="none"
              stroke="#4b5563"
              strokeWidth="1.5"
            />
          </g>

          {/* Muscle Groups */}
          <g className="muscle-groups">
            {muscleGroups.map((muscle) => {
              const color = getMuscleColor(muscle.id);
              const isHovered = hoveredMuscle === muscle.id;
              const opacity = isHovered ? 0.9 : 0.8;
              
              return (
                <g key={muscle.id} className="muscle-group">
                  <path
                    d={muscle.path}
                    fill={color}
                    stroke={isHovered ? "#ffffff" : "transparent"}
                    strokeWidth={isHovered ? 1 : 0}
                    opacity={opacity}
                    className={cn(
                      "transition-all duration-200",
                      interactive && "cursor-pointer hover:opacity-90"
                    )}
                    onMouseEnter={() => handleMuscleEnter(muscle.id)}
                    onMouseLeave={handleMuscleLeave}
                    onClick={() => handleMuscleClick(muscle.id)}
                  />
                </g>
              );
            })}
          </g>

          {/* View Labels */}
          <text x="180" y="45" textAnchor="middle" className="text-xs font-medium fill-gray-400">
            FRONT
          </text>
          <text x="305" y="45" textAnchor="middle" className="text-xs font-medium fill-gray-400">
            BACK
          </text>
        </svg>

        {/* Muscle Legend */}
        <div className="flex justify-center space-x-6 mt-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-400">Worked</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-pink-400"></div>
            <span className="text-gray-400">Moderate</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-gray-400">Fresh</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BodyDiagram;