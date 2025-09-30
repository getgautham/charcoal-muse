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
import { SparklesIcon, BookOpenIcon, FireIcon } from "@heroicons/react/24/outline";
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
            <SparklesIcon className="w-7 h-7 text-primary" />
            Hey, welcome to Muze
          </DialogTitle>
          <DialogDescription className="text-base">
            Your space for real talk with AI that actually gets it
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Three Key Features - Rule of Threes */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
              <BookOpenIcon className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-base">Daily Prompts</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Get unstuck with thoughtful writing starters
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
              <SparklesIcon className="w-6 h-6 text-accent mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-base">AI Insights</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Get real feedback on what you're feeling
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
              <FireIcon className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-base">Build Your Streak</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Keep the momentum going, one entry at a time
                </p>
              </div>
            </div>
          </div>

          {/* Single CTA - Simplified */}
          <Button 
            onClick={handleClose} 
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 h-12 text-base"
          >
            Let's Do This
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
