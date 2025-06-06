/**
 * WorkoutTimer Component
 * Advanced timer with rest timer, exercise timer, and Web Audio API cues
 * Real data-driven with transparent timing and audio notifications
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Square, 
  Timer, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Target,
  Zap,
  Settings,
  Clock,
  Info
} from 'lucide-react';

interface TimerState {
  isRunning: boolean;
  timeRemaining: number;
  totalTime: number;
  type: 'rest' | 'exercise' | 'countdown' | 'stopwatch';
  startTime: number | null;
  pausedTime: number;
}

interface AudioCueSettings {
  enabled: boolean;
  volume: number;
  countdownBeeps: boolean;
  completionSound: boolean;
  halfwayWarning: boolean;
  tenSecondWarning: boolean;
}

interface WorkoutTimerProps {
  exerciseName?: string;
  defaultRestTime?: number;
  onTimerComplete?: (timerType: string, duration: number) => void;
  onTimerStart?: (timerType: string) => void;
  onTimerPause?: (timerType: string, remaining: number) => void;
  showExerciseTimer?: boolean;
  showSettings?: boolean;
  compact?: boolean;
}

// Web Audio API frequency mappings for different sounds
const AUDIO_FREQUENCIES = {
  beep: 800,
  warning: 600,
  completion: 1000,
  countdown: 900,
  start: 750
} as const;

export function WorkoutTimer({
  exerciseName = 'Current Exercise',
  defaultRestTime = 60,
  onTimerComplete,
  onTimerStart,
  onTimerPause,
  showExerciseTimer = true,
  showSettings = true,
  compact = false
}: WorkoutTimerProps) {
  
  // Timer states
  const [restTimer, setRestTimer] = useState<TimerState>({
    isRunning: false,
    timeRemaining: defaultRestTime,
    totalTime: defaultRestTime,
    type: 'rest',
    startTime: null,
    pausedTime: 0
  });

  const [exerciseTimer, setExerciseTimer] = useState<TimerState>({
    isRunning: false,
    timeRemaining: 0,
    totalTime: 0,
    type: 'stopwatch',
    startTime: null,
    pausedTime: 0
  });

  const [countdownTimer, setCountdownTimer] = useState<TimerState>({
    isRunning: false,
    timeRemaining: 5,
    totalTime: 5,
    type: 'countdown',
    startTime: null,
    pausedTime: 0
  });

  // Audio settings
  const [audioSettings, setAudioSettings] = useState<AudioCueSettings>({
    enabled: true,
    volume: 0.5,
    countdownBeeps: true,
    completionSound: true,
    halfwayWarning: true,
    tenSecondWarning: true
  });

  // UI state
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [activeTimer, setActiveTimer] = useState<'rest' | 'exercise' | 'countdown' | null>(null);
  
  // Web Audio API context and refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Web Audio API
  useEffect(() => {
    if (audioSettings.enabled && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
    
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [audioSettings.enabled]);

  // Audio cue generation using Web Audio API
  const playAudioCue = useCallback((frequency: number, duration: number = 0.2, volume: number = 0.5) => {
    if (!audioSettings.enabled || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume * audioSettings.volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.warn('Error playing audio cue:', error);
    }
  }, [audioSettings.enabled, audioSettings.volume]);

  // Complex audio patterns for different events
  const playCompletionSound = useCallback(() => {
    if (!audioSettings.completionSound) return;
    
    // Play a pleasant completion melody
    playAudioCue(AUDIO_FREQUENCIES.completion, 0.15, 0.6);
    setTimeout(() => playAudioCue(AUDIO_FREQUENCIES.completion * 1.25, 0.15, 0.5), 100);
    setTimeout(() => playAudioCue(AUDIO_FREQUENCIES.completion * 1.5, 0.3, 0.4), 200);
  }, [playAudioCue, audioSettings.completionSound]);

  const playWarningSound = useCallback(() => {
    if (!audioSettings.tenSecondWarning) return;
    
    // Play warning beeps (lower frequency)
    playAudioCue(AUDIO_FREQUENCIES.warning, 0.1, 0.4);
    setTimeout(() => playAudioCue(AUDIO_FREQUENCIES.warning, 0.1, 0.4), 150);
  }, [playAudioCue, audioSettings.tenSecondWarning]);

  const playCountdownBeep = useCallback(() => {
    if (!audioSettings.countdownBeeps) return;
    
    playAudioCue(AUDIO_FREQUENCIES.countdown, 0.1, 0.5);
  }, [playAudioCue, audioSettings.countdownBeeps]);

  const playStartSound = useCallback(() => {
    playAudioCue(AUDIO_FREQUENCIES.start, 0.2, 0.3);
  }, [playAudioCue]);

  // Timer update logic
  const updateTimer = useCallback((
    currentTimer: TimerState,
    setTimer: React.Dispatch<React.SetStateAction<TimerState>>,
    timerType: string
  ) => {
    if (!currentTimer.isRunning || !currentTimer.startTime) return;

    const now = Date.now();
    const elapsed = Math.floor((now - currentTimer.startTime + currentTimer.pausedTime) / 1000);

    if (currentTimer.type === 'stopwatch') {
      // Stopwatch counts up
      setTimer(prev => ({
        ...prev,
        timeRemaining: elapsed
      }));
    } else {
      // Countdown timer
      const remaining = Math.max(0, currentTimer.totalTime - elapsed);
      
      setTimer(prev => ({
        ...prev,
        timeRemaining: remaining
      }));

      // Audio cue logic
      if (remaining <= 10 && remaining > 0 && audioSettings.tenSecondWarning) {
        if (remaining === 10) playWarningSound();
        if (remaining <= 3 && audioSettings.countdownBeeps) {
          playCountdownBeep();
        }
      }

      if (audioSettings.halfwayWarning && remaining === Math.floor(currentTimer.totalTime / 2)) {
        playAudioCue(AUDIO_FREQUENCIES.beep, 0.15, 0.3);
      }

      // Timer completion
      if (remaining === 0) {
        playCompletionSound();
        
        setTimer(prev => ({
          ...prev,
          isRunning: false,
          timeRemaining: 0
        }));

        setActiveTimer(null);
        
        if (onTimerComplete) {
          onTimerComplete(timerType, currentTimer.totalTime);
        }
      }
    }
  }, [audioSettings, playWarningSound, playCountdownBeep, playCompletionSound, playAudioCue, onTimerComplete]);

  // Main timer interval
  useEffect(() => {
    if (activeTimer) {
      intervalRef.current = setInterval(() => {
        switch (activeTimer) {
          case 'rest':
            updateTimer(restTimer, setRestTimer, 'rest');
            break;
          case 'exercise':
            updateTimer(exerciseTimer, setExerciseTimer, 'exercise');
            break;
          case 'countdown':
            updateTimer(countdownTimer, setCountdownTimer, 'countdown');
            break;
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeTimer, restTimer, exerciseTimer, countdownTimer, updateTimer]);

  // Timer control functions
  const startTimer = useCallback((timerType: 'rest' | 'exercise' | 'countdown', duration?: number) => {
    const now = Date.now();
    
    // Stop any currently active timer
    if (activeTimer && activeTimer !== timerType) {
      pauseTimer(activeTimer);
    }

    switch (timerType) {
      case 'rest':
        const restDuration = duration || restTimer.totalTime;
        setRestTimer(prev => ({
          ...prev,
          isRunning: true,
          timeRemaining: restDuration,
          totalTime: restDuration,
          startTime: now,
          pausedTime: 0
        }));
        break;
      
      case 'exercise':
        setExerciseTimer(prev => ({
          ...prev,
          isRunning: true,
          timeRemaining: 0,
          startTime: now,
          pausedTime: prev.isRunning ? prev.pausedTime : 0 // Maintain paused time if resuming
        }));
        break;
      
      case 'countdown':
        const countdownDuration = duration || 5;
        setCountdownTimer(prev => ({
          ...prev,
          isRunning: true,
          timeRemaining: countdownDuration,
          totalTime: countdownDuration,
          startTime: now,
          pausedTime: 0
        }));
        break;
    }

    setActiveTimer(timerType);
    playStartSound();
    
    if (onTimerStart) {
      onTimerStart(timerType);
    }
  }, [activeTimer, restTimer.totalTime, playStartSound, onTimerStart]);

  const pauseTimer = useCallback((timerType: 'rest' | 'exercise' | 'countdown') => {
    const now = Date.now();
    
    switch (timerType) {
      case 'rest':
        if (restTimer.isRunning && restTimer.startTime) {
          const additionalPausedTime = now - restTimer.startTime;
          setRestTimer(prev => ({
            ...prev,
            isRunning: false,
            pausedTime: prev.pausedTime + additionalPausedTime,
            startTime: null
          }));
          
          if (onTimerPause) {
            onTimerPause('rest', restTimer.timeRemaining);
          }
        }
        break;
      
      case 'exercise':
        if (exerciseTimer.isRunning && exerciseTimer.startTime) {
          const additionalPausedTime = now - exerciseTimer.startTime;
          setExerciseTimer(prev => ({
            ...prev,
            isRunning: false,
            pausedTime: prev.pausedTime + additionalPausedTime,
            startTime: null
          }));
          
          if (onTimerPause) {
            onTimerPause('exercise', exerciseTimer.timeRemaining);
          }
        }
        break;
      
      case 'countdown':
        if (countdownTimer.isRunning && countdownTimer.startTime) {
          const additionalPausedTime = now - countdownTimer.startTime;
          setCountdownTimer(prev => ({
            ...prev,
            isRunning: false,
            pausedTime: prev.pausedTime + additionalPausedTime,
            startTime: null
          }));
          
          if (onTimerPause) {
            onTimerPause('countdown', countdownTimer.timeRemaining);
          }
        }
        break;
    }

    setActiveTimer(null);
  }, [restTimer, exerciseTimer, countdownTimer, onTimerPause]);

  const resetTimer = useCallback((timerType: 'rest' | 'exercise' | 'countdown') => {
    switch (timerType) {
      case 'rest':
        setRestTimer(prev => ({
          ...prev,
          isRunning: false,
          timeRemaining: prev.totalTime,
          startTime: null,
          pausedTime: 0
        }));
        break;
      
      case 'exercise':
        setExerciseTimer(prev => ({
          ...prev,
          isRunning: false,
          timeRemaining: 0,
          startTime: null,
          pausedTime: 0
        }));
        break;
      
      case 'countdown':
        setCountdownTimer(prev => ({
          ...prev,
          isRunning: false,
          timeRemaining: prev.totalTime,
          startTime: null,
          pausedTime: 0
        }));
        break;
    }
    
    if (activeTimer === timerType) {
      setActiveTimer(null);
    }
  }, [activeTimer]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Rest time presets
  const restTimePresets = [30, 45, 60, 90, 120, 180, 300];

  // Compact view for mobile or embedded use
  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5 text-primary" />
              <div>
                <div className="font-bold text-lg">{formatTime(restTimer.timeRemaining)}</div>
                <div className="text-xs text-muted-foreground">Rest Timer</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={restTimer.isRunning ? "destructive" : "default"}
                onClick={() => restTimer.isRunning ? pauseTimer('rest') : startTimer('rest')}
              >
                {restTimer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => resetTimer('rest')}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {restTimer.isRunning && (
            <Progress 
              value={((restTimer.totalTime - restTimer.timeRemaining) / restTimer.totalTime) * 100} 
              className="mt-3 h-2"
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // Full WorkoutTimer interface
  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              Workout Timer
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{exerciseName}</Badge>
              {showSettings && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Settings Panel */}
      {showSettingsPanel && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Timer Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Audio Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Audio Cues</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAudioSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                >
                  {audioSettings.enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </div>
              
              {audioSettings.enabled && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Volume</label>
                    <Slider
                      value={[audioSettings.volume]}
                      onValueChange={([value]) => setAudioSettings(prev => ({ ...prev, volume: value }))}
                      max={1}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={audioSettings.countdownBeeps}
                        onChange={(e) => setAudioSettings(prev => ({ ...prev, countdownBeeps: e.target.checked }))}
                      />
                      Countdown Beeps
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={audioSettings.completionSound}
                        onChange={(e) => setAudioSettings(prev => ({ ...prev, completionSound: e.target.checked }))}
                      />
                      Completion Sound
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={audioSettings.halfwayWarning}
                        onChange={(e) => setAudioSettings(prev => ({ ...prev, halfwayWarning: e.target.checked }))}
                      />
                      Halfway Warning
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={audioSettings.tenSecondWarning}
                        onChange={(e) => setAudioSettings(prev => ({ ...prev, tenSecondWarning: e.target.checked }))}
                      />
                      10s Warning
                    </label>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Timer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rest Timer */}
        <Card className={`border-2 ${activeTimer === 'rest' ? 'border-primary' : 'border-muted'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Rest Timer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Time Display */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${restTimer.timeRemaining <= 10 && restTimer.isRunning ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                {formatTime(restTimer.timeRemaining)}
              </div>
              <div className="text-sm text-muted-foreground">
                of {formatTime(restTimer.totalTime)}
              </div>
            </div>

            {/* Progress Bar */}
            <Progress 
              value={restTimer.totalTime > 0 ? ((restTimer.totalTime - restTimer.timeRemaining) / restTimer.totalTime) * 100 : 0}
              className="h-3"
            />

            {/* Rest Time Presets */}
            <div className="grid grid-cols-4 gap-2">
              {restTimePresets.map(time => (
                <Button
                  key={time}
                  variant={restTimer.totalTime === time ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setRestTimer(prev => ({
                      ...prev,
                      totalTime: time,
                      timeRemaining: prev.isRunning ? prev.timeRemaining : time
                    }));
                  }}
                  className="text-xs"
                >
                  {time}s
                </Button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <Button
                onClick={() => restTimer.isRunning ? pauseTimer('rest') : startTimer('rest')}
                className="flex-1"
                variant={restTimer.isRunning ? "destructive" : "default"}
              >
                {restTimer.isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {restTimer.isRunning ? 'Pause' : 'Start'}
              </Button>
              
              <Button
                onClick={() => resetTimer('rest')}
                variant="outline"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Exercise Timer (Stopwatch) */}
        {showExerciseTimer && (
          <Card className={`border-2 ${activeTimer === 'exercise' ? 'border-primary' : 'border-muted'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-600" />
                Exercise Timer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Time Display */}
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">
                  {formatTime(exerciseTimer.timeRemaining)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Exercise Duration
                </div>
              </div>

              {/* Exercise Status */}
              <div className="flex justify-center">
                <Badge 
                  variant={exerciseTimer.isRunning ? "default" : "secondary"}
                  className="px-3 py-1"
                >
                  {exerciseTimer.isRunning ? 'In Progress' : 'Ready'}
                </Badge>
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <Button
                  onClick={() => exerciseTimer.isRunning ? pauseTimer('exercise') : startTimer('exercise')}
                  className="flex-1"
                  variant={exerciseTimer.isRunning ? "destructive" : "default"}
                >
                  {exerciseTimer.isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {exerciseTimer.isRunning ? 'Pause' : 'Start'}
                </Button>
                
                <Button
                  onClick={() => resetTimer('exercise')}
                  variant="outline"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Countdown Timer */}
      <Card className={`border-2 ${activeTimer === 'countdown' ? 'border-primary' : 'border-muted'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Preparation Countdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${countdownTimer.timeRemaining <= 3 && countdownTimer.isRunning ? 'text-red-500 animate-pulse' : 'text-orange-600'}`}>
                {formatTime(countdownTimer.timeRemaining)}
              </div>
              <div className="text-sm text-muted-foreground">
                Countdown
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1">
                {[3, 5, 10].map(time => (
                  <Button
                    key={time}
                    variant={countdownTimer.totalTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setCountdownTimer(prev => ({
                        ...prev,
                        totalTime: time,
                        timeRemaining: prev.isRunning ? prev.timeRemaining : time
                      }));
                    }}
                    className="text-xs"
                  >
                    {time}s
                  </Button>
                ))}
              </div>
              
              <div className="flex gap-1">
                <Button
                  onClick={() => countdownTimer.isRunning ? pauseTimer('countdown') : startTimer('countdown')}
                  size="sm"
                  className="flex-1"
                >
                  {countdownTimer.isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </Button>
                
                <Button
                  onClick={() => resetTimer('countdown')}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timer Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="text-sm">
            <strong>Timer Features:</strong> Rest timer counts down, exercise timer counts up, and countdown prepares you for the next exercise. 
            Audio cues use Web Audio API for precise timing and customizable sound notifications.
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}