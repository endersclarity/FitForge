import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { WizardData } from "../goal-wizard";
import {
  Plus,
  CheckCircle,
  Target,
  Gift,
  Calendar,
  Trash2,
  Edit,
  Trophy,
  Flag,
  Star
} from "lucide-react";
import { addWeeks, format } from "date-fns";

interface MilestoneCreationProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  errors: string[];
}

interface NewMilestone {
  percentage: number;
  description: string;
  reward?: string;
}

const MILESTONE_TEMPLATES = [
  { percentage: 25, description: "First quarter progress check", icon: Flag },
  { percentage: 50, description: "Halfway point celebration", icon: Trophy },
  { percentage: 75, description: "Three-quarters achievement", icon: Star },
  { percentage: 90, description: "Almost there - final push", icon: Target }
];

const MILESTONE_IDEAS_BY_GOAL = {
  weight_loss: [
    "Lost first 5 pounds",
    "Down one clothing size",
    "Completed first month of consistent tracking",
    "Lost 10% of total goal weight",
    "Energy levels noticeably improved"
  ],
  strength_gain: [
    "Increased weight by 10 lbs",
    "Completed first month of training",
    "Hit new personal record",
    "Improved form and technique",
    "Added 25% to starting weight"
  ],
  body_composition: [
    "Lost first 2% body fat",
    "Progress photos show visible change",
    "Clothes fitting better",
    "Measurements show improvement",
    "Body fat down to target range"
  ]
};

const REWARD_IDEAS = [
  "New workout outfit",
  "Massage or spa treatment",
  "Favorite healthy meal at restaurant",
  "New fitness equipment",
  "Weekend getaway",
  "Progress photoshoot",
  "New book or entertainment",
  "Social celebration with friends",
  "Personal day off",
  "Equipment upgrade"
];

export function MilestoneCreation({ data, updateData }: MilestoneCreationProps) {
  const [newMilestone, setNewMilestone] = useState<NewMilestone>({
    percentage: 25,
    description: "",
    reward: ""
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Calculate milestone dates
  const getMilestoneDate = (percentage: number) => {
    if (!data.targetDate) return null;
    const today = new Date();
    const targetDate = new Date(data.targetDate);
    const totalDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const milestoneDays = Math.round((totalDays * percentage) / 100);
    const milestoneDate = new Date(today.getTime() + (milestoneDays * 24 * 60 * 60 * 1000));
    return milestoneDate;
  };

  // Add milestone
  const addMilestone = () => {
    if (!newMilestone.description.trim()) return;
    
    const milestones = [...data.milestones, { ...newMilestone }];
    milestones.sort((a, b) => a.percentage - b.percentage);
    
    updateData({ milestones });
    setNewMilestone({ percentage: 25, description: "", reward: "" });
  };

  // Edit milestone
  const editMilestone = (index: number) => {
    if (editingIndex !== null) {
      // Save current edit
      const milestones = [...data.milestones];
      milestones[editingIndex] = { ...newMilestone };
      milestones.sort((a, b) => a.percentage - b.percentage);
      updateData({ milestones });
    }
    
    setEditingIndex(index);
    setNewMilestone({ ...data.milestones[index] });
  };

  // Save edit
  const saveEdit = () => {
    if (editingIndex === null) return;
    
    const milestones = [...data.milestones];
    milestones[editingIndex] = { ...newMilestone };
    milestones.sort((a, b) => a.percentage - b.percentage);
    
    updateData({ milestones });
    setEditingIndex(null);
    setNewMilestone({ percentage: 25, description: "", reward: "" });
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingIndex(null);
    setNewMilestone({ percentage: 25, description: "", reward: "" });
  };

  // Delete milestone
  const deleteMilestone = (index: number) => {
    const milestones = data.milestones.filter((_, i) => i !== index);
    updateData({ milestones });
  };

  // Use template
  const useTemplate = (template: typeof MILESTONE_TEMPLATES[0]) => {
    setNewMilestone({
      percentage: template.percentage,
      description: template.description,
      reward: ""
    });
  };

  // Use idea
  const useIdea = (idea: string) => {
    setNewMilestone(prev => ({ ...prev, description: idea }));
  };

  const milestoneIdeas = data.goalType ? MILESTONE_IDEAS_BY_GOAL[data.goalType] || [] : [];

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">Break Your Goal Into Milestones</h3>
              <p className="text-sm text-blue-700">
                Milestones help you stay motivated and track progress. They make big goals feel more achievable!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Milestones */}
      {data.milestones.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Your Milestones ({data.milestones.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.milestones.map((milestone, index) => {
              const milestoneDate = getMilestoneDate(milestone.percentage);
              
              return (
                <div key={index} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-primary text-primary-foreground">
                          {milestone.percentage}%
                        </Badge>
                        {milestoneDate && (
                          <span className="text-sm text-muted-foreground">
                            {format(milestoneDate, 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium mb-1">{milestone.description}</h4>
                      {milestone.reward && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Gift className="h-3 w-3" />
                          <span>Reward: {milestone.reward}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editMilestone(index)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMilestone(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Milestone Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {editingIndex !== null ? 'Edit Milestone' : 'Add New Milestone'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Percentage */}
          <div>
            <Label htmlFor="percentage" className="text-base font-semibold">
              Progress Percentage
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              At what percentage of your goal should this milestone trigger?
            </p>
            <div className="flex items-center gap-2">
              <Input
                id="percentage"
                type="number"
                value={newMilestone.percentage}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, percentage: parseInt(e.target.value) || 0 }))}
                min="1"
                max="100"
                step="5"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">%</span>
              {getMilestoneDate(newMilestone.percentage) && (
                <span className="text-sm text-muted-foreground ml-4">
                  Target: {format(getMilestoneDate(newMilestone.percentage)!, 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="milestoneDescription" className="text-base font-semibold">
              Milestone Description
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              What achievement will you celebrate at this point?
            </p>
            <Textarea
              id="milestoneDescription"
              placeholder="Describe what you'll have accomplished..."
              value={newMilestone.description}
              onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Reward */}
          <div>
            <Label htmlFor="milestoneReward" className="text-base font-semibold">
              Reward (Optional)
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              How will you celebrate this milestone?
            </p>
            <Input
              id="milestoneReward"
              placeholder="Your celebration or reward..."
              value={newMilestone.reward}
              onChange={(e) => setNewMilestone(prev => ({ ...prev, reward: e.target.value }))}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {editingIndex !== null ? (
              <>
                <Button onClick={saveEdit} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                onClick={addMilestone} 
                disabled={!newMilestone.description.trim()}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Milestone
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Templates */}
      {editingIndex === null && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Quick Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click to use these common milestone templates:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {MILESTONE_TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <Card
                    key={template.percentage}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => useTemplate(template)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {template.percentage}%
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{template.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goal-Specific Ideas */}
      {milestoneIdeas.length > 0 && editingIndex === null && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              {data.goalType?.replace('_', ' ').toUpperCase()} Milestone Ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Common milestones for your goal type:
            </p>
            <div className="flex flex-wrap gap-2">
              {milestoneIdeas.map((idea, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => useIdea(idea)}
                  className="text-xs"
                >
                  {idea}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reward Ideas */}
      {editingIndex === null && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Reward Ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Celebrate your progress with these reward ideas:
            </p>
            <div className="flex flex-wrap gap-2">
              {REWARD_IDEAS.map((reward, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setNewMilestone(prev => ({ ...prev, reward }))}
                  className="text-xs"
                >
                  {reward}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <h4 className="font-semibold text-green-800 mb-2">💡 Milestone Tips:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Make milestones specific and measurable</li>
            <li>• Space them evenly throughout your timeline</li>
            <li>• Include both process goals (habits) and outcome goals (results)</li>
            <li>• Plan meaningful rewards that don't sabotage your progress</li>
            <li>• Review and adjust milestones as you progress</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}