import { MuscleGroup } from '../../types/fitness';

interface MuscleVisualizerProps {
  activeMuscles: MuscleGroup[];
  intensity?: 'low' | 'medium' | 'high';
  onMuscleClick?: (muscle: MuscleGroup) => void;
}

export function MuscleVisualizer({ activeMuscles, intensity = 'medium', onMuscleClick }: MuscleVisualizerProps) {
  const getMuscleColor = (muscle: MuscleGroup) => {
    if (!activeMuscles.includes(muscle)) return 'fill-gray-200 hover:fill-gray-300';
    
    switch (intensity) {
      case 'low': return 'fill-intensity-low muscle-activated';
      case 'medium': return 'fill-intensity-medium muscle-activated';
      case 'high': return 'fill-intensity-high muscle-activated';
      default: return 'fill-intensity-medium';
    }
  };

  const handleMuscleClick = (muscle: MuscleGroup) => {
    onMuscleClick?.(muscle);
  };

  return (
    <div className="flex justify-center space-x-8 p-6">
      {/* Front View */}
      <div className="flex flex-col items-center">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">Front</h3>
        <svg width="120" height="240" viewBox="0 0 120 240" className="border rounded-lg">
          {/* Head */}
          <circle cx="60" cy="20" r="12" className="fill-gray-100 stroke-gray-300" strokeWidth="1"/>
          
          {/* Torso */}
          <rect x="45" y="32" width="30" height="50" rx="5" className="fill-gray-100 stroke-gray-300" strokeWidth="1"/>
          
          {/* Chest */}
          <rect 
            x="47" y="35" width="26" height="20" rx="3"
            className={`muscle-group cursor-pointer ${getMuscleColor('chest')}`}
            onClick={() => handleMuscleClick('chest')}
          />
          
          {/* Abs */}
          <rect 
            x="50" y="58" width="20" height="20" rx="2"
            className={`muscle-group cursor-pointer ${getMuscleColor('abs')}`}
            onClick={() => handleMuscleClick('abs')}
          />
          
          {/* Arms */}
          <rect x="30" y="40" width="12" height="35" rx="6" className="fill-gray-100 stroke-gray-300" strokeWidth="1"/>
          <rect x="78" y="40" width="12" height="35" rx="6" className="fill-gray-100 stroke-gray-300" strokeWidth="1"/>
          
          {/* Biceps */}
          <rect 
            x="32" y="42" width="8" height="15" rx="4"
            className={`muscle-group cursor-pointer ${getMuscleColor('biceps')}`}
            onClick={() => handleMuscleClick('biceps')}
          />
          <rect 
            x="80" y="42" width="8" height="15" rx="4"
            className={`muscle-group cursor-pointer ${getMuscleColor('biceps')}`}
            onClick={() => handleMuscleClick('biceps')}
          />
          
          {/* Shoulders */}
          <circle 
            cx="36" cy="38" r="8"
            className={`muscle-group cursor-pointer ${getMuscleColor('shoulders')}`}
            onClick={() => handleMuscleClick('shoulders')}
          />
          <circle 
            cx="84" cy="38" r="8"
            className={`muscle-group cursor-pointer ${getMuscleColor('shoulders')}`}
            onClick={() => handleMuscleClick('shoulders')}
          />
          
          {/* Legs */}
          <rect x="47" y="85" width="12" height="45" rx="6" className="fill-gray-100 stroke-gray-300" strokeWidth="1"/>
          <rect x="61" y="85" width="12" height="45" rx="6" className="fill-gray-100 stroke-gray-300" strokeWidth="1"/>
          
          {/* Quadriceps */}
          <rect 
            x="49" y="88" width="8" height="30" rx="4"
            className={`muscle-group cursor-pointer ${getMuscleColor('quadriceps')}`}
            onClick={() => handleMuscleClick('quadriceps')}
          />
          <rect 
            x="63" y="88" width="8" height="30" rx="4"
            className={`muscle-group cursor-pointer ${getMuscleColor('quadriceps')}`}
            onClick={() => handleMuscleClick('quadriceps')}
          />
          
          {/* Calves */}
          <rect 
            x="50" y="135" width="6" height="20" rx="3"
            className={`muscle-group cursor-pointer ${getMuscleColor('calves')}`}
            onClick={() => handleMuscleClick('calves')}
          />
          <rect 
            x="64" y="135" width="6" height="20" rx="3"
            className={`muscle-group cursor-pointer ${getMuscleColor('calves')}`}
            onClick={() => handleMuscleClick('calves')}
          />
        </svg>
      </div>

      {/* Back View */}
      <div className="flex flex-col items-center">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">Back</h3>
        <svg width="120" height="240" viewBox="0 0 120 240" className="border rounded-lg">
          {/* Head */}
          <circle cx="60" cy="20" r="12" className="fill-gray-100 stroke-gray-300" strokeWidth="1"/>
          
          {/* Torso */}
          <rect x="45" y="32" width="30" height="50" rx="5" className="fill-gray-100 stroke-gray-300" strokeWidth="1"/>
          
          {/* Back */}
          <rect 
            x="47" y="35" width="26" height="35" rx="3"
            className={`muscle-group cursor-pointer ${getMuscleColor('back')}`}
            onClick={() => handleMuscleClick('back')}
          />
          
          {/* Arms */}
          <rect x="30" y="40" width="12" height="35" rx="6" className="fill-gray-100 stroke-gray-300" strokeWidth="1"/>
          <rect x="78" y="40" width="12" height="35" rx="6" className="fill-gray-100 stroke-gray-300" strokeWidth="1"/>
          
          {/* Triceps */}
          <rect 
            x="32" y="55" width="8" height="15" rx="4"
            className={`muscle-group cursor-pointer ${getMuscleColor('triceps')}`}
            onClick={() => handleMuscleClick('triceps')}
          />
          <rect 
            x="80" y="55" width="8" height="15" rx="4"
            className={`muscle-group cursor-pointer ${getMuscleColor('triceps')}`}
            onClick={() => handleMuscleClick('triceps')}
          />
          
          {/* Legs */}
          <rect x="47" y="85" width="12" height="45" rx="6" className="fill-gray-100 stroke-gray-300" strokeWidth="1"/>
          <rect x="61" y="85" width="12" height="45" rx="6" className="fill-gray-100 stroke-gray-300" strokeWidth="1"/>
          
          {/* Hamstrings */}
          <rect 
            x="49" y="88" width="8" height="25" rx="4"
            className={`muscle-group cursor-pointer ${getMuscleColor('hamstrings')}`}
            onClick={() => handleMuscleClick('hamstrings')}
          />
          <rect 
            x="63" y="88" width="8" height="25" rx="4"
            className={`muscle-group cursor-pointer ${getMuscleColor('hamstrings')}`}
            onClick={() => handleMuscleClick('hamstrings')}
          />
          
          {/* Glutes */}
          <rect 
            x="49" y="80" width="8" height="12" rx="4"
            className={`muscle-group cursor-pointer ${getMuscleColor('glutes')}`}
            onClick={() => handleMuscleClick('glutes')}
          />
          <rect 
            x="63" y="80" width="8" height="12" rx="4"
            className={`muscle-group cursor-pointer ${getMuscleColor('glutes')}`}
            onClick={() => handleMuscleClick('glutes')}
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-col space-y-2">
        <h3 className="text-sm font-semibold text-gray-600">Intensity</h3>
        <div className="flex items-center space-x-2">
          <div className="intensity-indicator intensity-low"></div>
          <span className="text-sm">Low</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="intensity-indicator intensity-medium"></div>
          <span className="text-sm">Medium</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="intensity-indicator intensity-high"></div>
          <span className="text-sm">High</span>
        </div>
        
        {activeMuscles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Active Muscles</h4>
            <div className="space-y-1">
              {activeMuscles.map(muscle => (
                <div key={muscle} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {muscle.replace('_', ' ')}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}