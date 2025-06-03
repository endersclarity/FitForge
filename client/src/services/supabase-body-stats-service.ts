import { supabase } from '@/lib/supabase'

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
  notes: string | null
  recorded_at: string
  created_at: string
  updated_at: string
}

export interface CreateBodyStatsRequest {
  weight_lbs?: number
  body_fat_percentage?: number
  muscle_mass_lbs?: number
  chest_inches?: number
  waist_inches?: number
  hips_inches?: number
  bicep_inches?: number
  thigh_inches?: number
  notes?: string
}

export class SupabaseBodyStatsService {
  
  /**
   * Log new body stats
   */
  async logBodyStats(request: CreateBodyStatsRequest): Promise<BodyStats> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      console.log('💪 Logging body stats to Supabase...')

      // Ensure at least one measurement is provided
      const hasData = Object.values(request).some(value => value !== undefined && value !== null && value !== '')
      if (!hasData) {
        throw new Error('Please provide at least one measurement')
      }

      // Insert body stats
      const { data: bodyStats, error } = await supabase
        .from('body_stats')
        .insert({
          user_id: user.id,
          recorded_at: new Date().toISOString(),
          ...request
        })
        .select()
        .single()

      if (error) throw error

      console.log('✅ Body stats logged successfully')
      return bodyStats

    } catch (error) {
      console.error('Error logging body stats:', error)
      throw error
    }
  }

  /**
   * Get user's body stats history
   */
  async getBodyStatsHistory(userId: string, limit: number = 50): Promise<BodyStats[]> {
    try {
      console.log('📊 Fetching body stats history from Supabase...')

      const { data: bodyStats, error } = await supabase
        .from('body_stats')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      console.log(`✅ Found ${bodyStats.length} body stats records`)
      return bodyStats

    } catch (error) {
      console.error('Error fetching body stats history:', error)
      throw error
    }
  }

  /**
   * Get latest body stats for user
   */
  async getLatestBodyStats(userId: string): Promise<BodyStats | null> {
    try {
      console.log('📊 Fetching latest body stats from Supabase...')

      const { data: bodyStats, error } = await supabase
        .from('body_stats')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      if (bodyStats) {
        console.log('✅ Found latest body stats')
      } else {
        console.log('📝 No body stats found')
      }

      return bodyStats

    } catch (error) {
      console.error('Error fetching latest body stats:', error)
      throw error
    }
  }

  /**
   * Update existing body stats entry
   */
  async updateBodyStats(statsId: string, request: Partial<CreateBodyStatsRequest>): Promise<BodyStats> {
    try {
      console.log('✏️ Updating body stats in Supabase...')

      const { data: bodyStats, error } = await supabase
        .from('body_stats')
        .update({
          ...request,
          updated_at: new Date().toISOString()
        })
        .eq('id', statsId)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Body stats updated successfully')
      return bodyStats

    } catch (error) {
      console.error('Error updating body stats:', error)
      throw error
    }
  }

  /**
   * Delete body stats entry
   */
  async deleteBodyStats(statsId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting body stats from Supabase...')

      const { error } = await supabase
        .from('body_stats')
        .delete()
        .eq('id', statsId)

      if (error) throw error

      console.log('✅ Body stats deleted successfully')

    } catch (error) {
      console.error('Error deleting body stats:', error)
      throw error
    }
  }

  /**
   * Get body stats within date range
   */
  async getBodyStatsInRange(userId: string, startDate: string, endDate: string): Promise<BodyStats[]> {
    try {
      console.log('📅 Fetching body stats in date range from Supabase...')

      const { data: bodyStats, error } = await supabase
        .from('body_stats')
        .select('*')
        .eq('user_id', userId)
        .gte('recorded_at', startDate)
        .lte('recorded_at', endDate)
        .order('recorded_at', { ascending: true })

      if (error) throw error

      console.log(`✅ Found ${bodyStats.length} body stats records in range`)
      return bodyStats

    } catch (error) {
      console.error('Error fetching body stats in range:', error)
      throw error
    }
  }

  /**
   * Get weight progress data for charts
   */
  async getWeightProgress(userId: string, days: number = 90): Promise<{ date: string; weight: number }[]> {
    try {
      console.log('📈 Fetching weight progress data...')

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data: bodyStats, error } = await supabase
        .from('body_stats')
        .select('recorded_at, weight_lbs')
        .eq('user_id', userId)
        .gte('recorded_at', startDate.toISOString())
        .not('weight_lbs', 'is', null)
        .order('recorded_at', { ascending: true })

      if (error) throw error

      const weightProgress = bodyStats.map(stat => ({
        date: stat.recorded_at.split('T')[0], // Extract date part
        weight: stat.weight_lbs
      }))

      console.log(`✅ Found ${weightProgress.length} weight data points`)
      return weightProgress

    } catch (error) {
      console.error('Error fetching weight progress:', error)
      throw error
    }
  }

  /**
   * Get measurement comparison (current vs starting)
   */
  async getMeasurementComparison(userId: string): Promise<{
    current: BodyStats | null
    starting: BodyStats | null
    changes: {
      weight_change?: number
      body_fat_change?: number
      chest_change?: number
      waist_change?: number
      bicep_change?: number
    }
  }> {
    try {
      console.log('📏 Calculating measurement comparison...')

      // Get latest stats
      const current = await this.getLatestBodyStats(userId)

      // Get earliest stats
      const { data: earliest, error } = await supabase
        .from('body_stats')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      // Calculate changes
      const changes: any = {}
      if (current && earliest) {
        if (current.weight_lbs && earliest.weight_lbs) {
          changes.weight_change = current.weight_lbs - earliest.weight_lbs
        }
        if (current.body_fat_percentage && earliest.body_fat_percentage) {
          changes.body_fat_change = current.body_fat_percentage - earliest.body_fat_percentage
        }
        if (current.chest_inches && earliest.chest_inches) {
          changes.chest_change = current.chest_inches - earliest.chest_inches
        }
        if (current.waist_inches && earliest.waist_inches) {
          changes.waist_change = current.waist_inches - earliest.waist_inches
        }
        if (current.bicep_inches && earliest.bicep_inches) {
          changes.bicep_change = current.bicep_inches - earliest.bicep_inches
        }
      }

      console.log('✅ Measurement comparison calculated')
      return {
        current,
        starting: earliest,
        changes
      }

    } catch (error) {
      console.error('Error calculating measurement comparison:', error)
      throw error
    }
  }
}

export const bodyStatsService = new SupabaseBodyStatsService()