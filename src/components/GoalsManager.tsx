import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserGoals } from "@/hooks/useUserGoals";
import { useToast } from "@/hooks/use-toast";
import { Target, Plus, Check, Trash2 } from "lucide-react";

export const GoalsManager = () => {
  const [newGoal, setNewGoal] = useState("");
  const { goals, addGoal, updateGoal, deleteGoal } = useUserGoals();
  const { toast } = useToast();

  const handleAddGoal = async () => {
    if (!newGoal.trim()) return;

    try {
      await addGoal(newGoal.trim());
      setNewGoal("");
      toast({
        title: "Goal added",
        description: "AI will now track your progress toward this goal.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    try {
      await updateGoal(goalId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
      toast({
        title: "Goal completed! 🎉",
        description: "Great work on achieving your goal.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update goal.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
      toast({
        title: "Goal removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete goal.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Your Goals</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Set 1-3 goals. The AI will track your progress and provide gentle accountability nudges.
      </p>

      <div className="flex gap-2">
        <Input
          placeholder="Add a goal (e.g., 'Run a marathon')"
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
          className="flex-1"
        />
        <Button onClick={handleAddGoal} disabled={!newGoal.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active goals. Add one above to get started.
          </p>
        ) : (
          goals.map((goal) => (
            <div
              key={goal.id}
              className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg"
            >
              <Target className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="flex-1 text-sm">{goal.goal_text}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCompleteGoal(goal.id)}
                className="h-8 w-8 p-0"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteGoal(goal.id)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {goals.length >= 3 && (
        <p className="text-xs text-muted-foreground">
          💡 For best results, focus on 1-3 goals at a time.
        </p>
      )}
    </Card>
  );
};
