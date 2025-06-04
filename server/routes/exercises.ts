// Exercise API Routes - Real Data Architecture
// All exercise data served from validated universal database - no mock data

import express from 'express';
import { 
  getAllExercises, 
  getExerciseById, 
  searchExercises, 
  getWorkoutRecommendations,
  isBodyweightExercise,
  getBodyweightExercises,
  exerciseDatabase 
} from '../database/exercise-database';
import { 
  ExerciseQuerySchema, 
  WorkoutType, 
  EquipmentProfile, 
  DifficultyLevel 
} from '../database/exercise-schema';

const router = express.Router();

// GET /api/exercises - Get all exercises with optional filtering
router.get('/', async (req, res) => {
  try {
    // Validate query parameters using Zod
    const queryResult = ExerciseQuerySchema.safeParse(req.query);
    
    if (!queryResult.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: queryResult.error.errors
      });
    }

    const exercises = await getAllExercises(queryResult.data);
    
    res.json({
      success: true,
      data: {
        exercises,
        count: exercises.length,
        filters: queryResult.data
      }
    });

  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({
      error: 'Failed to fetch exercises',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/exercises/search?q=term - Search exercises
router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.status(400).json({
        error: 'Search term required',
        message: 'Please provide a search term using the "q" parameter'
      });
    }

    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        error: 'Invalid limit',
        message: 'Limit must be between 1 and 50'
      });
    }

    const exercises = await searchExercises(searchTerm.trim(), limit);
    
    res.json({
      success: true,
      data: {
        exercises,
        searchTerm: searchTerm.trim(),
        count: exercises.length,
        limit
      }
    });

  } catch (error) {
    console.error('Error searching exercises:', error);
    res.status(500).json({
      error: 'Failed to search exercises',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/exercises/recommendations - Get workout recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const { 
      workoutType, 
      equipmentProfile, 
      difficultyLevel, 
      targetMuscles, 
      exerciseCount 
    } = req.query;

    // Validate required parameters
    if (!workoutType) {
      return res.status(400).json({
        error: 'Missing workoutType parameter',
        message: 'workoutType is required (Abs, BackBiceps, ChestTriceps, Legs)'
      });
    }

    if (!equipmentProfile) {
      return res.status(400).json({
        error: 'Missing equipmentProfile parameter',
        message: 'equipmentProfile is required (HOME_BASIC, HOME_INTERMEDIATE, HOME_ADVANCED, COMMERCIAL_GYM)'
      });
    }

    // Parse target muscles if provided
    let parsedTargetMuscles: string[] | undefined;
    if (targetMuscles) {
      parsedTargetMuscles = Array.isArray(targetMuscles) 
        ? targetMuscles as string[]
        : [targetMuscles as string];
    }

    const recommendations = await getWorkoutRecommendations({
      workoutType: workoutType as WorkoutType,
      equipmentProfile: equipmentProfile as EquipmentProfile,
      difficultyLevel: difficultyLevel as DifficultyLevel,
      targetMuscles: parsedTargetMuscles,
      exerciseCount: exerciseCount ? parseInt(exerciseCount as string) : undefined
    });

    res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
        parameters: {
          workoutType,
          equipmentProfile,
          difficultyLevel,
          targetMuscles: parsedTargetMuscles,
          exerciseCount: exerciseCount ? parseInt(exerciseCount as string) : 8
        }
      }
    });

  } catch (error) {
    console.error('Error getting workout recommendations:', error);
    res.status(500).json({
      error: 'Failed to get workout recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/exercises/stats - Get database statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await exerciseDatabase.getDatabaseStats();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching exercise database stats:', error);
    res.status(500).json({
      error: 'Failed to fetch database statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/exercises/muscle-groups/:muscleGroup - Get exercises by muscle group
router.get('/muscle-groups/:muscleGroup', async (req, res) => {
  try {
    const { muscleGroup } = req.params;
    
    // Validate muscle group
    const validMuscleGroups = ['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS', 'CORE'];
    if (!validMuscleGroups.includes(muscleGroup.toUpperCase())) {
      return res.status(400).json({
        error: 'Invalid muscle group',
        message: `Muscle group must be one of: ${validMuscleGroups.join(', ')}`
      });
    }

    const exercises = await exerciseDatabase.getExercisesByMuscleGroup(
      muscleGroup.toUpperCase() as keyof typeof import('../database/exercise-schema.js').MUSCLE_GROUPS
    );
    
    res.json({
      success: true,
      data: {
        exercises,
        muscleGroup: muscleGroup.toUpperCase(),
        count: exercises.length
      }
    });

  } catch (error) {
    console.error('Error fetching exercises by muscle group:', error);
    res.status(500).json({
      error: 'Failed to fetch exercises by muscle group',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/exercises/is-bodyweight/:id - Check if exercise is bodyweight
router.get('/is-bodyweight/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid exercise ID',
        message: 'Exercise ID is required'
      });
    }

    const isBodyweight = await exerciseDatabase.isBodyweightExercise(id.trim());
    
    res.json({
      success: true,
      data: {
        exerciseId: id.trim(),
        isBodyweight
      }
    });

  } catch (error) {
    console.error('Error checking if exercise is bodyweight:', error);
    res.status(500).json({
      error: 'Failed to check exercise type',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/exercises/:id - Get specific exercise by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid exercise ID',
        message: 'Exercise ID is required'
      });
    }

    const exercise = await getExerciseById(id.trim());
    
    if (!exercise) {
      return res.status(404).json({
        error: 'Exercise not found',
        message: `No exercise found with ID: ${id}`
      });
    }

    // Get muscle engagement analysis
    const muscleEngagement = await exerciseDatabase.getMuscleEngagement(id.trim());

    res.json({
      success: true,
      data: {
        exercise,
        muscleEngagement
      }
    });

  } catch (error) {
    console.error('Error fetching exercise by ID:', error);
    res.status(500).json({
      error: 'Failed to fetch exercise',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/exercises/:id/engagement - Get muscle engagement analysis for exercise
router.get('/:id/engagement', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid exercise ID',
        message: 'Exercise ID is required'
      });
    }

    const engagement = await exerciseDatabase.getMuscleEngagement(id.trim());
    
    if (!engagement) {
      return res.status(404).json({
        error: 'Exercise not found',
        message: `No exercise found with ID: ${id}`
      });
    }

    res.json({
      success: true,
      data: engagement
    });

  } catch (error) {
    console.error('Error fetching muscle engagement:', error);
    res.status(500).json({
      error: 'Failed to fetch muscle engagement data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;