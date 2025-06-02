/**
 * GoalForm Component Tests
 * Tests for goal creation form with validation and user interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalForm } from '../GoalForm';
interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
  muscle_groups: string[];
  instructions: string;
}

// Mock the date picker to avoid calendar complexities in tests
vi.mock('react-day-picker', () => ({
  DayPicker: ({ onSelect, selected }: any) => (
    <div data-testid="date-picker" onClick={() => onSelect?.(new Date('2024-06-01'))}>
      {selected ? selected.toISOString() : 'Select date'}
    </div>
  )
}));

describe('GoalForm', () => {
  const mockOnGoalCreated = vi.fn();
  const mockOnCancel = vi.fn();
  
  const mockExercises: Exercise[] = [
    {
      id: 'bench-press',
      name: 'Bench Press',
      category: 'Chest',
      equipment: 'Barbell',
      muscle_groups: ['chest', 'shoulders', 'triceps'],
      instructions: 'Press the barbell from chest to arm extension'
    },
    {
      id: 'squat',
      name: 'Squat',
      category: 'Legs',
      equipment: 'Barbell',
      muscle_groups: ['quadriceps', 'glutes'],
      instructions: 'Descend by bending knees and hips'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderGoalForm = (props = {}) => {
    const defaultProps = {
      onGoalCreated: mockOnGoalCreated,
      onCancel: mockOnCancel,
      exercises: mockExercises,
      ...props
    };

    return render(<GoalForm {...defaultProps} />);
  };

  describe('Form Rendering', () => {
    it('should render all goal type options', () => {
      renderGoalForm();

      expect(screen.getByLabelText(/weight loss/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/strength gain/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/body composition/i)).toBeInTheDocument();
    });

    it('should render common fields for all goal types', () => {
      renderGoalForm();

      expect(screen.getByLabelText(/goal title/i)).toBeInTheDocument();
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create goal/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should start with no goal type selected', () => {
      renderGoalForm();

      const weightLossRadio = screen.getByLabelText(/weight loss/i);
      const strengthRadio = screen.getByLabelText(/strength gain/i);
      const bodyCompRadio = screen.getByLabelText(/body composition/i);

      expect(weightLossRadio).not.toBeChecked();
      expect(strengthRadio).not.toBeChecked();
      expect(bodyCompRadio).not.toBeChecked();
    });
  });

  describe('Weight Loss Goal Form', () => {
    it('should show weight loss specific fields when selected', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByLabelText(/weight loss/i));

      expect(screen.getByLabelText(/target weight/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/exercise/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/target body fat/i)).not.toBeInTheDocument();
    });

    it('should validate required weight loss fields', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByLabelText(/weight loss/i));
      await user.type(screen.getByLabelText(/goal title/i), 'Lose weight for summer');
      await user.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(screen.getByText(/target weight is required/i)).toBeInTheDocument();
      });
    });

    it('should submit valid weight loss goal', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByLabelText(/weight loss/i));
      await user.type(screen.getByLabelText(/goal title/i), 'Lose 10kg for summer');
      await user.type(screen.getByLabelText(/target weight/i), '70');
      await user.click(screen.getByTestId('date-picker'));
      await user.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(mockOnGoalCreated).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Lose 10kg for summer',
            goal_type: 'weight_loss',
            target_weight: 70,
            deadline: expect.any(Date)
          })
        );
      });
    });

    it('should validate weight is a positive number', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByLabelText(/weight loss/i));
      await user.type(screen.getByLabelText(/target weight/i), '-5');
      await user.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(screen.getByText(/must be a positive number/i)).toBeInTheDocument();
      });
    });
  });

  describe('Strength Gain Goal Form', () => {
    it('should show strength gain specific fields when selected', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByLabelText(/strength gain/i));

      expect(screen.getByLabelText(/exercise/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/target weight/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/target reps/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/target body fat/i)).not.toBeInTheDocument();
    });

    it('should populate exercise dropdown with provided exercises', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByLabelText(/strength gain/i));
      await user.click(screen.getByLabelText(/exercise/i));

      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('Squat')).toBeInTheDocument();
    });

    it('should validate all required strength gain fields', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByLabelText(/strength gain/i));
      await user.type(screen.getByLabelText(/goal title/i), 'Bench 100kg');
      await user.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(screen.getByText(/exercise is required/i)).toBeInTheDocument();
        expect(screen.getByText(/target weight is required/i)).toBeInTheDocument();
        expect(screen.getByText(/target reps is required/i)).toBeInTheDocument();
      });
    });

    it('should submit valid strength gain goal', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByLabelText(/strength gain/i));
      await user.type(screen.getByLabelText(/goal title/i), 'Bench press 100kg');
      await user.click(screen.getByLabelText(/exercise/i));
      await user.click(screen.getByText('Bench Press'));
      await user.type(screen.getByLabelText(/target weight/i), '100');
      await user.type(screen.getByLabelText(/target reps/i), '5');
      await user.click(screen.getByTestId('date-picker'));
      await user.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(mockOnGoalCreated).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Bench press 100kg',
            goal_type: 'strength_gain',
            exercise_id: 'bench-press',
            target_exercise_weight: 100,
            target_reps: 5,
            deadline: expect.any(Date)
          })
        );
      });
    });

    it('should validate reps is a positive integer', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByLabelText(/strength gain/i));
      await user.type(screen.getByLabelText(/target reps/i), '2.5');
      await user.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(screen.getByText(/must be a whole number/i)).toBeInTheDocument();
      });
    });
  });

  describe('Body Composition Goal Form', () => {
    it('should show body composition specific fields when selected', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByLabelText(/body composition/i));

      expect(screen.getByLabelText(/target body fat percentage/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/exercise/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/target weight.*kg/i)).not.toBeInTheDocument();
    });

    it('should validate body fat percentage range', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByLabelText(/body composition/i));
      await user.type(screen.getByLabelText(/target body fat percentage/i), '150');
      await user.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(screen.getByText(/must be between/i)).toBeInTheDocument();
      });
    });

    it('should submit valid body composition goal', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByLabelText(/body composition/i));
      await user.type(screen.getByLabelText(/goal title/i), 'Get to 15% body fat');
      await user.type(screen.getByLabelText(/target body fat percentage/i), '15');
      await user.click(screen.getByTestId('date-picker'));
      await user.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(mockOnGoalCreated).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Get to 15% body fat',
            goal_type: 'body_composition',
            target_body_fat: 15,
            deadline: expect.any(Date)
          })
        );
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate goal title is required', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByLabelText(/weight loss/i));
      await user.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
    });

    it('should validate goal title length', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByLabelText(/weight loss/i));
      await user.type(screen.getByLabelText(/goal title/i), 'A'.repeat(256)); // Too long
      await user.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(screen.getByText(/title must be/i)).toBeInTheDocument();
      });
    });

    it('should validate deadline is required', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByLabelText(/weight loss/i));
      await user.type(screen.getByLabelText(/goal title/i), 'Test goal');
      await user.type(screen.getByLabelText(/target weight/i), '70');
      await user.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(screen.getByText(/deadline is required/i)).toBeInTheDocument();
      });
    });

    it('should validate deadline is in the future', async () => {
      const user = userEvent.setup();
      
      // Mock date picker to return past date
      vi.mocked(require('react-day-picker').DayPicker).mockImplementation(
        ({ onSelect }: any) => (
          <div 
            data-testid="date-picker" 
            onClick={() => onSelect?.(new Date('2020-01-01'))}
          >
            Past date
          </div>
        )
      );

      renderGoalForm();

      await user.click(screen.getByLabelText(/weight loss/i));
      await user.type(screen.getByLabelText(/goal title/i), 'Test goal');
      await user.type(screen.getByLabelText(/target weight/i), '70');
      await user.click(screen.getByTestId('date-picker'));
      await user.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(screen.getByText(/must be in the future/i)).toBeInTheDocument();
      });
    });

    it('should require goal type selection', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.type(screen.getByLabelText(/goal title/i), 'Test goal');
      await user.click(screen.getByTestId('date-picker'));
      await user.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(screen.getByText(/goal type is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Interactions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnCancel).toHaveBeenCalledOnce();
    });

    it('should reset form when goal type changes', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      // Fill weight loss form
      await user.click(screen.getByLabelText(/weight loss/i));
      await user.type(screen.getByLabelText(/target weight/i), '70');

      // Switch to strength gain
      await user.click(screen.getByLabelText(/strength gain/i));

      // Weight field should not be visible anymore
      expect(screen.queryByDisplayValue('70')).not.toBeInTheDocument();
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Mock delayed onGoalCreated
      const delayedOnGoalCreated = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      renderGoalForm({ onGoalCreated: delayedOnGoalCreated });

      await user.click(screen.getByLabelText(/weight loss/i));
      await user.type(screen.getByLabelText(/goal title/i), 'Test goal');
      await user.type(screen.getByLabelText(/target weight/i), '70');
      await user.click(screen.getByTestId('date-picker'));
      
      const submitButton = screen.getByRole('button', { name: /create goal/i });
      await user.click(submitButton);

      // Should show loading state
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/creating/i)).toBeInTheDocument();
    });

    it('should handle exercise search/filter', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByLabelText(/strength gain/i));
      
      const exerciseSelect = screen.getByLabelText(/exercise/i);
      await user.click(exerciseSelect);
      await user.type(exerciseSelect, 'bench');

      // Should filter exercises based on search
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.queryByText('Squat')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderGoalForm();

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/goal title/i)).toHaveAccessibleName();
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create goal/i })).toBeEnabled();
    });

    it('should associate error messages with form fields', async () => {
      const user = userEvent.setup();
      renderGoalForm();

      await user.click(screen.getByLabelText(/weight loss/i));
      await user.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/goal title/i);
        const errorMessage = screen.getByText(/title is required/i);
        
        expect(titleInput).toHaveAttribute('aria-describedby');
        expect(errorMessage).toHaveAttribute('id');
      });
    });

    it('should support keyboard navigation', async () => {
      renderGoalForm();

      const titleInput = screen.getByLabelText(/goal title/i);
      titleInput.focus();
      
      expect(titleInput).toHaveFocus();

      // Tab should move to goal type radio buttons
      fireEvent.keyDown(titleInput, { key: 'Tab' });
      expect(screen.getByLabelText(/weight loss/i)).toHaveFocus();
    });
  });
});