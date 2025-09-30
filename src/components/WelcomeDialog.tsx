import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BookOpen, Target, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const WelcomeDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show dialog on first load or if not seen in the last 24 hours
    const lastSeen = localStorage.getItem("welcomeDialogSeen");
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    if (!lastSeen || now - parseInt(lastSeen) > dayInMs) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("welcomeDialogSeen", Date.now().toString());
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-card to-card/80 border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            Welcome to Charcoal Muse
          </DialogTitle>
          <DialogDescription className="text-base">
            Your AI-powered personal diary for introspective journaling
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Feature cards */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
              <BookOpen className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">AI Writing Prompts</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get inspired with personalized writing suggestions
                </p>
              </div>
              <Badge variant="secondary" className="flex-shrink-0">New</Badge>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
              <Target className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">Mood Detection</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automatically analyze emotions in your entries
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
              <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">Streak Tracking</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Build a consistent journaling habit
                </p>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Getting started</span>
              <span className="font-medium text-primary">Ready!</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleClose} 
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              Start Writing
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="border-primary/30 hover:bg-primary/10"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
