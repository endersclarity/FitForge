import { supabase } from '@/lib/supabase'
import type { WorkoutSession, WorkoutAnalyticsSummary } from '@/lib/supabase'

export interface DailyAnalytics {
  date: string
  totalWorkouts: number
  totalVolume: number
  totalDuration: number
  caloriesBurned: number
  chestVolume: number
  backVolume: number
  legsVolume: number
  absVolume: number
  newPersonalRecords: number
}

export interface WeeklyTrends {
  weekStart: string
  weekEnd: string
  totalVolume: number
  volumeChange: number
  workoutCount: number
  countChange: number
  avgDuration: number
  durationChange: number
  personalRecords: number
}

export interface ProgressMetrics {
  strengthGain: number
  volumeIncrease: number
  consistencyStreak: number
  totalWorkouts: number
  avgWorkoutDuration: number
  strongestMuscleGroup: string
  mostImprovedExercise: string
}

export class WorkoutAnalyticsService {
  /**
   * Aggregate workout data into daily analytics after workout completion
   */
  async aggregateDailyAnalytics(sessionId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get the completed session
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          workout_exercises (
            *,
            exercise_id,
            total_volume_lbs,
            workout_sets (*)
          )
        `)
        .eq('id', sessionId)
        .single()

      if (sessionError) throw sessionError

      const sessionDate = new Date(session.start_time).toISOString().split('T')[0]

      // Calculate muscle group volumes
      const muscleGroupVolumes = await this.calculateMuscleGroupVolumes(session.workout_exercises)

      // Count new personal records from this session
      const { data: sessionPRs, error: prError } = await supabase
        .from('personal_records')
        .select('id')
        .eq('user_id', user.id)
        .eq('workout_session_id', sessionId)

      if (prError) throw prError

      // Get existing analytics for this date or create new
      const { data: existingAnalytics, error: analyticsError } = await supabase
        .from('workout_analytics_daily')
        .select('*')
        .eq('user_id', user.id)
        .eq('analytics_date', sessionDate)
        .single()

      const analyticsData = {
        user_id: user.id,
        analytics_date: sessionDate,
        total_workouts: (existingAnalytics?.total_workouts || 0) + 1,
        total_volume_lbs: (existingAnalytics?.total_volume_lbs || 0) + (session.total_volume_lbs || 0),
        total_duration_seconds: (existingAnalytics?.total_duration_seconds || 0) + (session.total_duration_seconds || 0),
        calories_burned: (existingAnalytics?.calories_burned || 0) + (session.calories_burned || 0),
        chest_volume: (existingAnalytics?.chest_volume || 0) + muscleGroupVolumes.chest,
        back_volume: (existingAnalytics?.back_volume || 0) + muscleGroupVolumes.back,
        legs_volume: (existingAnalytics?.legs_volume || 0) + muscleGroupVolumes.legs,
        abs_volume: (existingAnalytics?.abs_volume || 0) + muscleGroupVolumes.abs,
        new_prs_count: (existingAnalytics?.new_prs_count || 0) + (sessionPRs?.length || 0)
      }

      // Upsert analytics data
      const { error: upsertError } = await supabase
        .from('workout_analytics_daily')
        .upsert(analyticsData, {
          onConflict: 'user_id,analytics_date'
        })

      if (upsertError) throw upsertError

      console.log('✅ Daily analytics aggregated for', sessionDate)
    } catch (error) {
      console.error('Error aggregating daily analytics:', error)
      throw error
    }
  }

  /**
   * Calculate muscle group volumes from workout exercises
   */
  private async calculateMuscleGroupVolumes(exercises: any[]): Promise<{
    chest: number
    back: number  
    legs: number
    abs: number
  }> {
    const volumes = { chest: 0, back: 0, legs: 0, abs: 0 }

    for (const exercise of exercises) {
      // Get muscle activation for this exercise
      const { data: primaryMuscles, error } = await supabase
        .from('exercise_primary_muscles')
        .select('muscle_name, percentage')
        .eq('exercise_id', exercise.exercise_id)

      if (error) continue

      // Map muscles to groups and distribute volume based on activation percentage
      for (const muscle of primaryMuscles || []) {
        const volumeContribution = exercise.total_volume_lbs * (muscle.percentage / 100)
        
        if (muscle.muscle_name.toLowerCase().includes('chest') || 
            muscle.muscle_name.toLowerCase().includes('pectoral')) {
          volumes.chest += volumeContribution
        } else if (muscle.muscle_name.toLowerCase().includes('back') ||
                   muscle.muscle_name.toLowerCase().includes('lat') ||
                   muscle.muscle_name.toLowerCase().includes('rhomboid') ||
                   muscle.muscle_name.toLowerCase().includes('trapezius')) {
          volumes.back += volumeContribution
        } else if (muscle.muscle_name.toLowerCase().includes('quad') ||
                   muscle.muscle_name.toLowerCase().includes('hamstring') ||
                   muscle.muscle_name.toLowerCase().includes('glute') ||
                   muscle.muscle_name.toLowerCase().includes('calf')) {
          volumes.legs += volumeContribution
        } else if (muscle.muscle_name.toLowerCase().includes('abs') ||
                   muscle.muscle_name.toLowerCase().includes('core') ||
                   muscle.muscle_name.toLowerCase().includes('oblique')) {
          volumes.abs += volumeContribution
        }
      }
    }

    return volumes
  }

  /**
   * Get daily analytics for a date range
   */
  async getDailyAnalytics(startDate: string, endDate: string): Promise<DailyAnalytics[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('workout_analytics_daily')
        .select('*')
        .eq('user_id', user.id)
        .gte('analytics_date', startDate)
        .lte('analytics_date', endDate)
        .order('analytics_date', { ascending: true })

      if (error) throw error

      return (data || []).map(row => ({
        date: row.analytics_date,
        totalWorkouts: row.total_workouts,
        totalVolume: row.total_volume_lbs,
        totalDuration: row.total_duration_seconds,
        caloriesBurned: row.calories_burned || 0,
        chestVolume: row.chest_volume,
        backVolume: row.back_volume,
        legsVolume: row.legs_volume,
        absVolume: row.abs_volume,
        newPersonalRecords: row.new_prs_count
      }))
    } catch (error) {
      console.error('Error getting daily analytics:', error)
      throw error
    }
  }

  /**
   * Get weekly trend analysis
   */
  async getWeeklyTrends(weekCount = 4): Promise<WeeklyTrends[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - (weekCount * 7))

      const analytics = await this.getDailyAnalytics(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )

      // Group by weeks and calculate trends
      const weeks: WeeklyTrends[] = []
      
      for (let i = 0; i < weekCount; i++) {
        const weekStart = new Date(startDate)
        weekStart.setDate(startDate.getDate() + (i * 7))
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)

        const weekData = analytics.filter(day => {
          const dayDate = new Date(day.date)
          return dayDate >= weekStart && dayDate <= weekEnd
        })

        const weekTotals = weekData.reduce((totals, day) => ({
          volume: totals.volume + day.totalVolume,
          workouts: totals.workouts + day.totalWorkouts,
          duration: totals.duration + day.totalDuration,
          prs: totals.prs + day.newPersonalRecords
        }), { volume: 0, workouts: 0, duration: 0, prs: 0 })

        const avgDuration = weekTotals.workouts > 0 ? weekTotals.duration / weekTotals.workouts : 0

        weeks.push({
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0],
          totalVolume: weekTotals.volume,
          volumeChange: i > 0 ? weekTotals.volume - weeks[i-1].totalVolume : 0,
          workoutCount: weekTotals.workouts,
          countChange: i > 0 ? weekTotals.workouts - weeks[i-1].workoutCount : 0,
          avgDuration,
          durationChange: i > 0 ? avgDuration - weeks[i-1].avgDuration : 0,
          personalRecords: weekTotals.prs
        })
      }

      return weeks
    } catch (error) {
      console.error('Error getting weekly trends:', error)
      throw error
    }
  }

  /**
   * Get comprehensive progress metrics
   */
  async getProgressMetrics(timeframeDays = 30): Promise<ProgressMetrics> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - timeframeDays)
      const startDateStr = startDate.toISOString().split('T')[0]

      // Get analytics for timeframe
      const analytics = await this.getDailyAnalytics(startDateStr, endDate)
      
      const totals = analytics.reduce((sum, day) => ({
        volume: sum.volume + day.totalVolume,
        workouts: sum.workouts + day.totalWorkouts,
        duration: sum.duration + day.totalDuration,
        prs: sum.prs + day.newPersonalRecords
      }), { volume: 0, workouts: 0, duration: 0, prs: 0 })

      // Calculate strength gain (simplified - based on PRs and volume increase)
      const firstWeekVolume = analytics.slice(0, 7).reduce((sum, day) => sum + day.totalVolume, 0)
      const lastWeekVolume = analytics.slice(-7).reduce((sum, day) => sum + day.totalVolume, 0)
      const volumeIncrease = firstWeekVolume > 0 ? ((lastWeekVolume - firstWeekVolume) / firstWeekVolume) * 100 : 0

      // Find strongest muscle group
      const muscleGroupTotals = analytics.reduce((totals, day) => ({
        chest: totals.chest + day.chestVolume,
        back: totals.back + day.backVolume,
        legs: totals.legs + day.legsVolume,
        abs: totals.abs + day.absVolume
      }), { chest: 0, back: 0, legs: 0, abs: 0 })

      const strongestMuscleGroup = Object.entries(muscleGroupTotals)
        .reduce((max, [group, volume]) => volume > max.volume ? { group, volume } : max, 
                { group: 'chest', volume: 0 }).group

      // Calculate consistency streak
      const workoutDays = analytics.filter(day => day.totalWorkouts > 0).length
      const consistencyStreak = workoutDays

      return {
        strengthGain: totals.prs * 5, // Simplified: 5% per PR
        volumeIncrease,
        consistencyStreak,
        totalWorkouts: totals.workouts,
        avgWorkoutDuration: totals.workouts > 0 ? totals.duration / totals.workouts : 0,
        strongestMuscleGroup,
        mostImprovedExercise: 'Bench Press' // TODO: Calculate from PR data
      }
    } catch (error) {
      console.error('Error getting progress metrics:', error)
      throw error
    }
  }

  /**
   * Update goal progress based on latest analytics
   */
  async updateGoalProgress(goalId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get goal details
      const { data: goal, error: goalError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', user.id)
        .single()

      if (goalError) throw goalError

      // Calculate progress based on goal type
      let progressPercentage = 0

      switch (goal.goal_type) {
        case 'strength_gain':
          if (goal.target_exercise_id && goal.target_weight_for_exercise_lbs) {
            // Get latest PR for target exercise
            const { data: latestPR, error: prError } = await supabase
              .from('personal_records')
              .select('weight_lbs')
              .eq('user_id', user.id)
              .eq('exercise_id', goal.target_exercise_id)
              .eq('record_type', 'max_weight')
              .order('achieved_at', { ascending: false })
              .limit(1)
              .single()

            if (!prError && latestPR) {
              const currentWeight = latestPR.weight_lbs
              const targetWeight = goal.target_weight_for_exercise_lbs
              const startWeight = goal.start_exercise_max_weight_lbs || 0
              
              if (targetWeight > startWeight) {
                progressPercentage = Math.min(100, 
                  ((currentWeight - startWeight) / (targetWeight - startWeight)) * 100
                )
              }
            }
          }
          break

        case 'weight_loss':
          // TODO: Integrate with body stats tracking
          break

        case 'body_composition':
          // TODO: Integrate with body fat tracking  
          break
      }

      // Update goal progress
      const { error: updateError } = await supabase
        .from('user_goals')
        .update({
          current_progress_percentage: Math.round(progressPercentage * 100) / 100,
          is_achieved: progressPercentage >= 100,
          achieved_date: progressPercentage >= 100 ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', goalId)

      if (updateError) throw updateError

      console.log(`✅ Goal progress updated: ${progressPercentage.toFixed(1)}%`)
    } catch (error) {
      console.error('Error updating goal progress:', error)
      throw error
    }
  }
}

// Export singleton instance
export const analyticsService = new WorkoutAnalyticsService()