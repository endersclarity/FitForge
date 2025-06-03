# Implement Muscle Activation Heat Map Visualization

## User Story
As a user, I want to see a visual heat map of my muscle activation and recovery status so I can make informed decisions about which muscle groups to train based on their current fatigue levels.

## Description
Implement a body heat map that shows muscle activation and recovery status using color coding:
- **Bright Red (80%+)**: Over-activated, needs recovery
- **Pink/Orange (30-80%)**: Optimal training range  
- **Blue/Green (<30%)**: Under-activated, safe to train heavily

## Technical Foundation
Based on existing research and data:
- Muscle activation percentages already exist in `data/exercises/universal-exercise-database.json`
- Recovery algorithms documented in `docs/PROGRESSION_ALGORITHMS_IMPLEMENTATION.md`
- 5-day recovery cycle with fatigue percentage calculations planned

## Acceptance Criteria
- [ ] Visual body diagram showing major muscle groups
- [ ] Color coding based on current fatigue percentage (0-100%)
- [ ] Hover/click details showing exact activation percentage and days since last workout
- [ ] Integration with workout history to calculate current fatigue levels
- [ ] Real-time updates after completing workouts

## Implementation Details
- Use existing muscle activation data from exercise database
- Implement fatigue calculation: `(days_since_workout / 5_day_recovery) * 100`
- Create SVG body diagram with clickable muscle regions
- Color interpolation between blue (0%) → green (30%) → orange (80%) → red (100%)

## Related Files
- `data/exercises/universal-exercise-database.json` - Muscle activation percentages
- `docs/PROGRESSION_ALGORITHMS_IMPLEMENTATION.md` - Recovery algorithms
- `memory-bank/progress_calculations_module.md` - Progress calculation formulas

## Labels
enhancement, ui/ux, data-visualization

## Priority
High