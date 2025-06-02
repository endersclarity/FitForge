-- FitForge Supabase Database Schema
-- Real Data-Driven Fitness Ecosystem
-- Created: June 1, 2025

-- Enable Row Level Security (RLS) for all tables
-- Enable real-time subscriptions for workout tracking

-- ============================================================================
-- AUTHENTICATION & USER MANAGEMENT
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User preferences
  preferred_units TEXT DEFAULT 'imperial', -- 'metric' or 'imperial'
  timezone TEXT DEFAULT 'UTC',
  fitness_level TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  
  -- Profile data
  age INTEGER,
  height_cm NUMERIC(5,2),
  current_weight_lbs NUMERIC(5,1),
  target_weight_lbs NUMERIC(5,1),
  activity_level TEXT DEFAULT 'moderate', -- 'sedentary', 'light', 'moderate', 'active', 'very_active'
  
  -- Privacy settings
  profile_visibility TEXT DEFAULT 'private' -- 'public', 'friends', 'private'
);

-- ============================================================================
-- EXERCISE DATABASE
-- ============================================================================

-- Exercise library (global, shared across all users)
CREATE TABLE public.exercises (
  id TEXT PRIMARY KEY,
  exercise_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Compound', 'Isolation'
  movement_pattern TEXT, -- 'Push', 'Pull', 'Squat', 'Hinge', 'Core', etc.
  workout_type TEXT NOT NULL, -- 'Abs', 'BackBiceps', 'ChestTriceps', 'Legs'
  equipment_type TEXT[] NOT NULL, -- Array of equipment: ['Barbell', 'Dumbbell', 'Bodyweight']
  difficulty_level TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  variation TEXT, -- 'A', 'B', 'C' for exercise variations
  
  -- Default parameters
  default_reps INTEGER DEFAULT 10,
  default_weight_lbs NUMERIC(5,1) DEFAULT 0,
  rest_time_seconds INTEGER DEFAULT 60,
  
  -- Exercise details
  description TEXT,
  form_cues TEXT[],
  contraindications TEXT[],
  safety_notes TEXT[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Primary muscles targeted by exercises
CREATE TABLE public.exercise_primary_muscles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id TEXT REFERENCES public.exercises(id) ON DELETE CASCADE,
  muscle_name TEXT NOT NULL,
  percentage INTEGER NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Secondary muscles targeted by exercises
CREATE TABLE public.exercise_secondary_muscles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id TEXT REFERENCES public.exercises(id) ON DELETE CASCADE,
  muscle_name TEXT NOT NULL,
  percentage INTEGER NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- WORKOUT SESSIONS & TRACKING
-- ============================================================================

-- Workout sessions (user-specific)
CREATE TABLE public.workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Session timing
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  total_duration_seconds INTEGER,
  
  -- Session metadata
  workout_type TEXT, -- 'Abs', 'BackBiceps', 'ChestTriceps', 'Legs', 'Custom'
  session_name TEXT,
  notes TEXT,
  
  -- Session metrics
  total_volume_lbs NUMERIC(10,1) DEFAULT 0,
  calories_burned INTEGER,
  average_heart_rate INTEGER,
  completion_status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'cancelled'
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual exercise performances within workout sessions
CREATE TABLE public.workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id TEXT REFERENCES public.exercises(id),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Exercise order and metadata
  exercise_order INTEGER NOT NULL,
  exercise_notes TEXT,
  
  -- Performance metrics
  total_volume_lbs NUMERIC(10,1) DEFAULT 0,
  total_sets_completed INTEGER DEFAULT 0,
  average_form_score NUMERIC(3,1), -- 1-10 scale
  rest_time_seconds INTEGER[],
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual sets within exercises
CREATE TABLE public.workout_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_exercise_id UUID REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Set details
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_lbs NUMERIC(5,1) NOT NULL,
  
  -- Performance tracking
  form_score NUMERIC(3,1), -- 1-10 scale
  perceived_exertion INTEGER CHECK (perceived_exertion >= 1 AND perceived_exertion <= 10), -- RPE scale
  is_completed BOOLEAN DEFAULT FALSE,
  is_personal_record BOOLEAN DEFAULT FALSE,
  
  -- Equipment used (can differ from exercise default)
  equipment_used TEXT,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  rest_time_after_seconds INTEGER,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PERSONAL RECORDS & ACHIEVEMENTS
-- ============================================================================

-- Personal records tracking
CREATE TABLE public.personal_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id TEXT REFERENCES public.exercises(id),
  
  -- Record types
  record_type TEXT NOT NULL, -- 'max_weight', 'max_reps', 'max_volume', 'max_one_rep_max'
  
  -- Record values
  weight_lbs NUMERIC(5,1),
  reps INTEGER,
  volume_lbs NUMERIC(10,1),
  one_rep_max_lbs NUMERIC(5,1),
  
  -- When the record was set
  workout_session_id UUID REFERENCES public.workout_sessions(id),
  workout_set_id UUID REFERENCES public.workout_sets(id),
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Previous record (for comparison)
  previous_value NUMERIC(10,1),
  improvement_percentage NUMERIC(5,2),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievement definitions (global)
CREATE TABLE public.achievement_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'consistency', 'strength', 'volume', 'personal'
  
  -- Achievement criteria
  criteria_type TEXT NOT NULL, -- 'workout_count', 'consecutive_days', 'total_volume', 'pr_count'
  criteria_value INTEGER NOT NULL,
  criteria_timeframe_days INTEGER, -- NULL for all-time achievements
  
  -- Tiers
  tier_level TEXT NOT NULL, -- 'bronze', 'silver', 'gold', 'platinum'
  points INTEGER DEFAULT 0,
  
  -- Display
  icon_name TEXT,
  color_scheme TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements (unlocked achievements)
CREATE TABLE public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES public.achievement_definitions(id),
  
  -- Achievement progress
  current_progress INTEGER DEFAULT 0,
  target_progress INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  
  -- When unlocked
  unlocked_at TIMESTAMP WITH TIME ZONE,
  workout_session_id UUID REFERENCES public.workout_sessions(id), -- Which workout unlocked it
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

-- ============================================================================
-- ANALYTICS & PROGRESS TRACKING
-- ============================================================================

-- Body composition tracking
CREATE TABLE public.body_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Measurements
  weight_lbs NUMERIC(5,1),
  body_fat_percentage NUMERIC(4,1),
  muscle_mass_lbs NUMERIC(5,1),
  
  -- Body measurements (inches)
  chest_inches NUMERIC(4,1),
  waist_inches NUMERIC(4,1),
  hips_inches NUMERIC(4,1),
  bicep_inches NUMERIC(4,1),
  thigh_inches NUMERIC(4,1),
  
  -- Progress photos
  photo_urls TEXT[],
  
  -- Metadata
  measured_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout analytics summaries (computed daily)
CREATE TABLE public.workout_analytics_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Date
  analytics_date DATE NOT NULL,
  
  -- Daily metrics
  total_workouts INTEGER DEFAULT 0,
  total_volume_lbs NUMERIC(10,1) DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  calories_burned INTEGER DEFAULT 0,
  
  -- Exercise breakdown
  chest_volume NUMERIC(10,1) DEFAULT 0,
  back_volume NUMERIC(10,1) DEFAULT 0,
  legs_volume NUMERIC(10,1) DEFAULT 0,
  abs_volume NUMERIC(10,1) DEFAULT 0,
  
  -- Personal records
  new_prs_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, analytics_date)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all user-specific tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_analytics_daily ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Workout Sessions: Users can only access their own workouts
CREATE POLICY "Users can view own workout sessions" ON public.workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions" ON public.workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions" ON public.workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions" ON public.workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Workout Exercises: Users can only access their own workout exercises
CREATE POLICY "Users can view own workout exercises" ON public.workout_exercises
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout exercises" ON public.workout_exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout exercises" ON public.workout_exercises
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout exercises" ON public.workout_exercises
  FOR DELETE USING (auth.uid() = user_id);

-- Workout Sets: Users can only access their own sets
CREATE POLICY "Users can view own workout sets" ON public.workout_sets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sets" ON public.workout_sets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sets" ON public.workout_sets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sets" ON public.workout_sets
  FOR DELETE USING (auth.uid() = user_id);

-- Personal Records: Users can only access their own PRs
CREATE POLICY "Users can view own personal records" ON public.personal_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personal records" ON public.personal_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Achievements: Users can only access their own achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON public.user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- Body Stats: Users can only access their own body composition data
CREATE POLICY "Users can view own body stats" ON public.body_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own body stats" ON public.body_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own body stats" ON public.body_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own body stats" ON public.body_stats
  FOR DELETE USING (auth.uid() = user_id);

-- Workout Analytics: Users can only access their own analytics
CREATE POLICY "Users can view own analytics" ON public.workout_analytics_daily
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- PUBLIC READ ACCESS FOR SHARED DATA
-- ============================================================================

-- Exercise database is public (read-only for all authenticated users)
CREATE POLICY "Anyone can view exercises" ON public.exercises
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view exercise primary muscles" ON public.exercise_primary_muscles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view exercise secondary muscles" ON public.exercise_secondary_muscles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Achievement definitions are public (read-only)
CREATE POLICY "Anyone can view achievement definitions" ON public.achievement_definitions
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- REAL-TIME SUBSCRIPTIONS
-- ============================================================================

-- Enable real-time for workout tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_exercises;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_sets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.personal_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Workout performance indexes
CREATE INDEX idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_start_time ON public.workout_sessions(start_time);
CREATE INDEX idx_workout_sessions_user_date ON public.workout_sessions(user_id, start_time);

CREATE INDEX idx_workout_exercises_session_id ON public.workout_exercises(workout_session_id);
CREATE INDEX idx_workout_exercises_user_id ON public.workout_exercises(user_id);
CREATE INDEX idx_workout_exercises_exercise_id ON public.workout_exercises(exercise_id);

CREATE INDEX idx_workout_sets_exercise_id ON public.workout_sets(workout_exercise_id);
CREATE INDEX idx_workout_sets_user_id ON public.workout_sets(user_id);
CREATE INDEX idx_workout_sets_completed_at ON public.workout_sets(completed_at);

-- Personal records indexes
CREATE INDEX idx_personal_records_user_exercise ON public.personal_records(user_id, exercise_id);
CREATE INDEX idx_personal_records_achieved_at ON public.personal_records(achieved_at);

-- Exercise database indexes
CREATE INDEX idx_exercises_workout_type ON public.exercises(workout_type);
CREATE INDEX idx_exercises_category ON public.exercises(category);
CREATE INDEX idx_exercise_muscles_exercise_id ON public.exercise_primary_muscles(exercise_id);

-- Analytics indexes
CREATE INDEX idx_analytics_user_date ON public.workout_analytics_daily(user_id, analytics_date);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_workout_sessions_updated_at BEFORE UPDATE ON public.workout_sessions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_workout_exercises_updated_at BEFORE UPDATE ON public.workout_exercises
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_workout_sets_updated_at BEFORE UPDATE ON public.workout_sets
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_achievements_updated_at BEFORE UPDATE ON public.user_achievements
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to calculate one-rep max (Epley formula)
CREATE OR REPLACE FUNCTION calculate_one_rep_max(weight_lbs NUMERIC, reps INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  IF reps = 1 THEN
    RETURN weight_lbs;
  END IF;
  
  -- Epley formula: 1RM = weight * (1 + reps/30)
  RETURN ROUND(weight_lbs * (1 + reps::NUMERIC / 30), 1);
END;
$$ LANGUAGE plpgsql;

-- Function to check and create personal records
CREATE OR REPLACE FUNCTION check_personal_record()
RETURNS TRIGGER AS $$
DECLARE
  existing_max_weight NUMERIC;
  existing_max_reps INTEGER;
  existing_max_volume NUMERIC;
  existing_one_rep_max NUMERIC;
  new_one_rep_max NUMERIC;
  exercise_id_val TEXT;
BEGIN
  -- Get exercise_id from workout_exercises
  SELECT we.exercise_id INTO exercise_id_val
  FROM public.workout_exercises we
  WHERE we.id = NEW.workout_exercise_id;
  
  IF exercise_id_val IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Only check for PRs on completed sets
  IF NEW.is_completed = TRUE THEN
    -- Get existing personal records
    SELECT 
      COALESCE(MAX(CASE WHEN record_type = 'max_weight' THEN weight_lbs END), 0),
      COALESCE(MAX(CASE WHEN record_type = 'max_reps' THEN reps END), 0),
      COALESCE(MAX(CASE WHEN record_type = 'max_volume' THEN volume_lbs END), 0),
      COALESCE(MAX(CASE WHEN record_type = 'max_one_rep_max' THEN one_rep_max_lbs END), 0)
    INTO existing_max_weight, existing_max_reps, existing_max_volume, existing_one_rep_max
    FROM public.personal_records
    WHERE user_id = NEW.user_id AND exercise_id = exercise_id_val;
    
    -- Calculate new one rep max
    new_one_rep_max := calculate_one_rep_max(NEW.weight_lbs, NEW.reps);
    
    -- Check for max weight PR
    IF NEW.weight_lbs > COALESCE(existing_max_weight, 0) THEN
      INSERT INTO public.personal_records (
        user_id, exercise_id, record_type, weight_lbs, reps,
        workout_set_id, achieved_at, previous_value,
        improvement_percentage
      ) VALUES (
        NEW.user_id, exercise_id_val, 'max_weight', NEW.weight_lbs, NEW.reps,
        NEW.id, NEW.completed_at, existing_max_weight,
        CASE WHEN existing_max_weight > 0 
             THEN ROUND(((NEW.weight_lbs - existing_max_weight) / existing_max_weight * 100), 2)
             ELSE 100 END
      );
      NEW.is_personal_record := TRUE;
    END IF;
    
    -- Check for max reps PR (at same or higher weight)
    IF NEW.reps > COALESCE(existing_max_reps, 0) THEN
      INSERT INTO public.personal_records (
        user_id, exercise_id, record_type, weight_lbs, reps,
        workout_set_id, achieved_at, previous_value,
        improvement_percentage
      ) VALUES (
        NEW.user_id, exercise_id_val, 'max_reps', NEW.weight_lbs, NEW.reps,
        NEW.id, NEW.completed_at, existing_max_reps,
        CASE WHEN existing_max_reps > 0 
             THEN ROUND(((NEW.reps - existing_max_reps)::NUMERIC / existing_max_reps * 100), 2)
             ELSE 100 END
      );
      NEW.is_personal_record := TRUE;
    END IF;
    
    -- Check for volume PR (weight * reps)
    IF (NEW.weight_lbs * NEW.reps) > COALESCE(existing_max_volume, 0) THEN
      INSERT INTO public.personal_records (
        user_id, exercise_id, record_type, volume_lbs, weight_lbs, reps,
        workout_set_id, achieved_at, previous_value,
        improvement_percentage
      ) VALUES (
        NEW.user_id, exercise_id_val, 'max_volume', NEW.weight_lbs * NEW.reps, NEW.weight_lbs, NEW.reps,
        NEW.id, NEW.completed_at, existing_max_volume,
        CASE WHEN existing_max_volume > 0 
             THEN ROUND(((NEW.weight_lbs * NEW.reps - existing_max_volume) / existing_max_volume * 100), 2)
             ELSE 100 END
      );
      NEW.is_personal_record := TRUE;
    END IF;
    
    -- Check for one rep max PR
    IF new_one_rep_max > COALESCE(existing_one_rep_max, 0) THEN
      INSERT INTO public.personal_records (
        user_id, exercise_id, record_type, one_rep_max_lbs, weight_lbs, reps,
        workout_set_id, achieved_at, previous_value,
        improvement_percentage
      ) VALUES (
        NEW.user_id, exercise_id_val, 'max_one_rep_max', new_one_rep_max, NEW.weight_lbs, NEW.reps,
        NEW.id, NEW.completed_at, existing_one_rep_max,
        CASE WHEN existing_one_rep_max > 0 
             THEN ROUND(((new_one_rep_max - existing_one_rep_max) / existing_one_rep_max * 100), 2)
             ELSE 100 END
      );
      NEW.is_personal_record := TRUE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically check for personal records
CREATE TRIGGER check_personal_record_trigger
  BEFORE UPDATE ON public.workout_sets
  FOR EACH ROW
  EXECUTE FUNCTION check_personal_record();

-- ============================================================================
-- SAMPLE DATA INSERTION
-- ============================================================================

-- This will be populated by our migration script
-- INSERT INTO achievement_definitions will go here
-- INSERT INTO exercises will go here

COMMENT ON SCHEMA public IS 'FitForge Database Schema - Real Data-Driven Fitness Ecosystem';