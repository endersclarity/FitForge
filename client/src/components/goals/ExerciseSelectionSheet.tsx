// Mobile-Optimized Exercise Selection Sheet Component
// Integration with Agent A's mobile components
// Created: June 6, 2025

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Dumbbell, Target, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ExerciseOption {
  id: string;
  name: string;
  category: string;
  recent_max_weight?: number;
  recent_workout_count?: number;
}

interface ExerciseSelectionSheetProps {
  exercises: ExerciseOption[];
  selectedExerciseId?: string;
  onExerciseSelect: (exerciseId: string) => void;
  isLoading?: boolean;
}

export function ExerciseSelectionSheet({ 
  exercises, 
  selectedExerciseId, 
  onExerciseSelect,
  isLoading = false 
}: ExerciseSelectionSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const isMobile = useIsMobile();

  // Get selected exercise name
  const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId);

  // Filter exercises based on search and category
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [exercises, searchQuery, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['All', ...new Set(exercises.map(ex => ex.category))];
    return cats;
  }, [exercises]);

  const handleExerciseSelect = (exerciseId: string) => {
    onExerciseSelect(exerciseId);
    setIsOpen(false);
    setSearchQuery(''); // Reset search
  };

  const renderExerciseItem = (exercise: ExerciseOption) => (
    <button
      key={exercise.id}
      onClick={() => handleExerciseSelect(exercise.id)}
      className={cn(
        "w-full text-left p-4 rounded-lg border transition-all",
        "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary",
        // Mobile: Larger touch targets
        isMobile ? "min-h-[60px] touch-manipulation" : "min-h-[48px]",
        selectedExerciseId === exercise.id && "bg-primary/10 border-primary"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-medium truncate",
            isMobile ? "text-base" : "text-sm"
          )}>
            {exercise.name}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {exercise.category}
            </Badge>
            {exercise.recent_max_weight && (
              <span className="text-xs text-muted-foreground">
                Last: {exercise.recent_max_weight} lbs
              </span>
            )}
          </div>
        </div>
        
        {selectedExerciseId === exercise.id && (
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
        )}
      </div>
    </button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal touch-manipulation",
            isMobile ? "h-12 text-base" : "h-10 text-sm",
            !selectedExercise && "text-muted-foreground"
          )}
        >
          {selectedExercise ? (
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              <span className="truncate">{selectedExercise.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>Select exercise</span>
            </div>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="bottom" 
        className={cn(
          "h-[85vh] flex flex-col",
          // Mobile: Full height and better spacing
          isMobile && "h-[90vh]"
        )}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Select Exercise
          </SheetTitle>
          <SheetDescription>
            Choose an exercise for your strength goal. Use search or browse by category.
          </SheetDescription>
        </SheetHeader>

        {/* Search and Filters */}
        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 touch-manipulation",
                isMobile ? "h-12 text-base" : "h-10 text-sm"
              )}
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "whitespace-nowrap touch-manipulation",
                  isMobile ? "h-10 px-4" : "h-8 px-3"
                )}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <ScrollArea className="flex-1 pr-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading exercises...</p>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No exercises found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or category filter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExercises.map(renderExerciseItem)}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>
              {filteredExercises.length} of {exercises.length} exercises
            </span>
            {selectedExercise && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {selectedExercise.name}
              </span>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}