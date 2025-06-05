import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// For production demo, use fallback values if environment variables are missing
const fallbackUrl = 'https://demo.supabase.co'
const fallbackKey = 'demo-anon-key'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables - using demo mode')
}

export const supabase = createClient(supabaseUrl || fallbackUrl, supabaseAnonKey || fallbackKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Import consolidated schema types
import { 
  SupabaseExercise, 
  SupabaseWorkoutSession,
  SupabaseSetData,
  transformSupabaseExercise,
  transformSupabaseWorkoutSession,
  transformSupabaseSetData,
  transformToSupabaseSetData,
  type Exercise,
  type WorkoutSession,
  type WorkoutExercise,
  type SetData
} from '../../../shared/consolidated-schema';

// Re-export for backward compatibility
export type { Exercise, WorkoutSession, WorkoutExercise, SetData };
export type { SupabaseSetData };

// Database type definitions (Supabase format)
export type Profile = {
  id: string
  username: string | null
  email: string | null
  full_name: string | null
  created_at: string
  updated_at: string
  preferred_units: 'imperial' | 'metric'
  timezone: string
  fitness_level: 'beginner' | 'intermediate' | 'advanced'
  age: number | null
  height_cm: number | null
  current_weight_lbs: number | null
  target_weight_lbs: number | null
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  profile_visibility: 'public' | 'friends' | 'private'
}

// Use the consolidated schema types
export type { SupabaseExercise };
export { transformSupabaseExercise, transformSupabaseWorkoutSession };

// WorkoutSession type imported from consolidated schema

// WorkoutExercise type imported from consolidated schema

// Legacy type - use SetData from consolidated schema instead
export type WorkoutSet = SupabaseSetData;

export type PersonalRecord = {
  id: string
  user_id: string
  exercise_id: string
  record_type: 'max_weight' | 'max_reps' | 'max_volume' | 'max_one_rep_max'
  weight_lbs: number | null
  reps: number | null
  volume_lbs: number | null
  one_rep_max_lbs: number | null
  workout_session_id: string | null
  workout_set_id: string | null
  achieved_at: string
  previous_value: number | null
  improvement_percentage: number | null
  created_at: string
}

export type UserAchievement = {
  id: string
  user_id: string
  achievement_id: string
  current_progress: number
  target_progress: number
  is_completed: boolean
  unlocked_at: string | null
  workout_session_id: string | null
  created_at: string
  updated_at: string
}

export type BodyStats = {
  id: string
  user_id: string
  weight_lbs: number | null
  body_fat_percentage: number | null
  muscle_mass_lbs: number | null
  chest_inches: number | null
  waist_inches: number | null
  hips_inches: number | null
  bicep_inches: number | null
  thigh_inches: number | null
  photo_urls: string[] | null
  measured_at: string
  notes: string | null
  created_at: string
}

// Goal System Types
export type GoalType = 'weight_loss' | 'strength_gain' | 'body_composition'

export type Goal = {
  id: string
  user_id: string
  goal_type: GoalType
  goal_title: string
  goal_description: string | null
  
  // Target values (flexible based on goal type)
  target_weight_lbs: number | null
  target_body_fat_percentage: number | null
  target_exercise_id: string | null
  target_weight_for_exercise_lbs: number | null
  target_reps_for_exercise: number | null
  
  // Starting baseline (recorded when goal is created)
  start_weight_lbs: number | null
  start_body_fat_percentage: number | null
  start_exercise_max_weight_lbs: number | null
  start_exercise_max_reps: number | null
  
  // Timeline
  target_date: string // ISO date string
  created_date: string // ISO date string
  
  // Progress tracking
  current_progress_percentage: number
  is_achieved: boolean
  achieved_date: string | null // ISO date string
  
  // Motivation and tracking
  motivation_notes: string | null
  reward_description: string | null
  
  // Goal status
  is_active: boolean
  priority_level: 'high' | 'medium' | 'low'
  
  // Metadata
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}

export type GoalMilestone = {
  id: string
  goal_id: string
  user_id: string
  milestone_percentage: number
  milestone_description: string | null
  recorded_weight_lbs: number | null
  recorded_body_fat_percentage: number | null
  recorded_exercise_weight_lbs: number | null
  recorded_exercise_reps: number | null
  data_source_description: string
  calculation_formula: string
  achieved_at: string
  created_at: string
}

export type GoalCheckIn = {
  id: string
  goal_id: string
  user_id: string
  check_in_weight_lbs: number | null
  check_in_body_fat_percentage: number | null
  progress_notes: string | null
  challenges_faced: string | null
  motivation_level: number | null
  progress_photo_urls: string[] | null
  check_in_date: string
  created_at: string
}

export type WorkoutAnalyticsSummary = {
  id: string
  user_id: string
  analytics_date: string
  total_workouts: number
  total_volume_lbs: number
  total_duration_seconds: number
  calories_burned: number
  chest_volume: number
  back_volume: number
  legs_volume: number
  abs_volume: number
  new_prs_count: number
  created_at: string
}

// Check if we're in demo mode
const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

// Helper to handle demo mode gracefully
const handleDemoMode = <T>(fallbackValue: T) => {
  if (isDemoMode) {
    console.warn('Database operation called in demo mode - returning fallback value')
    return Promise.resolve(fallbackValue)
  }
  return null
}

// Database helpers
export const db = {
  // Profiles
  async getProfile(userId: string): Promise<Profile | null> {
    const demo = handleDemoMode(null)
    if (demo) return demo
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Exercises
  async getExercises(): Promise<Exercise[]> {
    const demo = handleDemoMode([])
    if (demo) return demo
    
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('exercise_name')
    
    if (error) throw error
    // Transform from Supabase format to canonical format
    return (data || []).map(transformSupabaseExercise)
  },

  async getExercisesByWorkoutType(workoutType: string): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('workout_type', workoutType)
      .order('exercise_name')
    
    if (error) throw error
    // Transform from Supabase format to canonical format
    return (data || []).map(transformSupabaseExercise)
  },

  // Workout Sessions
  async createWorkoutSession(session: Omit<WorkoutSession, 'id' | 'created_at' | 'updated_at'>): Promise<WorkoutSession> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert(session)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getWorkoutSession(sessionId: string): Promise<WorkoutSession | null> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (error) throw error
    return data
  },

  async getUserWorkoutSessions(userId: string, limit = 50): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  async updateWorkoutSession(sessionId: string, updates: Partial<WorkoutSession>): Promise<WorkoutSession> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Workout Exercises
  async createWorkoutExercise(exercise: Omit<WorkoutExercise, 'id' | 'created_at' | 'updated_at'>): Promise<WorkoutExercise> {
    const { data, error } = await supabase
      .from('workout_exercises')
      .insert(exercise)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getWorkoutExercises(sessionId: string): Promise<WorkoutExercise[]> {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_session_id', sessionId)
      .order('exercise_order')
    
    if (error) throw error
    return data || []
  },

  // Workout Sets
  async createWorkoutSet(set: Omit<WorkoutSet, 'id' | 'created_at' | 'updated_at'>): Promise<WorkoutSet> {
    const { data, error } = await supabase
      .from('workout_sets')
      .insert(set)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateWorkoutSet(setId: string, updates: Partial<WorkoutSet>): Promise<WorkoutSet> {
    const { data, error } = await supabase
      .from('workout_sets')
      .update(updates)
      .eq('id', setId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getWorkoutSets(exerciseId: string): Promise<WorkoutSet[]> {
    const { data, error } = await supabase
      .from('workout_sets')
      .select('*')
      .eq('workout_exercise_id', exerciseId)
      .order('set_number')
    
    if (error) throw error
    return data || []
  },

  // Personal Records
  async getPersonalRecords(userId: string, exerciseId?: string): Promise<PersonalRecord[]> {
    let query = supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
    
    if (exerciseId) {
      query = query.eq('exercise_id', exerciseId)
    }
    
    const { data, error } = await query.order('achieved_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Body Stats
  async createBodyStats(stats: Omit<BodyStats, 'id' | 'created_at'>): Promise<BodyStats> {
    const { data, error } = await supabase
      .from('body_stats')
      .insert(stats)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getUserBodyStats(userId: string, limit = 50): Promise<BodyStats[]> {
    const { data, error } = await supabase
      .from('body_stats')
      .select('*')
      .eq('user_id', userId)
      .order('measured_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  // Goals
  async getUserGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<Goal> {
    const { data, error } = await supabase
      .from('user_goals')
      .insert(goal)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    const { data, error } = await supabase
      .from('user_goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteGoal(goalId: string): Promise<void> {
    const { error } = await supabase
      .from('user_goals')
      .delete()
      .eq('id', goalId)
    
    if (error) throw error
  }
}

// Real-time subscriptions
export const subscribeToWorkoutSession = (sessionId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`workout-session-${sessionId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'workout_sessions',
        filter: `id=eq.${sessionId}`
      }, 
      callback
    )
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'workout_exercises',
        filter: `workout_session_id=eq.${sessionId}`
      }, 
      callback
    )
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'workout_sets',
        filter: `workout_exercise_id=in.(select id from workout_exercises where workout_session_id = '${sessionId}')`
      }, 
      callback
    )
    .subscribe()
}

export const subscribeToUserPersonalRecords = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`user-prs-${userId}`)
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'personal_records',
        filter: `user_id=eq.${userId}`
      }, 
      callback
    )
    .subscribe()
}

export const subscribeToUserGoals = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`user-goals-${userId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'user_goals',
        filter: `user_id=eq.${userId}`
      }, 
      callback
    )
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'goal_milestones',
        filter: `user_id=eq.${userId}`
      }, 
      callback
    )
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'goal_check_ins',
        filter: `user_id=eq.${userId}`
      }, 
      callback
    )
    .subscribe()
}