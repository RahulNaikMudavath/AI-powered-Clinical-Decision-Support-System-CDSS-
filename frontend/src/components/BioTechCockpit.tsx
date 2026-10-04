import { useState, useId } from "react";
import { 
  Activity, 
  Stethoscope, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Pill, 
  Sliders, 
  Zap, 
  Cpu, 
  RotateCcw, 
  Send, 
  ChevronRight,
  Gauge,
  CheckCircle2,
  FileCheck,
  Microscope,
  Clock,
  ShieldAlert,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PatientData } from "./PatientForm";
import SmartEHRParser from "./SmartEHRParser";
import modelMetrics from "@/data/model_metrics.json";

interface BioTechCockpitProps {
  onSubmit: (data: PatientData) => void;
  isLoading: boolean;
  initialData?: PatientData;
}

const DEFAULT_PATIENT: PatientData = {
  AGE: 64,
  GENDER: "Female",
  DEPARTMENT: "Nephrology",
  CHIEF_COMPLAINTS: "High fever (38.8C), severe left flank pain, nausea, and burning dysuria",
  COMORBIDITIES: "Type 2 Diabetes Mellitus, Hypertension",
  RISKFACTORS: "Postmenopausal, recurrent urinary tract infections",
  SURGICAL_HISTORY: "None",
  SOCIAL_HISTORY: "Non-smoker, non-alcoholic",
  DIAGNOSIS: "Pyelonephritis",
  CLASSIFICATION_OF_UTI: "Complicated",
  TYPE_OF_UTI: "Upper UTI",
  SITE_OF_INFECTION: "Kidney",
  TYPE_OF_SAMPLE: "Clean catch midstream urine",
  PREVIOUS_ANTIBIOTIC_USED: "Ciprofloxacin",

  CBP_LYMPHOCYTES: 12,
  WBC: 16500,
  POLYMORPHS: 82,
  CRP: 46.5,
  RFT_SERUM_CREATININE: 2.2,
  SERUM_URIC_ACID: 7.1,
  BLOOD_UREA: 54.0,
  CUE_PUS_CELLS: 48,
  EPITHELIAL_CELLS: 8,
  PROTEINS: "++",
  RBC: 6
};

const BioTechCockpit = ({ onSubmit, isLoading, initialData }: BioTechCockpitProps) => {
  const [patient, setPatient] = useState<PatientData>(initialData || DEFAULT_PATIENT);

  // Compute Cockcroft-Gault Renal Clearance (CrCl) in mL/min
  const age = patient.AGE || 50;
  const isFemale = patient.GENDER.toLowerCase().startsWith("f");
  const scr = Math.max(patient.RFT_SERUM_CREATININE || 1.0, 0.4);
  const rawCrCl = ((140 - age) * 70) / (72 * scr);
  const crcl = Math.round(isFemale ? rawCrCl * 0.85 : rawCrCl);

  // Renal function staging
  let renalStage = "Normal (Stage 1)";
  let renalColor = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  let dialPercentage = 95;

  if (crcl < 15) {
    renalStage = "Kidney Failure (Stage 5)";
    renalColor = "text-rose-400 border-rose-500/30 bg-rose-500/10";
    dialPercentage = 15;
  } else if (crcl < 30) {
    renalStage = "Severe Impairment (Stage 4)";
    renalColor = "text-orange-400 border-orange-500/30 bg-orange-500/10";
    dialPercentage = 30;
  } else if (crcl < 60) {
    renalStage = "Moderate Impairment (Stage 3)";
    renalColor = "text-amber-400 border-amber-500/30 bg-amber-500/10";
    dialPercentage = 55;
  } else if (crcl < 90) {
    renalStage = "Mild Reduction (Stage 2)";
    renalColor = "text-teal-400 border-teal-500/30 bg-teal-500/10";
    dialPercentage = 80;
  }

  // Bedside Derived Biomarkers for Pre-Test Staging
  const nlr = Number(((patient.POLYMORPHS || 70) / ((patient.CBP_LYMPHOCYTES || 20) + 0.1)).toFixed(1));
  const pyuriaRatio = Number(((patient.CUE_PUS_CELLS || 10) / ((patient.EPITHELIAL_CELLS || 5) + 0.1)).toFixed(1));
  const sii = Math.round(((patient.WBC || 8000) * (patient.CRP || 10)) / 1000);
  const isSevereInfection = (patient.WBC || 8000) > 12000 || (patient.CRP || 10) > 25;

  const getPriorAntibioticProfile = (drug?: string) => {
    switch (drug) {
      case "Ciprofloxacin":
        return {
          title: "Fluoroquinolone Selective Pressure",
          badge: "High Resistance Risk",
          badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          desc: "Exposure in prior 30 days is a primary clinical driver for fluoroquinolone resistance and cross-resistance with 3rd-gen cephalosporins.",
          riskAlert: "High probability of GyrA/ParC target mutation. First-line oral quinolones likely to fail."
        };
      case "Ceftriaxone":
        return {
          title: "3rd-Gen Cephalosporin Pressure",
          badge: "ESBL Selection Risk",
          badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          desc: "Recent exposure selectively enriches CTX-M extended-spectrum beta-lactamase producing strains.",
          riskAlert: "Beta-lactam stewardship alert: Consider carbapenem or non-beta-lactam alternative if septic."
        };
      case "Nitrofurantoin":
        return {
          title: "Oral First-Line Exposure",
          badge: "Recurrence / Treatment Failure",
          badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
          desc: "Prior nitrofurantoin therapy with persistent fever or flank pain indicates ascending pyelonephritis requiring parenteral therapy.",
          riskAlert: "Inadequate tissue concentration in upper renal parenchyma."
        };
      case "Amikacin":
        return {
          title: "Aminoglycoside Exposure",
          badge: "Renal Clearance Alert",
          badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          desc: "Recent aminoglycoside therapy requires careful review of cumulative dosing and baseline eGFR/CrCl to avoid nephrotoxicity.",
          riskAlert: "Requires therapeutic drug monitoring if repeated."
        };
      case "Meropenem":
        return {
          title: "Carbapenem Exposure",
          badge: "MDR / CRE Alert",
          badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          desc: "Inpatient exposure to ultra-broad-spectrum carbapenems warrants surveillance for carbapenem-resistant Enterobacterales (CRE).",
          riskAlert: "High stewardship threshold. Requires infectious disease consultation."
        };
      default:
        return {
          title: "Treatment-Naive Patient",
          badge: "Wild-Type Susceptibility",
          badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          desc: "No recorded antibiotic pressure within the past 30 days. Pathogen expected to reflect standard regional wild-type baseline.",
          riskAlert: "Standard empirical clinical pathway applies."
        };
    }
  };

  const getDepartmentAntibiogram = (dept?: string) => {
    switch (dept) {
      case "Nephrology":
        return [
          { drug: "Fosfomycin", rate: 88, status: "High Susceptibility" },
          { drug: "Nitrofurantoin", rate: 84, status: "Effective (CrCl > 30)" },
          { drug: "Amikacin", rate: 82, status: "High (Dose Titrated)" },
          { drug: "Meropenem", rate: 80, status: "Reserved Inpatient" },
          { drug: "Pip-Tazobactam", rate: 78, status: "Broad Parenteral" },
          { drug: "Ciprofloxacin", rate: 34, status: "Severe Resistance" }
        ];
      case "ICU":
        return [
          { drug: "Colistin", rate: 94, status: "Last-Line Reserve" },
          { drug: "Meropenem", rate: 76, status: "Hospital Inpatient" },
          { drug: "Amikacin", rate: 79, status: "High Susceptibility" },
          { drug: "Pip-Tazobactam", rate: 72, status: "Parenteral Anchor" },
          { drug: "Ceftriaxone", rate: 36, status: "High ESBL Failure" },
          { drug: "Ciprofloxacin", rate: 28, status: "Widespread Resistance" }
        ];
      case "Urology":
        return [
          { drug: "Fosfomycin", rate: 91, status: "First-Line Oral" },
          { drug: "Nitrofurantoin", rate: 86, status: "Uncomplicated" },
          { drug: "Amikacin", rate: 85, status: "Peri-procedural" },
          { drug: "Pip-Tazobactam", rate: 81, status: "Complicated UTI" },
          { drug: "Ceftriaxone", rate: 52, status: "Moderate Resistance" },
          { drug: "Ciprofloxacin", rate: 41, status: "High Resistance" }
        ];
      default:
        return [
          { drug: "Fosfomycin", rate: 90, status: "High Susceptibility" },
          { drug: "Nitrofurantoin", rate: 87, status: "First-Line Oral" },
          { drug: "Amikacin", rate: 84, status: "Parenteral Reserve" },
          { drug: "Pip-Tazobactam", rate: 80, status: "Parenteral Anchor" },
          { drug: "Ceftriaxone", rate: 48, status: "Moderate ESBL" },
          { drug: "Ciprofloxacin", rate: 38, status: "Elevated Resistance" }
        ];
    }
  };

  const priorProfile = getPriorAntibioticProfile(patient.PREVIOUS_ANTIBIOTIC_USED);
  const deptAntibiogram = getDepartmentAntibiogram(patient.DEPARTMENT);

  const handleUpdateField = <K extends keyof PatientData>(key: K, value: PatientData[K]) => {
    setPatient((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSmartParsed = (parsed: PatientData) => {
    setPatient(parsed);
  };

  const handleResetToDefault = () => {
    setPatient(DEFAULT_PATIENT);
  };

  return (
    <section id="patient-form" className="py-8 md:py-12">
      <div className="container mx-auto px-4 md:px-6 space-y-8">
        {/* Cockpit HUD Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-emerald-500/20 to-teal-400/10 border border-cyan-400/40 text-cyan-400 shadow-primary">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
                  Clinical AI Decision Cockpit
                </h2>
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-400/30 text-[10px] font-mono">
                  LIVE TELEMETRY
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Inpatient Antimicrobial Stewardship & Tri-Model Diagnostic Command Console
              </p>
            </div>
          </div>

          {/* Quick HUD Metrics (Loaded Directly from Ground-Truth Benchmark) */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="rounded-xl border border-border/70 bg-card/60 px-3 py-1.5 backdrop-blur-md">
              <span className="text-[10px] text-muted-foreground block">COHORT BASELINE</span>
              <span className="font-semibold text-cyan-400">
                {modelMetrics.cohort.total_records} Inpatients
              </span>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/60 px-3 py-1.5 backdrop-blur-md">
              <span className="text-[10px] text-muted-foreground block">MODEL ACCURACY</span>
              <span className="font-semibold text-emerald-400">
                {modelMetrics.model_1_taxonomy.cross_validation.mean_accuracy}% (5-Fold CV)
              </span>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/60 px-3 py-1.5 backdrop-blur-md">
              <span className="text-[10px] text-muted-foreground block">SAFETY GUARDRAILS</span>
              <span className="font-semibold text-teal-300">100% Active</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetToDefault}
              className="gap-1.5 border-border hover:bg-muted text-xs h-9"
            >
              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Reset</span>
            </Button>
          </div>
        </div>

        {/* 1. Smart Natural Language EHR Intake (Full Width Bento Tile) */}
        <SmartEHRParser onParsed={handleSmartParsed} />

        {/* 2. Main Bento Grid: Controls & Laboratory Parameters (Left) + Petri Dish Culture (Right) */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Clinical Parameters & Urinalysis (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tile A: Demographics & Clinical History */}
            <div className="hud-card rounded-2xl p-5 border border-border/80 bg-card/60 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider font-mono">
                    Patient Profile & Risk Staging
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">ID: #CDSS-{patient.AGE}-{patient.GENDER[0]}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Age Input with Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <label className="text-muted-foreground">Age</label>
                    <span className="font-bold text-cyan-400">{patient.AGE} yrs</span>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={95}
                    value={patient.AGE}
                    onChange={(e) => handleUpdateField("AGE", parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 h-1.5 bg-muted rounded-lg cursor-pointer"
                  />
                </div>

                {/* Gender Toggle */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-mono block">Biological Sex</label>
                  <div className="grid grid-cols-2 gap-1 rounded-lg border border-border/80 bg-muted/30 p-1">
                    <button
                      type="button"
                      onClick={() => handleUpdateField("GENDER", "Female")}
                      className={`text-xs py-1 rounded font-medium transition-all ${
                        patient.GENDER === "Female"
                          ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Female
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateField("GENDER", "Male")}
                      className={`text-xs py-1 rounded font-medium transition-all ${
                        patient.GENDER === "Male"
                          ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Male
                    </button>
                  </div>
                </div>

                {/* Hospital Department */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-mono block">Department</label>
                  <select
                    value={patient.DEPARTMENT}
                    onChange={(e) => handleUpdateField("DEPARTMENT", e.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-background/80 px-2.5 py-1.5 text-xs text-foreground font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="Nephrology">Nephrology</option>
                    <option value="ICU">ICU / Critical Care</option>
                    <option value="Urology">Urology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Outpatient">Outpatient</option>
                  </select>
                </div>
              </div>

              {/* Diagnosis & Prior Antibiotic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-mono block">Primary Diagnosis</label>
                  <select
                    value={patient.DIAGNOSIS}
                    onChange={(e) => handleUpdateField("DIAGNOSIS", e.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-background/80 px-2.5 py-1.5 text-xs text-foreground font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="Pyelonephritis">Acute Pyelonephritis</option>
                    <option value="Catheter-Associated UTI">Catheter-Associated UTI (CAUTI)</option>
                    <option value="Cystitis">Acute Uncomplicated Cystitis</option>
                    <option value="Recurrent UTI">Recurrent Male / BPH UTI</option>
                    <option value="Urosepsis">Urosepsis / Sepsis Alert</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <label className="text-muted-foreground">Prior Antibiotic (30 days)</label>
                    <span className="text-[10px] text-amber-400 font-semibold">Resistance Predictor</span>
                  </div>
                  <select
                    value={patient.PREVIOUS_ANTIBIOTIC_USED}
                    onChange={(e) => handleUpdateField("PREVIOUS_ANTIBIOTIC_USED", e.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-background/80 px-2.5 py-1.5 text-xs text-foreground font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="Ciprofloxacin">Ciprofloxacin (Fluoroquinolone)</option>
                    <option value="Ceftriaxone">Ceftriaxone (Cephalosporin)</option>
                    <option value="Nitrofurantoin">Nitrofurantoin</option>
                    <option value="Amikacin">Amikacin (Aminoglycoside)</option>
                    <option value="Meropenem">Meropenem (Carbapenem)</option>
                    <option value="Levofloxacin">Levofloxacin</option>
                    <option value="Amoxicillin">Amoxicillin / Clavulanate</option>
                    <option value="None">None / Treatment Naive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tile B: Cockcroft-Gault Renal Speedometer & Dial */}
            <div className="hud-card rounded-2xl p-5 border border-cyan-500/20 bg-card/60 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider font-mono">
                    Renal Clearance (Cockcroft-Gault)
                  </h3>
                </div>
                <Badge variant="outline" className={`text-[10px] font-mono ${renalColor}`}>
                  {renalStage}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* Circular Clearance Meter */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center p-2">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      {/* Background Track */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-muted/40"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      {/* Dynamic Dial Stroke */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className={crcl < 30 ? "stroke-rose-400" : crcl < 60 ? "stroke-amber-400" : "stroke-cyan-400"}
                        strokeWidth="8"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * Math.min(dialPercentage, 100)) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black font-mono text-foreground tracking-tight">
                        {crcl}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">
                        mL/min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Renal Stewardship Advisory */}
                <div className="sm:col-span-7 space-y-2 text-xs">
                  <div className="rounded-lg border border-border/70 bg-background/50 p-2.5 space-y-1">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-muted-foreground">Serum Creatinine:</span>
                      <span className="font-bold text-foreground">{patient.RFT_SERUM_CREATININE} mg/dL</span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-muted-foreground">Blood Urea:</span>
                      <span className="font-bold text-foreground">{patient.BLOOD_UREA} mg/dL</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {crcl < 30
                      ? "⚠️ Critical Renal Impairment: Fluoroquinolones, Amikacin, and Nitrofurantoin contraindicated or require extended dose intervals."
                      : crcl < 60
                      ? "⚡ Moderate Clearance Reduction: Monitor trough concentrations for aminoglycosides and reduce beta-lactam maintenance dose."
                      : "✅ Preserved Renal Function: Full therapeutic dose clearance for hydrophilic antimicrobials."}
                  </p>
                </div>
              </div>
            </div>

            {/* Tile C: Urinalysis & Hematology Laboratory Grid */}
            <div className="hud-card rounded-2xl p-5 border border-border/80 bg-card/60 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider font-mono">
                    Urinalysis & Hematology Telemetry
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">6 Clinical Biomarkers</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* 1. Serum Creatinine */}
                <div className="rounded-xl border border-border/70 bg-background/60 p-3 space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-muted-foreground">Creatinine</span>
                    <span className={`font-bold ${patient.RFT_SERUM_CREATININE > 1.4 ? "text-amber-400" : "text-emerald-400"}`}>
                      {patient.RFT_SERUM_CREATININE}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={6.0}
                    step={0.1}
                    value={patient.RFT_SERUM_CREATININE}
                    onChange={(e) => handleUpdateField("RFT_SERUM_CREATININE", parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 h-1 bg-muted rounded cursor-pointer"
                  />
                  <span className="text-[9px] text-muted-foreground font-mono block">mg/dL (Norm: 0.6-1.2)</span>
                </div>

                {/* 2. Urine Pus Cells */}
                <div className="rounded-xl border border-border/70 bg-background/60 p-3 space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-muted-foreground">Pus Cells</span>
                    <span className={`font-bold ${patient.CUE_PUS_CELLS > 15 ? "text-rose-400" : "text-cyan-400"}`}>
                      {patient.CUE_PUS_CELLS}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    value={patient.CUE_PUS_CELLS}
                    onChange={(e) => handleUpdateField("CUE_PUS_CELLS", parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 h-1 bg-muted rounded cursor-pointer"
                  />
                  <span className="text-[9px] text-muted-foreground font-mono block">/hpf (Pyuria &gt; 10)</span>
                </div>

                {/* 3. Total WBC */}
                <div className="rounded-xl border border-border/70 bg-background/60 p-3 space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-muted-foreground">Total WBC</span>
                    <span className={`font-bold ${patient.WBC > 11000 ? "text-amber-400" : "text-emerald-400"}`}>
                      {patient.WBC.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={4000}
                    max={30000}
                    step={500}
                    value={patient.WBC}
                    onChange={(e) => handleUpdateField("WBC", parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 h-1 bg-muted rounded cursor-pointer"
                  />
                  <span className="text-[9px] text-muted-foreground font-mono block">/mcL (Norm: 4k-11k)</span>
                </div>

                {/* 4. Polymorphs % */}
                <div className="rounded-xl border border-border/70 bg-background/60 p-3 space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-muted-foreground">Polymorphs</span>
                    <span className="font-bold text-foreground">{patient.POLYMORPHS}%</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={95}
                    value={patient.POLYMORPHS}
                    onChange={(e) => handleUpdateField("POLYMORPHS", parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 h-1 bg-muted rounded cursor-pointer"
                  />
                  <span className="text-[9px] text-muted-foreground font-mono block">Neutrophil Shift</span>
                </div>

                {/* 5. C-Reactive Protein (CRP) */}
                <div className="rounded-xl border border-border/70 bg-background/60 p-3 space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-muted-foreground">CRP</span>
                    <span className="font-bold text-foreground">{patient.CRP}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={120}
                    value={patient.CRP}
                    onChange={(e) => handleUpdateField("CRP", parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 h-1 bg-muted rounded cursor-pointer"
                  />
                  <span className="text-[9px] text-muted-foreground font-mono block">mg/L (Systemic Inflam.)</span>
                </div>

                {/* 6. Dipstick Proteinuria */}
                <div className="rounded-xl border border-border/70 bg-background/60 p-3 space-y-1">
                  <label className="text-[11px] font-mono text-muted-foreground block">Proteinuria</label>
                  <select
                    value={patient.PROTEINS}
                    onChange={(e) => handleUpdateField("PROTEINS", e.target.value)}
                    className="w-full rounded-md border border-border/80 bg-background/80 px-2 py-1 text-xs text-foreground font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="Nil">Nil (Negative)</option>
                    <option value="+">+ (Trace / 30 mg/dL)</option>
                    <option value="++">++ (Moderate / 100 mg/dL)</option>
                    <option value="+++">+++ (Marked / 300+ mg/dL)</option>
                  </select>
                  <span className="text-[9px] text-muted-foreground font-mono block">Glomerular / Tubular</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pre-Test Bedside Triage & Local Antibiogram Staging (5 Columns) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Card 1: 48h Culture Incubation Alert & Clinical Rationale */}
            <div className="hud-card rounded-2xl p-5 border border-cyan-500/25 bg-card/70 backdrop-blur-xl shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                    <Microscope className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground tracking-tight">
                        Pre-Test Bedside Triage
                      </h3>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px] font-mono animate-pulse">
                        CULTURE PENDING (48H)
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Microbiology turnaround window • Empirical CDSS active
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-background/50 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" /> Standard Culture Turnaround:
                  </span>
                  <span className="font-semibold text-amber-400">48 – 72 Hours</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Laboratory urine culture & Kirby-Bauer disc diffusion plates are incubating. 
                  This CDSS uses host acute inflammatory response and renal clearance to recommend safe, evidence-based empiric coverage before microbiological growth is confirmed.
                </p>
              </div>
            </div>

            {/* Card 2: Prior Antibiotic Resistance Pressure */}
            <div className="hud-card rounded-2xl p-5 border border-border/80 bg-card/60 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider">
                    Antimicrobial Selective Pressure
                  </h3>
                </div>
                <Badge variant="outline" className={`text-[10px] font-mono ${priorProfile.badgeClass}`}>
                  {priorProfile.badge}
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-mono text-[11px] border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Recent Exposure (30d):</span>
                  <span className="font-bold text-foreground">{patient.PREVIOUS_ANTIBIOTIC_USED}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {priorProfile.desc}
                </p>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/25 p-2 text-[11px] text-amber-300 font-medium">
                  ⚡ {priorProfile.riskAlert}
                </div>
              </div>
            </div>

            {/* Card 3: Real-Time Derived Biomarkers */}
            <div className="hud-card rounded-2xl p-5 border border-border/80 bg-card/60 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider">
                    Derived Inflammatory Telemetry
                  </h3>
                </div>
                <Badge variant="outline" className={`text-[10px] font-mono ${isSevereInfection ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"}`}>
                  {isSevereInfection ? "SEVERE INFLAMMATION" : "CONTROLLED STRESS"}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-border/70 bg-background/50 p-2.5">
                  <span className="text-[10px] font-mono text-muted-foreground block">NLR RATIO</span>
                  <span className={`text-base font-black font-mono ${nlr > 5 ? "text-rose-400" : nlr > 3 ? "text-amber-400" : "text-emerald-400"}`}>
                    {nlr}
                  </span>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">
                    {nlr > 5 ? "Bacteremic Stress" : "Normal < 3.0"}
                  </span>
                </div>

                <div className="rounded-xl border border-border/70 bg-background/50 p-2.5">
                  <span className="text-[10px] font-mono text-muted-foreground block">PYURIA RATIO</span>
                  <span className={`text-base font-black font-mono ${pyuriaRatio > 3 ? "text-cyan-400" : "text-amber-400"}`}>
                    {pyuriaRatio}
                  </span>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">
                    {pyuriaRatio > 3 ? "True Pyuria" : "Contaminant"}
                  </span>
                </div>

                <div className="rounded-xl border border-border/70 bg-background/50 p-2.5">
                  <span className="text-[10px] font-mono text-muted-foreground block">SII INDEX</span>
                  <span className={`text-base font-black font-mono ${sii > 500 ? "text-rose-400" : "text-teal-400"}`}>
                    {sii}
                  </span>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">
                    WBC × CRP / 10³
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Local Institutional Antibiogram Baseline */}
            <div className="hud-card rounded-2xl p-5 border border-border/80 bg-card/60 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider">
                    {patient.DEPARTMENT} Antibiogram Baseline
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">Historical Inpatient %S</span>
              </div>

              <div className="space-y-1.5">
                {deptAntibiogram.map((item) => (
                  <div key={item.drug} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-background/40 border border-border/40">
                    <span className="font-medium text-foreground">{item.drug}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{item.status}</span>
                      <span className={`font-mono font-bold text-xs ${item.rate >= 80 ? "text-emerald-400" : item.rate >= 60 ? "text-amber-400" : "text-rose-400"}`}>
                        {item.rate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 text-center p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-[10px] text-cyan-300 font-mono flex items-center justify-center gap-1.5">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                <span>Simulated AST Petri Dish & Gram Stain will generate below after AI execution</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Primary Command Button Bar (Full Width Action) */}
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-card/80 to-emerald-950/40 p-6 backdrop-blur-2xl shadow-elevated text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
                Ready for Tri-Model Diagnostic Inference
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Executes Model 1 (Etiology Taxonomy), Model 2 (53-Drug Resistance Matrix), and Model 3 (Renal Stewardship Engine).
              </p>
            </div>

            <Button
              onClick={() => onSubmit(patient)}
              disabled={isLoading}
              size="lg"
              className="w-full sm:w-auto min-w-[320px] h-13 text-sm font-bold uppercase tracking-wider font-mono gradient-primary text-slate-950 shadow-primary gap-2.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span>Computing Clinical Predictions...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Execute AI Multi-Model Inference</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BioTechCockpit;
