import { Stethoscope, Brain, Pill, ArrowDown } from "lucide-react";

const HeroSection = () => {
  const scrollToForm = () => {
    document.getElementById('patient-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden gradient-hero py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
            <Brain className="h-4 w-4" />
            <span>AI-Powered Clinical Decision Support</span>
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            UTI-AI: Intelligent Antibiotic{" "}
            <span className="text-primary">Recommendation System</span>
          </h1>
          
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
            UTI-AI is an intelligent system designed for predicting urinary tract infection 
            pathogens and recommending the most effective antibiotics for patients, using AI 
            and clinical knowledge.
          </p>

          <div className="mb-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">Clinical Problem</h3>
              <p className="text-sm text-muted-foreground">
                UTIs are among the most common infections, but inappropriate antibiotic use leads to resistance. 
                Accurate pathogen prediction is crucial for effective treatment.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">AI-Powered Prediction</h3>
              <p className="text-sm text-muted-foreground">
                Our machine learning model analyzes patient demographics, symptoms, and risk factors 
                to predict the most likely causative pathogen with high accuracy.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <Pill className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">Smart Recommendations</h3>
              <p className="text-sm text-muted-foreground">
                Rule-based clinical logic generates personalized antibiotic recommendations 
                considering sensitivity patterns, contraindications, and patient-specific factors.
              </p>
            </div>
          </div>

          <button
            onClick={scrollToForm}
            className="inline-flex items-center gap-2 rounded-full gradient-primary px-8 py-3 font-medium text-primary-foreground shadow-primary transition-all hover:opacity-90"
          >
            Start Patient Assessment
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />
    </section>
  );
};

export default HeroSection;
