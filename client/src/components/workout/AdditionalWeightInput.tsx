import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Weight, Dumbbell, ShirtIcon, Calculator, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdditionalWeightInputProps {
  bodyWeight: number;
  onWeightChange: (totalWeight: number, additionalWeight: number, equipment: string) => void;
  initialAdditionalWeight?: number;
  initialEquipment?: string;
  disabled?: boolean;
}

export function AdditionalWeightInput({
  bodyWeight,
  onWeightChange,
  initialAdditionalWeight = 0,
  initialEquipment = 'dumbbells',
  disabled = false
}: AdditionalWeightInputProps) {
  // Enhanced state initialization with validation
  const [additionalWeight, setAdditionalWeight] = useState(() => {
    // Validate initial additional weight
    if (typeof initialAdditionalWeight !== 'number' || 
        isNaN(initialAdditionalWeight) || 
        !isFinite(initialAdditionalWeight) ||
        initialAdditionalWeight < 0 ||
        initialAdditionalWeight > 500) {
      console.warn('Invalid initialAdditionalWeight, using 0:', initialAdditionalWeight);
      return 0;
    }
    return initialAdditionalWeight;
  });
  
  const [selectedEquipment, setSelectedEquipment] = useState(() => {
    // Validate initial equipment
    const validEquipment = ['dumbbells', 'weighted_vest', 'weight_belt', 'backpack'];
    if (typeof initialEquipment !== 'string' || 
        !validEquipment.includes(initialEquipment)) {
      console.warn('Invalid initialEquipment, using dumbbells:', initialEquipment);
      return 'dumbbells';
    }
    return initialEquipment;
  });
  
  const [componentError, setComponentError] = useState<string | null>(null);

  // Equipment options with icons and common weight increments
  const equipmentOptions = [
    { 
      value: 'dumbbells', 
      label: 'Dumbbells', 
      icon: Dumbbell,
      increments: [2.5, 5, 10, 15, 20, 25],
      description: 'Hand-held weights'
    },
    { 
      value: 'weighted_vest', 
      label: 'Weighted Vest', 
      icon: ShirtIcon,
      increments: [5, 10, 15, 20, 25, 30],
      description: 'Vest with removable weights'
    },
    { 
      value: 'weight_belt', 
      label: 'Weight Belt', 
      icon: Weight,
      increments: [5, 10, 15, 20, 25, 45],
      description: 'Belt with attached weights'
    },
    { 
      value: 'backpack', 
      label: 'Weighted Backpack', 
      icon: ShirtIcon,
      increments: [5, 10, 15, 20, 25, 30],
      description: 'Backpack with weights/books'
    }
  ];

  const currentEquipment = equipmentOptions.find(eq => eq.value === selectedEquipment);
  const totalWeight = bodyWeight + additionalWeight;

  const handleAdditionalWeightChange = (newAdditionalWeight: number) => {
    try {
      // Enhanced validation for input parameters
      if (typeof newAdditionalWeight !== 'number' || isNaN(newAdditionalWeight) || !isFinite(newAdditionalWeight)) {
        console.warn('Invalid additional weight input:', newAdditionalWeight);
        setComponentError('Invalid weight value entered.');
        return;
      }
      
      // Validate bodyWeight prop
      if (typeof bodyWeight !== 'number' || isNaN(bodyWeight) || !isFinite(bodyWeight) || bodyWeight <= 0) {
        console.warn('Invalid bodyWeight prop:', bodyWeight);
        setComponentError('Invalid body weight. Please refresh and try again.');
        return;
      }
      
      const clampedWeight = Math.max(0, Math.min(500, newAdditionalWeight)); // Max 500 lbs additional
      
      // Validate total weight doesn't exceed reasonable limits
      const totalWeight = bodyWeight + clampedWeight;
      if (totalWeight > 1000) {
        console.warn('Total weight exceeds maximum limit:', totalWeight);
        setComponentError('Total weight cannot exceed 1000 lbs.');
        return;
      }
      
      try {
        setAdditionalWeight(clampedWeight);
        
        // Clear any previous errors on successful update
        if (componentError) {
          setComponentError(null);
        }
        
        // Call parent callback with error handling
        if (typeof onWeightChange === 'function') {
          onWeightChange(totalWeight, clampedWeight, selectedEquipment);
        } else {
          console.warn('onWeightChange callback is not a function');
        }
      } catch (stateError) {
        console.error('Error updating additional weight state:', stateError);
        setComponentError('Failed to update weight. Please try again.');
      }
    } catch (error) {
      console.error('Critical error in handleAdditionalWeightChange:', error);
      setComponentError('Unexpected error occurred. Please refresh the page.');
    }
  };

  const handleEquipmentChange = (equipment: string) => {
    try {
      // Validate equipment parameter
      if (typeof equipment !== 'string' || equipment.trim() === '') {
        console.warn('Invalid equipment selection:', equipment);
        setComponentError('Invalid equipment selection.');
        return;
      }
      
      const validEquipment = ['dumbbells', 'weighted_vest', 'weight_belt', 'backpack'];
      if (!validEquipment.includes(equipment)) {
        console.warn('Equipment not in valid options:', equipment);
        setComponentError('Invalid equipment type selected.');
        return;
      }
      
      try {
        setSelectedEquipment(equipment);
        
        // Clear any previous errors
        if (componentError) {
          setComponentError(null);
        }
        
        // Call parent callback with current weight values
        if (typeof onWeightChange === 'function') {
          const totalWeight = bodyWeight + additionalWeight;
          onWeightChange(totalWeight, additionalWeight, equipment);
        } else {
          console.warn('onWeightChange callback is not a function');
        }
      } catch (stateError) {
        console.error('Error updating equipment selection state:', stateError);
        setComponentError('Failed to update equipment. Please try again.');
      }
    } catch (error) {
      console.error('Critical error in handleEquipmentChange:', error);
      setComponentError('Unexpected error occurred. Please refresh the page.');
    }
  };

  const adjustWeight = (increment: number) => {
    try {
      if (typeof increment !== 'number' || isNaN(increment) || !isFinite(increment)) {
        console.warn('Invalid weight increment:', increment);
        return;
      }
      
      const newWeight = additionalWeight + increment;
      handleAdditionalWeightChange(newWeight);
    } catch (error) {
      console.error('Error adjusting weight:', error);
      setComponentError('Failed to adjust weight.');
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Additional Weight
          <Badge variant="outline" className="text-xs">
            Optional
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Component Error Alert */}
        {componentError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {componentError}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setComponentError(null)}
                className="ml-2"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {/* Equipment Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Equipment Type</Label>
          <Select
            value={selectedEquipment}
            onValueChange={handleEquipmentChange}
            disabled={disabled}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select equipment" />
            </SelectTrigger>
            <SelectContent>
              {equipmentOptions.map(equipment => {
                const IconComponent = equipment.icon;
                return (
                  <SelectItem key={equipment.value} value={equipment.value}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{equipment.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {equipment.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Weight Input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Additional Weight (lbs)
          </Label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="number"
                step="0.5"
                min="0"
                max="500"
                value={additionalWeight || ''}
                onChange={(e) => handleAdditionalWeightChange(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="h-10"
                disabled={disabled}
              />
            </div>
            
            {/* Quick increment buttons */}
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustWeight(-2.5)}
                disabled={disabled || additionalWeight <= 0}
                className="w-10 h-10 sm:w-8 sm:h-8 p-0 touch-manipulation"
              >
                <Minus className="w-4 h-4 sm:w-3 sm:h-3" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustWeight(2.5)}
                disabled={disabled}
                className="w-10 h-10 sm:w-8 sm:h-8 p-0 touch-manipulation"
              >
                <Plus className="w-4 h-4 sm:w-3 sm:h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Weight Options - Enhanced Mobile Grid */}
        {currentEquipment && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Common {currentEquipment.label} Weights
            </Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:flex lg:flex-wrap lg:gap-2">
              {currentEquipment.increments.map(weight => (
                <Button
                  key={weight}
                  type="button"
                  variant={additionalWeight === weight ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAdditionalWeightChange(weight)}
                  disabled={disabled}
                  className="text-xs h-10 sm:h-8 touch-manipulation min-w-0 flex-shrink-0"
                >
                  {weight}
                  <span className="hidden sm:inline ml-1">lbs</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Total Weight Calculation - Enhanced Mobile Layout */}
        <div className="border-t pt-3">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm">Total Weight:</span>
              </div>
              <div className="text-left sm:text-right">
                <div className="font-bold text-xl sm:text-lg text-blue-700">
                  {totalWeight.toFixed(1)} lbs
                </div>
                <div className="text-xs text-muted-foreground">
                  {bodyWeight} + {additionalWeight} lbs
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Description */}
        {currentEquipment && additionalWeight > 0 && (
          <div className="text-xs text-muted-foreground p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
            💡 {currentEquipment.label}: {currentEquipment.description}
            {additionalWeight > 0 && ` (+${additionalWeight} lbs)`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AdditionalWeightInput;