import { 
  Brain, 
  ArrowDown, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  Zap, 
  Activity, 
  AlertCircle,
  FileCheck2
} from "lucide-react";

interface HeroSectionProps {
  onSelectPreset?: (presetKey: "pyelonephritis" | "cauti" | "cystitis" | "male_recurrent") => void;
}

const HeroSection = ({ onSelectPreset }: HeroSectionProps) => {
  const scrollToForm = () => {
    document.getElementById('patient-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePresetClick = (presetKey: "pyelonephritis" | "cauti" | "cystitis" | "male_recurrent") => {
    if (onSelectPreset) {
      onSelectPreset(presetKey);
    }
    scrollToForm();
  };

  return (
    <section className="relative overflow-hidden bg-gradient-hero py-14 md:py-20 border-b border-border">
      {/* Decorative ambient lighting mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="container relative mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 backdrop-blur-md shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Calibrated on 315 Inpatient Nephrology Cases • Hospital CDSS</span>
          </div>
          
          {/* Main Title */}
          <h1 className="mb-4 text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
            Precision Antimicrobial Stewardship &{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              UTI Diagnostic AI
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="mx-auto mb-8 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
            Instant machine learning predictions for uropathogen taxonomy, multi-label resistance profiles, and evidence-based renal antibiotic dosing calibrated against real hospital antibiograms.
          </p>

          {/* Metric Badges */}
          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-3xl mx-auto">
            <div className="rounded-xl border border-border bg-card/80 p-3.5 backdrop-blur-md shadow-card">
              <span className="block text-2xl font-black text-foreground">315</span>
              <span className="text-[11px] font-medium text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                <Database className="h-3 w-3 text-emerald-500" /> Real Clinical Cases
              </span>
            </div>

            <div className="rounded-xl border border-border bg-card/80 p-3.5 backdrop-blur-md shadow-card">
              <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">79.1%</span>
              <span className="text-[11px] font-medium text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                <Brain className="h-3 w-3 text-primary" /> Pathogen Accuracy
              </span>
            </div>

            <div className="rounded-xl border border-border bg-card/80 p-3.5 backdrop-blur-md shadow-card">
              <span className="block text-2xl font-black text-secondary">53</span>
              <span className="text-[11px] font-medium text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                <Activity className="h-3 w-3 text-secondary" /> Susceptibility Profiles
              </span>
            </div>

            <div className="rounded-xl border border-border bg-card/80 p-3.5 backdrop-blur-md shadow-card">
              <span className="block text-2xl font-black text-teal-600 dark:text-teal-400">100%</span>
              <span className="text-[11px] font-medium text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                <ShieldCheck className="h-3 w-3 text-teal-500" /> Exclusivity Guarded
              </span>
            </div>
          </div>

          {/* Quick Preset Launch Bar */}
          <div className="rounded-2xl border border-border/80 bg-card/60 p-4 backdrop-blur-xl shadow-card mb-8">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Quick Clinical Presets (Click to Auto-Populate)
              </span>
              <span className="text-[11px] text-muted-foreground">Pre-configured real patient scenarios</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-left">
              <button
                onClick={() => handlePresetClick("pyelonephritis")}
                className="group relative rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 p-3 transition-all text-left"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Preset 1</span>
                  <span className="text-[10px] rounded px-1.5 py-0.5 bg-rose-500/10 text-rose-500 font-semibold">Severe</span>
                </div>
                <h4 className="text-xs font-semibold text-foreground group-hover:text-rose-500 transition-colors">
                  Acute Pyelonephritis (AKI)
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  67y F • Creatinine 2.1 • Cipro resistant
                </p>
              </button>

              <button
                onClick={() => handlePresetClick("cauti")}
                className="group relative rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 p-3 transition-all text-left"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Preset 2</span>
                  <span className="text-[10px] rounded px-1.5 py-0.5 bg-amber-500/10 text-amber-500 font-semibold">Nosocomial</span>
                </div>
                <h4 className="text-xs font-semibold text-foreground group-hover:text-amber-500 transition-colors">
                  Catheter-Associated UTI (CAUTI)
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  72y M • Foley catheter • High pus cells
                </p>
              </button>

              <button
                onClick={() => handlePresetClick("cystitis")}
                className="group relative rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 p-3 transition-all text-left"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Preset 3</span>
                  <span className="text-[10px] rounded px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 font-semibold">Outpatient</span>
                </div>
                <h4 className="text-xs font-semibold text-foreground group-hover:text-emerald-500 transition-colors">
                  Uncomplicated Cystitis
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  24y F • Dysuria • Normal renal profile
                </p>
              </button>

              <button
                onClick={() => handlePresetClick("male_recurrent")}
                className="group relative rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 p-3 transition-all text-left"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Preset 4</span>
                  <span className="text-[10px] rounded px-1.5 py-0.5 bg-blue-500/10 text-blue-500 font-semibold">Recurrent</span>
                </div>
                <h4 className="text-xs font-semibold text-foreground group-hover:text-blue-500 transition-colors">
                  Recurrent UTI in CKD Stage 3
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  61y M • eGFR 42 • Prior Ceftriaxone
                </p>
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={scrollToForm}
            className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 px-8 py-3.5 font-bold text-white shadow-primary transition-all hover:scale-105"
          >
            <span>Proceed to Clinical Assessment</span>
            <ArrowDown className="h-4 w-4 animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
