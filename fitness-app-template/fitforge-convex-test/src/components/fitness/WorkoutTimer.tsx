import { useState, useEffect } from 'react';

interface WorkoutTimerProps {
  onTimerComplete?: () => void;
  autoStart?: boolean;
}

export function WorkoutTimer({ onTimerComplete, autoStart = false }: WorkoutTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [isResting, setIsResting] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isResting) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else if (isResting && restTimer !== null && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(t => {
          if (t === null || t <= 1) {
            setIsResting(false);
            setIsRunning(true);
            onTimerComplete?.();
            return null;
          }
          return t - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, isResting, restTimer, onTimerComplete]);

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const startRest = (duration: number) => {
    setIsRunning(false);
    setIsResting(true);
    setRestTimer(duration);
  };

  const toggleTimer = () => {
    if (isResting) return; // Can't manually control during rest
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setSeconds(0);
    setIsRunning(false);
    setIsResting(false);
    setRestTimer(null);
  };

  return (
    <div className="workout-card max-w-sm mx-auto">
      {/* Main Timer Display */}
      <div className="text-center mb-6">
        <div className="text-4xl font-mono font-bold text-gray-800 mb-2">
          {isResting && restTimer !== null ? formatTime(restTimer) : formatTime(seconds)}
        </div>
        <div className="text-sm text-gray-600">
          {isResting ? 'Rest Time' : 'Workout Time'}
        </div>
        {isResting && (
          <div className="text-xs text-orange-600 mt-1">
            Rest in progress... Timer will auto-resume
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="flex justify-center mb-4">
        <div className={`
          w-3 h-3 rounded-full
          ${isResting 
            ? 'bg-orange-500 animate-pulse' 
            : isRunning 
              ? 'bg-green-500 animate-pulse' 
              : 'bg-gray-400'
          }
        `}></div>
        <span className="ml-2 text-sm text-gray-600">
          {isResting ? 'Resting' : isRunning ? 'Active' : 'Paused'}
        </span>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={toggleTimer}
          disabled={isResting}
          className={`
            px-4 py-2 rounded-lg font-semibold transition-all
            ${isResting 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isRunning
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }
          `}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        
        <button
          onClick={resetTimer}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Quick Rest Buttons */}
      {!isResting && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600 text-center mb-2">Quick Rest</div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => startRest(30)}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded font-medium hover:bg-blue-200 transition-colors"
            >
              30s
            </button>
            <button
              onClick={() => startRest(60)}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded font-medium hover:bg-blue-200 transition-colors"
            >
              1m
            </button>
            <button
              onClick={() => startRest(120)}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded font-medium hover:bg-blue-200 transition-colors"
            >
              2m
            </button>
          </div>
        </div>
      )}

      {/* Workout Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-800">{formatTime(seconds)}</div>
            <div className="text-xs text-gray-600">Total Time</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-800">
              {Math.floor(seconds / 60)} sets
            </div>
            <div className="text-xs text-gray-600">Estimated</div>
          </div>
        </div>
      </div>
    </div>
  );
}