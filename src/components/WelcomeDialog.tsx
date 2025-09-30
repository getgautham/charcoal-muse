import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircleIcon, UserCircleIcon, ClockIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { Progress } from "@/components/ui/progress";

type Step = 1 | 2 | 3;

export const WelcomeDialog = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [displayName, setDisplayName] = useState("");
  const [writingFrequency, setWritingFrequency] = useState("daily");
  const [promptStyle, setPromptStyle] = useState("reflective");

  useEffect(() => {
    const lastSeen = localStorage.getItem("welcomeDialogSeen");
    const setupComplete = localStorage.getItem("setupComplete");
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    if (!setupComplete || (!lastSeen || now - parseInt(lastSeen) > dayInMs)) {
      setOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => (prev + 1) as Step);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("welcomeDialogSeen", Date.now().toString());
    localStorage.setItem("setupComplete", "true");
    localStorage.setItem("userDisplayName", displayName);
    localStorage.setItem("writingFrequency", writingFrequency);
    localStorage.setItem("promptStyle", promptStyle);
    setOpen(false);
  };

  const progress = (step / 3) * 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="text-xl">
              {step === 1 && "Welcome to Muze"}
              {step === 2 && "Your Writing Rhythm"}
              {step === 3 && "Prompt Style"}
            </DialogTitle>
            <span className="text-sm text-muted-foreground">Step {step} of 3</span>
          </div>
          <Progress value={progress} className="h-1" />
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Display Name */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <UserCircleIcon className="w-8 h-8 text-primary" />
                <DialogDescription className="text-base m-0">
                  Let's start with what we should call you
                </DialogDescription>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we address you?"
                  className="bg-input border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Just for personalization – nobody else will see this
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Writing Frequency */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <ClockIcon className="w-8 h-8 text-primary" />
                <DialogDescription className="text-base m-0">
                  How often do you want to write?
                </DialogDescription>
              </div>

              <RadioGroup value={writingFrequency} onValueChange={setWritingFrequency}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-input/50 hover:bg-input cursor-pointer">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily" className="flex-1 cursor-pointer">
                      <div className="font-medium">Daily</div>
                      <div className="text-sm text-muted-foreground">Write something every day</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-input/50 hover:bg-input cursor-pointer">
                    <RadioGroupItem value="few-times-week" id="few-times-week" />
                    <Label htmlFor="few-times-week" className="flex-1 cursor-pointer">
                      <div className="font-medium">Few times a week</div>
                      <div className="text-sm text-muted-foreground">Write when the mood strikes</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-input/50 hover:bg-input cursor-pointer">
                    <RadioGroupItem value="flexible" id="flexible" />
                    <Label htmlFor="flexible" className="flex-1 cursor-pointer">
                      <div className="font-medium">Flexible</div>
                      <div className="text-sm text-muted-foreground">No pressure, just vibes</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Step 3: Prompt Style */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <SparklesIcon className="w-8 h-8 text-primary" />
                <DialogDescription className="text-base m-0">
                  What kind of prompts help you most?
                </DialogDescription>
              </div>

              <RadioGroup value={promptStyle} onValueChange={setPromptStyle}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-input/50 hover:bg-input cursor-pointer">
                    <RadioGroupItem value="reflective" id="reflective" />
                    <Label htmlFor="reflective" className="flex-1 cursor-pointer">
                      <div className="font-medium">Reflective</div>
                      <div className="text-sm text-muted-foreground">Deep thoughts, feelings, patterns</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-input/50 hover:bg-input cursor-pointer">
                    <RadioGroupItem value="creative" id="creative" />
                    <Label htmlFor="creative" className="flex-1 cursor-pointer">
                      <div className="font-medium">Creative</div>
                      <div className="text-sm text-muted-foreground">Stories, imagination, what-ifs</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-input/50 hover:bg-input cursor-pointer">
                    <RadioGroupItem value="practical" id="practical" />
                    <Label htmlFor="practical" className="flex-1 cursor-pointer">
                      <div className="font-medium">Practical</div>
                      <div className="text-sm text-muted-foreground">Goals, plans, day-to-day stuff</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep((prev) => (prev - 1) as Step)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            
            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={step === 1 && !displayName.trim()}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                All Set
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
