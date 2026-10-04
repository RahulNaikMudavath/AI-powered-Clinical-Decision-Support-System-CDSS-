import { useState, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import BioTechCockpit from "@/components/BioTechCockpit";
import PatientForm, { PatientData } from "@/components/PatientForm";
import ResultsDisplay, { FinalResult } from "@/components/ResultsDisplay";
import AntibiogramMatrix from "@/components/AntibiogramMatrix";
import ModelGovernance from "@/components/ModelGovernance";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

type AppState = "form" | "loading" | "results";
type ActiveTab = "assessment" | "antibiogram" | "governance";

const PRESET_PATIENT_DATA: Record<string, PatientData> = {
  pyelonephritis: {
    AGE: 64,
    GENDER: "Female",
    DEPARTMENT: "Nephrology",
    CHIEF_COMPLAINTS: "Severe left flank tenderness, spiking fevers (39.1°C), rigors, nausea, and dysuria",
    COMORBIDITIES: "Type 2 Diabetes Mellitus (HbA1c 8.4%), Hypertension",
    RISKFACTORS: "Postmenopausal, history of recurrent nephrolithiasis",
    SURGICAL_HISTORY: "None",
    SOCIAL_HISTORY: "Non-smoker, sedentary",
    DIAGNOSIS: "Pyelonephritis",
    CLASSIFICATION_OF_UTI: "Complicated",
    TYPE_OF_UTI: "Upper UTI",
    SITE_OF_INFECTION: "Kidney",
    TYPE_OF_SAMPLE: "Clean catch midstream urine",
    PREVIOUS_ANTIBIOTIC_USED: "Ciprofloxacin",

    CBP_LYMPHOCYTES: 11,
    WBC: 17800,
    POLYMORPHS: 84,
    CRP: 52.0,
    RFT_SERUM_CREATININE: 2.3,
    SERUM_URIC_ACID: 7.4,
    BLOOD_UREA: 56.0,
    CUE_PUS_CELLS: 50,
    EPITHELIAL_CELLS: 9,
    PROTEINS: "++",
    RBC: 7
  },
  cauti: {
    AGE: 72,
    GENDER: "Male",
    DEPARTMENT: "ICU",
    CHIEF_COMPLAINTS: "Fever, altered sensorium, cloudy sediment-rich urine in catheter drainage bag",
    COMORBIDITIES: "Benign Prostatic Hyperplasia, Chronic Kidney Disease Stage 3",
    RISKFACTORS: "Indwelling Foley catheter for 14 days, prolonged ICU stay",
    SURGICAL_HISTORY: "Transurethral catheterization",
    SOCIAL_HISTORY: "Ex-smoker",
    DIAGNOSIS: "Catheter-Associated UTI",
    CLASSIFICATION_OF_UTI: "Complicated",
    TYPE_OF_UTI: "Catheter-Associated",
    SITE_OF_INFECTION: "Bladder",
    TYPE_OF_SAMPLE: "Catheter specimen",
    PREVIOUS_ANTIBIOTIC_USED: "Ceftriaxone",

    CBP_LYMPHOCYTES: 8,
    WBC: 21500,
    POLYMORPHS: 89,
    CRP: 88.0,
    RFT_SERUM_CREATININE: 1.9,
    SERUM_URIC_ACID: 8.2,
    BLOOD_UREA: 62.0,
    CUE_PUS_CELLS: 65,
    EPITHELIAL_CELLS: 12,
    PROTEINS: "+++",
    RBC: 15
  },
  cystitis: {
    AGE: 29,
    GENDER: "Female",
    DEPARTMENT: "Outpatient",
    CHIEF_COMPLAINTS: "Severe dysuria, urinary urgency, frequency every 20 minutes, suprapubic cramping",
    COMORBIDITIES: "None",
    RISKFACTORS: "Sexually active female",
    SURGICAL_HISTORY: "None",
    SOCIAL_HISTORY: "Non-smoker, social drinker",
    DIAGNOSIS: "Cystitis",
    CLASSIFICATION_OF_UTI: "Uncomplicated",
    TYPE_OF_UTI: "Lower UTI",
    SITE_OF_INFECTION: "Bladder",
    TYPE_OF_SAMPLE: "Clean catch midstream urine",
    PREVIOUS_ANTIBIOTIC_USED: "None",

    CBP_LYMPHOCYTES: 28,
    WBC: 8200,
    POLYMORPHS: 64,
    CRP: 4.2,
    RFT_SERUM_CREATININE: 0.8,
    SERUM_URIC_ACID: 4.1,
    BLOOD_UREA: 22.0,
    CUE_PUS_CELLS: 22,
    EPITHELIAL_CELLS: 4,
    PROTEINS: "Nil",
    RBC: 2
  },
  male_recurrent: {
    AGE: 68,
    GENDER: "Male",
    DEPARTMENT: "Urology",
    CHIEF_COMPLAINTS: "Hesitancy, weak urinary stream, terminal dribbling, suprapubic ache, burning micturition",
    COMORBIDITIES: "Benign Prostatic Hyperplasia (BPH), Grade II",
    RISKFACTORS: "Bladder outlet obstruction, post-void residual volume > 120 mL",
    SURGICAL_HISTORY: "None",
    SOCIAL_HISTORY: "Non-smoker",
    DIAGNOSIS: "Recurrent UTI",
    CLASSIFICATION_OF_UTI: "Complicated",
    TYPE_OF_UTI: "Upper / Lower UTI",
    SITE_OF_INFECTION: "Prostate / Bladder",
    TYPE_OF_SAMPLE: "Clean catch midstream urine",
    PREVIOUS_ANTIBIOTIC_USED: "Nitrofurantoin",

    CBP_LYMPHOCYTES: 19,
    WBC: 12400,
    POLYMORPHS: 74,
    CRP: 28.0,
    RFT_SERUM_CREATININE: 1.4,
    SERUM_URIC_ACID: 6.8,
    BLOOD_UREA: 39.0,
    CUE_PUS_CELLS: 32,
    EPITHELIAL_CELLS: 6,
    PROTEINS: "+",
    RBC: 5
  }
};

const Index = () => {
  // Default to sleek obsidian dark mode
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("assessment");
  const [activeCockpitData, setActiveCockpitData] = useState<PatientData>(PRESET_PATIENT_DATA.pyelonephritis);
  const [appState, setAppState] = useState<AppState>("form");
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [results, setResults] = useState<FinalResult | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Default to dark mode for the Obsidian & Cyan Bio-Tech visual identity
    document.documentElement.classList.add("dark");
    setIsDarkMode(true);

    // Check backend health
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { method: "GET" });
      if (res.ok) {
        setBackendStatus("online");
      } else {
        setBackendStatus("offline");
      }
    } catch {
      setBackendStatus("offline");
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  const handleSelectPreset = (presetKey: "pyelonephritis" | "cauti" | "cystitis" | "male_recurrent") => {
    const preset = PRESET_PATIENT_DATA[presetKey];
    if (preset) {
      setActiveCockpitData(preset);
      setActiveTab("assessment");
      setAppState("form");
      toast({
        title: "Clinical Scenario Loaded",
        description: `Loaded parameters for ${presetKey.replace("_", " ").toUpperCase()} into the cockpit.`,
      });
      setTimeout(() => {
        document.getElementById("patient-form")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const handleFormSubmit = async (data: PatientData) => {
    setPatientData(data);
    setAppState("loading");
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Inference API Error (${response.status}): ${errorText}`);
      }

      const resultData: FinalResult = await response.json();
      setResults(resultData);
      setAppState("results");
      toast({
        title: "Clinical Inference Generated",
        description: `Pathogen: ${resultData.predictions.bacteria_type_prediction} with ${resultData.predictions.predicted_sensitive_antibiotics.length} sensitive antimicrobials identified.`,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      console.error("Inference Error:", error);
      setErrorMessage(error.message || "Failed to connect to backend service");
      setAppState("form");
      toast({
        variant: "destructive",
        title: "Connection / Inference Error",
        description: error.message || "Please ensure the FastAPI backend is running on port 8000.",
      });
    }
  };

  const handleReset = () => {
    setAppState("form");
    setPatientData(null);
    setResults(null);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-cyan-500/20 selection:text-cyan-400">
      <Header 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
      />

      {/* Backend Status Bar */}
      <div className="border-b border-border bg-muted/40 py-1.5 px-4 text-xs font-mono">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">FastAPI CDSS Core ({API_BASE_URL}):</span>
            {backendStatus === "online" ? (
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <Wifi className="h-3.5 w-3.5" />
                <span>ONLINE • TRI-MODEL INFERENCE ENGINE ACTIVE</span>
              </span>
            ) : backendStatus === "checking" ? (
              <span className="text-muted-foreground">Connecting to inference server...</span>
            ) : (
              <span className="flex items-center gap-1.5 font-semibold text-amber-400">
                <WifiOff className="h-3.5 w-3.5" />
                <span>OFFLINE (FastAPI server disconnected on :8000)</span>
              </span>
            )}
          </div>
          <button
            onClick={checkBackendHealth}
            className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Recheck</span>
          </button>
        </div>
      </div>

      <main className="flex-1">
        {errorMessage && (
          <div className="container mx-auto px-4 pt-6 md:px-6">
            <Alert variant="destructive" className="mx-auto max-w-4xl border-rose-500/30 bg-rose-950/40">
              <AlertCircle className="h-4 w-4 text-rose-400" />
              <AlertTitle>Clinical Decision Service Alert</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Dynamic Tab Views */}
        {activeTab === "assessment" && (
          <>
            <HeroSection onSelectPreset={handleSelectPreset} />

            {appState === "form" && (
              <BioTechCockpit 
                onSubmit={handleFormSubmit} 
                isLoading={false} 
                initialData={activeCockpitData}
              />
            )}

            {appState === "loading" && (
              <div className="py-28 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-emerald-500/20 to-teal-400/10 border border-cyan-400/40 shadow-elevated">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
                </div>
                <h3 className="text-2xl font-black text-foreground tracking-tight">
                  Running Tri-Model Bio-Inference Pipeline
                </h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto font-mono">
                  Evaluating bacterial taxonomy, multi-label resistance probabilities across 53 drugs, and Cockcroft-Gault renal titration...
                </p>
              </div>
            )}

            {appState === "results" && results && (
              <ResultsDisplay results={results} onReset={handleReset} apiUrl={API_BASE_URL} />
            )}
          </>
        )}

        {activeTab === "antibiogram" && (
          <div className="container mx-auto px-4 py-8 md:px-6">
            <AntibiogramMatrix />
          </div>
        )}

        {activeTab === "governance" && (
          <div className="container mx-auto px-4 py-8 md:px-6">
            <ModelGovernance />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
