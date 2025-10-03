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
import { CheckCircle, User, Clock, Zap, BarChart2 } from "react-feather";
import { Progress } from "@/components/ui/progress";

type Step = 1 | 2 | 3 | 4;

export const WelcomeDialog = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [displayName, setDisplayName] = useState("");
  const [writingFrequency, setWritingFrequency] = useState("daily");
  const [promptStyle, setPromptStyle] = useState("reflective");
  const [visualStyle, setVisualStyle] = useState("detailed");

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
    if (step < 4) {
      setStep((prev) => (prev + 1) as Step);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("welcomeDialogSeen", Date.now().toString());
    localStorage.setItem("setupComplete", "true");
    localStorage.setItem("userDisplayName", displayName);
    localStorage.setItem("writingFrequency", writingFrequency);
    localStorage.setItem("promptStyle", promptStyle);
    localStorage.setItem("visualStyle", visualStyle);
    setOpen(false);
  };

  const progress = (step / 4) * 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="text-xl">
              {step === 1 && "Let's get to know you"}
              {step === 2 && "How do you like to write?"}
              {step === 3 && "What helps you think?"}
              {step === 4 && "How do you see yourself?"}
            </DialogTitle>
            <span className="text-sm text-muted-foreground">Step {step} of 4</span>
          </div>
          <Progress value={progress} className="h-1" />
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Display Name */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-8 h-8 text-primary" />
                <DialogDescription className="text-base m-0">
                  What should we call you?
                </DialogDescription>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name here"
                  className="bg-input border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Makes everything feel more personal
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Writing Frequency */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-8 h-8 text-primary" />
                <DialogDescription className="text-base m-0">
                  How often will you write?
                </DialogDescription>
              </div>

              <RadioGroup value={writingFrequency} onValueChange={setWritingFrequency}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-input/50 hover:bg-input cursor-pointer">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily" className="flex-1 cursor-pointer">
                      <div className="font-medium">Every day</div>
                      <div className="text-sm text-muted-foreground">Build the habit, one day at a time</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-input/50 hover:bg-input cursor-pointer">
                    <RadioGroupItem value="few-times-week" id="few-times-week" />
                    <Label htmlFor="few-times-week" className="flex-1 cursor-pointer">
                      <div className="font-medium">A few times a week</div>
                      <div className="text-sm text-muted-foreground">Regular check-ins when it feels right</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-input/50 hover:bg-input cursor-pointer">
                    <RadioGroupItem value="flexible" id="flexible" />
                    <Label htmlFor="flexible" className="flex-1 cursor-pointer">
                      <div className="font-medium">When I feel like it</div>
                      <div className="text-sm text-muted-foreground">Zero pressure, pure freedom</div>
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
                <Zap className="w-8 h-8 text-primary" />
                <DialogDescription className="text-base m-0">
                  What gets your mind going?
                </DialogDescription>
              </div>

              <RadioGroup value={promptStyle} onValueChange={setPromptStyle}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-input/50 hover:bg-input cursor-pointer">
                    <RadioGroupItem value="reflective" id="reflective" />
                    <Label htmlFor="reflective" className="flex-1 cursor-pointer">
                      <div className="font-medium">Deep stuff</div>
                      <div className="text-sm text-muted-foreground">Feelings, patterns, inner work</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-input/50 hover:bg-input cursor-pointer">
                    <RadioGroupItem value="creative" id="creative" />
                    <Label htmlFor="creative" className="flex-1 cursor-pointer">
                      <div className="font-medium">Imaginative</div>
                      <div className="text-sm text-muted-foreground">Stories, dreams, what-ifs</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-input/50 hover:bg-input cursor-pointer">
                    <RadioGroupItem value="practical" id="practical" />
                    <Label htmlFor="practical" className="flex-1 cursor-pointer">
                      <div className="font-medium">Action-oriented</div>
                      <div className="text-sm text-muted-foreground">Goals, plans, getting things done</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Step 4: Visual Style */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <BarChart2 className="w-8 h-8 text-primary" />
                <DialogDescription className="text-base m-0">
                  How do you like to see your progress?
                </DialogDescription>
              </div>

              <RadioGroup value={visualStyle} onValueChange={setVisualStyle}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-input/50 hover:bg-input cursor-pointer">
                    <RadioGroupItem value="detailed" id="detailed" />
                    <Label htmlFor="detailed" className="flex-1 cursor-pointer">
                      <div className="font-medium">Show me everything</div>
                      <div className="text-sm text-muted-foreground">Charts, stats, all the data</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-input/50 hover:bg-input cursor-pointer">
                    <RadioGroupItem value="minimal" id="minimal" />
                    <Label htmlFor="minimal" className="flex-1 cursor-pointer">
                      <div className="font-medium">Keep it simple</div>
                      <div className="text-sm text-muted-foreground">Just the highlights, no clutter</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-input/50 hover:bg-input cursor-pointer">
                    <RadioGroupItem value="hidden" id="hidden" />
                    <Label htmlFor="hidden" className="flex-1 cursor-pointer">
                      <div className="font-medium">Focus on writing</div>
                      <div className="text-sm text-muted-foreground">Hide analytics, just journal</div>
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
            
            {step < 4 ? (
              <Button
                onClick={handleNext}
                disabled={step === 1 && !displayName.trim()}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Let's Go
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
