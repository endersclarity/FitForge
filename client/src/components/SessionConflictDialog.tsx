import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { AlertTriangle, Clock, Dumbbell, Info, Zap } from "lucide-react";
import { SessionConflictData } from "../hooks/use-workout-session";

interface SessionConflictDialogProps {
  open: boolean;
  conflictData: SessionConflictData;
  onAbandonAndStart: () => void;
  onResumeExisting: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function SessionConflictDialog({
  open,
  conflictData,
  onAbandonAndStart,
  onResumeExisting,
  onCancel,
  loading = false
}: SessionConflictDialogProps) {
  const sessionStartTime = new Date(conflictData.sessionStartTime);
  const now = Date.now();
  const startTime = sessionStartTime.getTime();
  
  // Handle invalid dates or future timestamps
  const timeAgo = isNaN(startTime) || startTime > now ? 0 : Math.round((now - startTime) / 1000 / 60);
  
  const formatTimeAgo = (minutes: number) => {
    if (isNaN(startTime) || startTime > now) return "Recently";
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.round(hours / 24);
    return `${days} days ago`;
  };

  // Smart session management styling based on warning level
  const getWarningIcon = () => {
    switch (conflictData.warningLevel) {
      case 'critical':
        return <Zap className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getWarningText = () => {
    if (conflictData.idleTime && conflictData.idleTime > 240) { // 4+ hours
      return "This session has been inactive for a very long time and can be safely abandoned.";
    } else if (conflictData.idleTime && conflictData.idleTime > 60) { // 1+ hours
      return "This session appears to be stale. Consider abandoning it to start fresh.";
    } else {
      return "You may want to resume this recent workout or start a new one.";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getWarningIcon()}
            Smart Session Detection
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <p>{conflictData.message}</p>
            
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Started: {sessionStartTime.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                Exercises: {conflictData.sessionExerciseCount} planned
              </div>
              {conflictData.idleTime && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  Idle for: {Math.floor(conflictData.idleTime / 60)}h {conflictData.idleTime % 60}m
                </div>
              )}
            </div>
            
            <div className={`p-3 rounded-lg text-sm ${
              conflictData.warningLevel === 'critical' 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : conflictData.warningLevel === 'warning'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              <p>{getWarningText()}</p>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Choose how to handle your previous workout:
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onResumeExisting}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Dumbbell className="h-4 w-4" />
              Resume Previous
            </Button>
            
            <Button
              variant="default"
              onClick={onAbandonAndStart}
              disabled={loading || !conflictData.canAbandon}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Start New (Abandon Old)
            </Button>
          </div>
          
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}