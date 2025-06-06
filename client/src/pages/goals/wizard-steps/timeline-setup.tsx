import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WizardData } from "../goal-wizard";
import {
  Calendar,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
  Timer
} from "lucide-react";
import { addDays, addWeeks, addMonths, format, differenceInWeeks, differenceInDays } from "date-fns";

interface TimelineSetupProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  errors: string[];
}

const QUICK_TIMEFRAMES = [
  { weeks: 4, label: '1 Month', description: 'Quick sprint goal', icon: Zap, color: 'bg-red-100 text-red-800' },
  { weeks: 8, label: '2 Months', description: 'Short-term focus', icon: Target, color: 'bg-orange-100 text-orange-800' },
  { weeks: 12, label: '3 Months', description: 'Popular choice', icon: TrendingUp, color: 'bg-blue-100 text-blue-800' },
  { weeks: 24, label: '6 Months', description: 'Sustainable change', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { weeks: 52, label: '1 Year', description: 'Long-term transformation', icon: Timer, color: 'bg-purple-100 text-purple-800' }
];

export function TimelineSetup({ data, updateData }: TimelineSetupProps) {
  const today = new Date();
  const minDate = format(addDays(today, 7), 'yyyy-MM-dd'); // Minimum 1 week from now
  const maxDate = format(addDays(today, 730), 'yyyy-MM-dd'); // Maximum 2 years from now

  // Calculate current timeline metrics
  const getTimelineMetrics = () => {
    if (!data.targetDate) return null;
    
    const targetDate = new Date(data.targetDate);
    const weeksUntilTarget = differenceInWeeks(targetDate, today);
    const daysUntilTarget = differenceInDays(targetDate, today);
    
    return {
      weeks: weeksUntilTarget,
      days: daysUntilTarget,
      isRushJob: weeksUntilTarget < 4,
      isRealistic: weeksUntilTarget >= 8 && weeksUntilTarget <= 52,
      isTooLong: weeksUntilTarget > 52
    };
  };

  // Set quick timeframe
  const setQuickTimeframe = (weeks: number) => {
    const targetDate = addWeeks(today, weeks);
    updateData({ 
      targetDate: format(targetDate, 'yyyy-MM-dd'),
      estimatedWeeks: weeks
    });
  };

  // Update target date and calculate weeks
  const handleDateChange = (dateString: string) => {
    if (dateString) {
      const targetDate = new Date(dateString);
      const weeks = differenceInWeeks(targetDate, today);
      updateData({ 
        targetDate: dateString,
        estimatedWeeks: weeks
      });
    } else {
      updateData({ targetDate: '', estimatedWeeks: 12 });
    }
  };

  // Get timeline recommendations based on goal type
  const getGoalTypeRecommendations = () => {
    switch (data.goalType) {
      case 'weight_loss':
        return {
          recommended: '12-24 weeks',
          rationale: 'Healthy weight loss of 1-2 lbs per week requires patience and consistency.',
          minWeeks: 8,
          maxWeeks: 52
        };
      case 'strength_gain':
        return {
          recommended: '8-16 weeks',
          rationale: 'Strength gains follow progressive overload principles and need adequate recovery.',
          minWeeks: 6,
          maxWeeks: 24
        };
      case 'body_composition':
        return {
          recommended: '16-24 weeks',
          rationale: 'Body recomposition requires time to build muscle while losing fat.',
          minWeeks: 12,
          maxWeeks: 36
        };
      default:
        return {
          recommended: '12 weeks',
          rationale: 'A quarter gives enough time for meaningful progress.',
          minWeeks: 8,
          maxWeeks: 24
        };
    }
  };

  const metrics = getTimelineMetrics();
  const recommendations = getGoalTypeRecommendations();

  return (
    <div className="space-y-6">
      {/* Goal-specific Timeline Guidance */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Timeline Recommendations for {data.goalType?.replace('_', ' ').toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Recommended Duration:</span>
              <Badge className="bg-blue-100 text-blue-800">
                {recommendations.recommended}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {recommendations.rationale}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Timeframe Selection */}
      <div>
        <Label className="text-base font-semibold mb-4 block">
          Choose a timeframe or set a custom date
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {QUICK_TIMEFRAMES.map((timeframe) => {
            const Icon = timeframe.icon;
            const isSelected = data.estimatedWeeks === timeframe.weeks;
            const isRecommended = timeframe.weeks >= recommendations.minWeeks && 
                                 timeframe.weeks <= recommendations.maxWeeks;
            
            return (
              <Card
                key={timeframe.weeks}
                className={`cursor-pointer transition-all duration-200 relative ${
                  isSelected 
                    ? 'ring-2 ring-primary border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setQuickTimeframe(timeframe.weeks)}
              >
                {isRecommended && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-green-500 text-white text-xs px-1 py-0">
                      Rec
                    </Badge>
                  </div>
                )}
                <CardContent className="p-4 text-center">
                  <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${timeframe.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="font-semibold text-sm">{timeframe.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {timeframe.description}
                  </div>
                  {isSelected && (
                    <Badge className="mt-2 bg-primary text-primary-foreground text-xs">
                      Selected
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Custom Date Picker */}
      <div>
        <Label htmlFor="targetDate" className="text-base font-semibold">
          Or choose a specific target date
        </Label>
        <p className="text-sm text-muted-foreground mb-3">
          Pick a meaningful date like a vacation, event, or personal milestone
        </p>
        <div className="relative max-w-sm">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="targetDate"
            type="date"
            value={data.targetDate}
            onChange={(e) => handleDateChange(e.target.value)}
            min={minDate}
            max={maxDate}
            className="pl-10"
          />
        </div>
      </div>

      {/* Timeline Analysis */}
      {metrics && (
        <Card className={`${
          metrics.isRushJob ? 'border-red-200 bg-red-50' :
          metrics.isRealistic ? 'border-green-200 bg-green-50' :
          'border-orange-200 bg-orange-50'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Timeline Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Timeline Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="font-semibold text-lg">{metrics.weeks}</div>
                <div className="text-sm text-muted-foreground">weeks</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="font-semibold text-lg">{metrics.days}</div>
                <div className="text-sm text-muted-foreground">days</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="font-semibold text-lg">
                  {data.targetDate ? format(new Date(data.targetDate), 'MMM d') : '--'}
                </div>
                <div className="text-sm text-muted-foreground">target date</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="font-semibold text-lg">
                  {data.targetDate ? format(new Date(data.targetDate), 'yyyy') : '--'}
                </div>
                <div className="text-sm text-muted-foreground">target year</div>
              </div>
            </div>

            {/* Timeline Feedback */}
            <div className={`flex items-start gap-3 p-4 rounded-lg ${
              metrics.isRushJob ? 'bg-red-100 text-red-800' :
              metrics.isRealistic ? 'bg-green-100 text-green-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {metrics.isRushJob ? (
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <div className="text-sm">
                <div className="font-semibold mb-1">
                  {metrics.isRushJob && 'Very Aggressive Timeline'}
                  {metrics.isRealistic && 'Great Timeline Choice!'}
                  {metrics.isTooLong && 'Very Long-Term Goal'}
                </div>
                <div>
                  {metrics.isRushJob && 
                    'This is a very short timeframe. Consider extending your deadline for more sustainable progress and better results.'
                  }
                  {metrics.isRealistic && 
                    'This timeframe allows for sustainable progress with proper planning and consistency. Perfect for building lasting habits!'
                  }
                  {metrics.isTooLong && 
                    'Long-term goals are great! Consider breaking this into smaller 3-6 month milestones to maintain motivation.'
                  }
                </div>
              </div>
            </div>

            {/* Goal-specific timeline advice */}
            {data.goalType && (
              <div className="p-4 bg-blue-100 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">
                  {data.goalType.replace('_', ' ').toUpperCase()} Timeline Tips:
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {data.goalType === 'weight_loss' && (
                    <>
                      <li>• Plan for 1-2 lbs of weight loss per week</li>
                      <li>• Include time for habit formation (21+ days)</li>
                      <li>• Account for potential plateaus and adjustments</li>
                      <li>• Consider seasonal factors and life events</li>
                    </>
                  )}
                  {data.goalType === 'strength_gain' && (
                    <>
                      <li>• Allow 4-6 weeks to see initial strength gains</li>
                      <li>• Progressive overload requires consistent training</li>
                      <li>• Include deload weeks for recovery</li>
                      <li>• Factor in muscle adaptation periods</li>
                    </>
                  )}
                  {data.goalType === 'body_composition' && (
                    <>
                      <li>• Body recomposition is slower than pure fat loss</li>
                      <li>• Muscle growth requires 8-12 weeks to show</li>
                      <li>• Progress photos are more valuable than scale weight</li>
                      <li>• Expect non-linear progress patterns</li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Milestone Preview */}
      {metrics && metrics.weeks > 4 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4" />
              Suggested Milestone Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Based on your {metrics.weeks}-week timeline, here's a suggested milestone breakdown:
            </p>
            <div className="grid gap-2">
              {[25, 50, 75].map((percentage) => {
                const milestoneWeek = Math.round((metrics.weeks * percentage) / 100);
                const milestoneDate = addWeeks(today, milestoneWeek);
                
                return (
                  <div key={percentage} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {percentage}%
                      </Badge>
                      <span className="text-sm">Week {milestoneWeek} Check-in</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(milestoneDate, 'MMM d, yyyy')}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              You'll be able to customize these milestones in the next step
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}