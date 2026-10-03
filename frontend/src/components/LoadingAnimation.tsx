import { useEffect, useState } from "react";
import { Database, Brain, Pill, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const stages = [
  {
    id: 1,
    label: "Processing patient data...",
    icon: Database,
    duration: 1500,
  },
  {
    id: 2,
    label: "Predicting type of pathogen...",
    icon: Brain,
    duration: 2000,
  },
  {
    id: 3,
    label: "Generating recommended antibiotics...",
    icon: Pill,
    duration: 1500,
  },
];

interface LoadingAnimationProps {
  onComplete: () => void;
}

const LoadingAnimation = ({ onComplete }: LoadingAnimationProps) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = stages.reduce((acc, stage) => acc + stage.duration, 0);
    let elapsed = 0;

    const progressInterval = setInterval(() => {
      elapsed += 50;
      const newProgress = (elapsed / totalDuration) * 100;
      setProgress(Math.min(newProgress, 100));

      // Determine current stage
      let cumulativeDuration = 0;
      for (let i = 0; i < stages.length; i++) {
        cumulativeDuration += stages[i].duration;
        if (elapsed < cumulativeDuration) {
          setCurrentStage(i);
          break;
        }
      }

      if (elapsed >= totalDuration) {
        clearInterval(progressInterval);
        setTimeout(onComplete, 500);
      }
    }, 50);

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-elevated md:p-12">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full gradient-primary shadow-primary">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-foreground border-t-transparent" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                Analyzing Patient Data
              </h3>
              <p className="mt-2 text-muted-foreground">
                Please wait while our AI processes the information
              </p>
            </div>

            <div className="mb-8">
              <Progress value={progress} className="h-3" />
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {Math.round(progress)}% complete
              </p>
            </div>

            <div className="space-y-4">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                const isActive = index === currentStage;
                const isComplete = index < currentStage || progress >= 100;

                return (
                  <div
                    key={stage.id}
                    className={`flex items-center gap-4 rounded-lg border p-4 transition-all duration-300 ${
                      isActive
                        ? "border-primary bg-accent"
                        : isComplete
                        ? "border-success/30 bg-success/5"
                        : "border-border bg-muted/30"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                        isActive
                          ? "gradient-primary text-primary-foreground"
                          : isComplete
                          ? "bg-success text-success-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isComplete && !isActive ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className={`h-5 w-5 ${isActive ? "animate-pulse" : ""}`} />
                      )}
                    </div>
                    <span
                      className={`font-medium ${
                        isActive
                          ? "text-foreground"
                          : isComplete
                          ? "text-success"
                          : "text-muted-foreground"
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoadingAnimation;
