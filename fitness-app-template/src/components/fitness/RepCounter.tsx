import { useState } from 'react';

interface RepCounterProps {
  targetReps: number;
  onComplete: (actualReps: number) => void;
  onReset: () => void;
}

export function RepCounter({ targetReps, onComplete, onReset }: RepCounterProps) {
  const [currentRep, setCurrentRep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const handleRepClick = () => {
    if (!isActive) {
      setIsActive(true);
    }
    
    const newRep = currentRep + 1;
    setCurrentRep(newRep);
    
    if (newRep >= targetReps) {
      setTimeout(() => {
        onComplete(newRep);
        setIsActive(false);
      }, 300);
    }
  };

  const handleReset = () => {
    setCurrentRep(0);
    setIsActive(false);
    onReset();
  };

  const progress = Math.min((currentRep / targetReps) * 100, 100);

  return (
    <div className="flex flex-col items-center space-y-4 p-6 workout-card">
      {/* Circular Progress */}
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
            className={`transition-all duration-300 ${
              currentRep >= targetReps 
                ? 'text-green-500' 
                : isActive 
                  ? 'text-blue-500' 
                  : 'text-gray-400'
            }`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`rep-counter ${isActive ? 'counting' : ''}`}>
            {currentRep}
          </div>
        </div>
      </div>

      {/* Target Display */}
      <div className="text-center">
        <div className="text-sm text-gray-600">Target</div>
        <div className="text-lg font-semibold">{targetReps} reps</div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleRepClick}
          disabled={currentRep >= targetReps}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-all
            ${currentRep >= targetReps
              ? 'bg-green-500 text-white cursor-not-allowed'
              : 'exercise-button hover:scale-105 active:scale-95'
            }
          `}
        >
          {currentRep >= targetReps ? '✓ Complete!' : 'Rep +1'}
        </button>
        
        <button
          onClick={handleReset}
          className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Progress Text */}
      <div className="text-sm text-gray-600">
        {currentRep === 0 && 'Tap "Rep +1" to start counting'}
        {currentRep > 0 && currentRep < targetReps && `${targetReps - currentRep} reps to go`}
        {currentRep >= targetReps && 'Set complete! 🎉'}
      </div>
    </div>
  );
}