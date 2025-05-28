import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { UserStats } from "@shared/schema";
import { 
  Apple, 
  Coffee, 
  Utensils, 
  Plus,
  Target,
  TrendingUp,
  Calendar,
  Search
} from "lucide-react";
import { useState } from "react";

export default function Nutrition() {
  const { user } = useAuth();
  const [searchFood, setSearchFood] = useState("");

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user-stats/latest"],
  });

  const dailyGoals = {
    calories: 2200,
    protein: 150, // grams
    carbs: 275,   // grams  
    fat: 73,      // grams
  };

  const todaysIntake = {
    calories: userStats?.caloriesConsumed || 1650,
    protein: 98,
    carbs: 180,
    fat: 45,
  };

  const macroPercentages = {
    protein: Math.round((todaysIntake.protein / dailyGoals.protein) * 100),
    carbs: Math.round((todaysIntake.carbs / dailyGoals.carbs) * 100),
    fat: Math.round((todaysIntake.fat / dailyGoals.fat) * 100),
  };

  const recentMeals = [
    {
      id: 1,
      time: "8:00 AM",
      meal: "Breakfast",
      food: "Oatmeal with berries",
      calories: 320,
      protein: 12,
    },
    {
      id: 2,
      time: "12:30 PM", 
      meal: "Lunch",
      food: "Chicken salad bowl",
      calories: 450,
      protein: 35,
    },
    {
      id: 3,
      time: "3:00 PM",
      meal: "Snack", 
      food: "Greek yogurt",
      calories: 150,
      protein: 15,
    },
    {
      id: 4,
      time: "7:00 PM",
      meal: "Dinner",
      food: "Salmon with quinoa",
      calories: 520,
      protein: 36,
    },
  ];

  const quickAddFoods = [
    { name: "Banana", calories: 105, protein: 1 },
    { name: "Chicken Breast (4oz)", calories: 185, protein: 35 },
    { name: "Brown Rice (1 cup)", calories: 216, protein: 5 },
    { name: "Eggs (2 large)", calories: 140, protein: 12 },
    { name: "Almonds (1oz)", calories: 164, protein: 6 },
    { name: "Avocado (half)", calories: 160, protein: 2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">Nutrition Tracking</h1>
              <p className="text-xl text-muted-foreground">
                Fuel your fitness journey with smart nutrition
              </p>
            </div>
            <Button className="gradient-bg">
              <Plus className="w-4 h-4 mr-2" />
              Add Food
            </Button>
          </div>

          {/* Daily Overview */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {todaysIntake.calories}
                </div>
                <p className="text-sm text-muted-foreground">Calories</p>
                <Progress 
                  value={(todaysIntake.calories / dailyGoals.calories) * 100} 
                  className="mt-2 h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {dailyGoals.calories - todaysIntake.calories} remaining
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-accent mb-2">
                  {todaysIntake.protein}g
                </div>
                <p className="text-sm text-muted-foreground">Protein</p>
                <Progress 
                  value={macroPercentages.protein} 
                  className="mt-2 h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {dailyGoals.protein - todaysIntake.protein}g remaining
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-secondary mb-2">
                  {todaysIntake.carbs}g
                </div>
                <p className="text-sm text-muted-foreground">Carbs</p>
                <Progress 
                  value={macroPercentages.carbs} 
                  className="mt-2 h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {dailyGoals.carbs - todaysIntake.carbs}g remaining
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  {todaysIntake.fat}g
                </div>
                <p className="text-sm text-muted-foreground">Fat</p>
                <Progress 
                  value={macroPercentages.fat} 
                  className="mt-2 h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {dailyGoals.fat - todaysIntake.fat}g remaining
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Food Search & Quick Add */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2 text-primary" />
                Add Food
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Search for food..."
                    value={searchFood}
                    onChange={(e) => setSearchFood(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-3">Quick Add</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {quickAddFoods.map((food, index) => (
                      <Button 
                        key={index}
                        variant="outline" 
                        size="sm"
                        className="text-left justify-start p-3 h-auto"
                      >
                        <div>
                          <div className="font-medium text-sm">{food.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {food.calories} cal, {food.protein}g protein
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Meals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Utensils className="w-5 h-5 mr-2 text-accent" />
                Today's Meals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMeals.map((meal) => (
                  <div key={meal.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        {meal.meal === "Breakfast" && <Coffee className="w-5 h-5 text-primary" />}
                        {meal.meal === "Lunch" && <Utensils className="w-5 h-5 text-primary" />}
                        {meal.meal === "Snack" && <Apple className="w-5 h-5 text-primary" />}
                        {meal.meal === "Dinner" && <Utensils className="w-5 h-5 text-primary" />}
                      </div>
                      <div>
                        <p className="font-medium">{meal.food}</p>
                        <p className="text-sm text-muted-foreground">
                          {meal.meal} • {meal.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{meal.calories} cal</p>
                      <p className="text-sm text-muted-foreground">{meal.protein}g protein</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Nutrition Goals */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-secondary" />
              Nutrition Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary mb-2">
                  {Math.round((todaysIntake.calories / dailyGoals.calories) * 100)}%
                </div>
                <p className="text-sm text-muted-foreground">Calorie Goal</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent mb-2">
                  {macroPercentages.protein}%
                </div>
                <p className="text-sm text-muted-foreground">Protein Goal</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary mb-2">
                  {macroPercentages.carbs}%
                </div>
                <p className="text-sm text-muted-foreground">Carb Goal</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500 mb-2">
                  {macroPercentages.fat}%
                </div>
                <p className="text-sm text-muted-foreground">Fat Goal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}