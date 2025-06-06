import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WizardData } from "../goal-wizard";
import {
  Heart,
  Target,
  Lightbulb,
  MessageSquare,
  Quote,
  Sparkles,
  Gift,
  Users,
  Camera,
  Book
} from "lucide-react";

interface MotivationSetupProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  errors: string[];
}

const MOTIVATION_PROMPTS = [
  {
    category: "Personal Why",
    icon: Heart,
    questions: [
      "Why is this goal important to you right now?",
      "How will achieving this goal improve your life?",
      "What inspired you to start this fitness journey?",
      "How will you feel when you accomplish this goal?"
    ]
  },
  {
    category: "Vision & Impact",
    icon: Sparkles,
    questions: [
      "Describe your life once you've achieved this goal",
      "How will this change impact your daily routine?",
      "What will you be able to do that you can't do now?",
      "How will this goal affect your confidence and self-image?"
    ]
  },
  {
    category: "Support System",
    icon: Users,
    questions: [
      "Who will support you on this journey?",
      "How will achieving this goal inspire others?",
      "What role does your family/friends play in your motivation?",
      "How will you share your progress with others?"
    ]
  },
  {
    category: "Overcoming Challenges",
    icon: Target,
    questions: [
      "What obstacles might you face and how will you overcome them?",
      "How have you succeeded with similar challenges before?",
      "What will you do when motivation is low?",
      "How will you stay consistent on difficult days?"
    ]
  }
];

const REWARD_CATEGORIES = [
  {
    name: "Self-Care",
    icon: Heart,
    suggestions: [
      "Professional massage or spa day",
      "New skincare or wellness routine",
      "Relaxing weekend getaway",
      "Personal day off work"
    ]
  },
  {
    name: "Fitness Gear",
    icon: Target,
    suggestions: [
      "New workout outfit or shoes",
      "Fitness equipment upgrade",
      "Gym membership or class package",
      "Fitness tracker or smartwatch"
    ]
  },
  {
    name: "Experiences",
    icon: Camera,
    suggestions: [
      "Adventure activity or trip",
      "Professional photoshoot",
      "Concert or event tickets",
      "Learning a new skill or hobby"
    ]
  },
  {
    name: "Social",
    icon: Users,
    suggestions: [
      "Celebration dinner with loved ones",
      "Share success story publicly",
      "Inspire others with your journey",
      "Join a new fitness community"
    ]
  }
];

const MOTIVATION_EXAMPLES = [
  "I want to have energy to keep up with my kids and be a positive role model for healthy living.",
  "I'm tired of feeling uncomfortable in my own skin. I want to feel confident and strong in my body.",
  "My doctor said I need to make changes for my health. I want to avoid medication and prevent future health issues.",
  "I want to prove to myself that I can commit to something challenging and see it through to the end.",
  "I'm getting married/have a special event and want to feel amazing and confident on that day.",
  "I want to get back to the active lifestyle I used to love - hiking, sports, and outdoor activities."
];

export function MotivationSetup({ data, updateData }: MotivationSetupProps) {
  // Set motivation text
  const setMotivationText = (text: string) => {
    updateData({ motivationNotes: text });
  };

  // Add to motivation text
  const addToMotivation = (addition: string) => {
    const current = data.motivationNotes.trim();
    const separator = current ? '\n\n' : '';
    setMotivationText(current + separator + addition);
  };

  // Set reward text
  const setRewardText = (text: string) => {
    updateData({ rewardDescription: text });
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Heart className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-800 mb-1">Your Why Matters Most</h3>
              <p className="text-sm text-purple-700">
                Strong motivation is the key to achieving your goals. Take time to connect with your deeper reasons.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Motivation Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Your Motivation & Why
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="motivationNotes" className="text-base font-semibold">
              Describe your motivation *
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Write about why this goal matters to you. This will be your anchor when things get tough.
            </p>
            <Textarea
              id="motivationNotes"
              placeholder="I want to achieve this goal because..."
              value={data.motivationNotes}
              onChange={(e) => setMotivationText(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground mt-1">
              {data.motivationNotes.length}/500 characters
            </div>
          </div>

          {/* Example Motivations */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Quote className="h-4 w-4" />
              Example Motivations (Click to add)
            </h4>
            <div className="space-y-2">
              {MOTIVATION_EXAMPLES.map((example, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => addToMotivation(example)}
                >
                  <CardContent className="p-3">
                    <p className="text-sm italic text-muted-foreground">"{example}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Motivation Prompts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Motivation Prompts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Use these questions to dig deeper into your motivation:
          </p>
          <div className="space-y-4">
            {MOTIVATION_PROMPTS.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.category} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">{category.category}</h4>
                  </div>
                  <div className="space-y-2">
                    {category.questions.map((question, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="h-auto p-2 text-left justify-start text-wrap"
                        onClick={() => addToMotivation(`${question}\n[Write your answer here]`)}
                      >
                        <span className="text-sm text-muted-foreground">💭 {question}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Final Reward */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Goal Achievement Reward
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="rewardDescription" className="text-base font-semibold">
              How will you celebrate achieving your goal?
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Plan a meaningful reward that celebrates your achievement without undermining your progress.
            </p>
            <Textarea
              id="rewardDescription"
              placeholder="When I achieve this goal, I will..."
              value={data.rewardDescription}
              onChange={(e) => setRewardText(e.target.value)}
              rows={3}
            />
          </div>

          {/* Reward Ideas by Category */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Reward Ideas by Category
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              {REWARD_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <Card key={category.name} className="border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="h-4 w-4 text-primary" />
                        <h5 className="font-semibold text-sm">{category.name}</h5>
                      </div>
                      <div className="space-y-1">
                        {category.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-left justify-start w-full"
                            onClick={() => setRewardText(suggestion)}
                          >
                            <span className="text-xs text-muted-foreground">• {suggestion}</span>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Motivation Tips */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <Book className="h-4 w-4" />
            Motivation Maintenance Tips
          </h4>
          <ul className="text-sm text-blue-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>Read your why regularly:</strong> Review your motivation notes weekly, especially when facing challenges.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>Visualize success:</strong> Spend 5 minutes daily imagining how you'll feel when you achieve your goal.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>Share your story:</strong> Tell friends and family about your goal to create accountability.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>Update as you grow:</strong> Your motivation may evolve - revisit and refine these notes as needed.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>Connect to values:</strong> Link your goal to your core values like health, family, or self-respect.</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Progress Preview */}
      {data.motivationNotes && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Heart className="h-4 w-4" />
              Your Motivation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded border">
                <p className="text-sm font-medium text-green-800 mb-1">Your Why:</p>
                <p className="text-sm text-green-700 italic">"{data.motivationNotes}"</p>
              </div>
              {data.rewardDescription && (
                <div className="p-3 bg-white rounded border">
                  <p className="text-sm font-medium text-green-800 mb-1">Achievement Reward:</p>
                  <p className="text-sm text-green-700 italic">"{data.rewardDescription}"</p>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>This motivation will be saved with your goal for future reference</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Import CheckCircle for the preview
import { CheckCircle } from "lucide-react";