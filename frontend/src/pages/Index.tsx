import { useState, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
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

const Index = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("assessment");
  const [selectedPresetKey, setSelectedPresetKey] = useState<"pyelonephritis" | "cauti" | "cystitis" | "male_recurrent" | null>(null);
  const [appState, setAppState] = useState<AppState>("form");
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [results, setResults] = useState<FinalResult | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check initial dark mode from DOM or localStorage
    const isDark = document.documentElement.classList.contains("dark") || 
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

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
    setSelectedPresetKey(presetKey);
    setActiveTab("assessment");
    setAppState("form");
    toast({
      title: "Preset Profile Loaded",
      description: `Loaded clinical parameters for ${presetKey.replace("_", " ").toUpperCase()}.`,
    });
    setTimeout(() => {
      document.getElementById("patient-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
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
        description: `Pathogen classified as ${resultData.predictions.bacteria_type_prediction} with ${resultData.predictions.predicted_sensitive_antibiotics.length} sensitive antimicrobials identified.`,
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
    setSelectedPresetKey(null);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-emerald-500/20 selection:text-emerald-400">
      <Header 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
      />

      {/* Backend Status Bar */}
      <div className="border-b border-border bg-muted/40 py-1.5 px-4 text-xs">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">FastAPI CDSS Core ({API_BASE_URL}):</span>
            {backendStatus === "online" ? (
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <Wifi className="h-3.5 w-3.5" />
                Live • Tri-Model Pipeline Ready
              </span>
            ) : backendStatus === "checking" ? (
              <span className="text-muted-foreground">Verifying telemetry...</span>
            ) : (
              <span className="flex items-center gap-1 font-semibold text-amber-500">
                <WifiOff className="h-3.5 w-3.5" />
                Offline (FastAPI server disconnected on :8000)
              </span>
            )}
          </div>
          <button
            onClick={checkBackendHealth}
            className="flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Recheck</span>
          </button>
        </div>
      </div>

      <main className="flex-1">
        {errorMessage && (
          <div className="container mx-auto px-4 pt-6 md:px-6">
            <Alert variant="destructive" className="mx-auto max-w-4xl">
              <AlertCircle className="h-4 w-4" />
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
              <PatientForm 
                onSubmit={handleFormSubmit} 
                isLoading={false} 
                selectedPresetKey={selectedPresetKey}
              />
            )}

            {appState === "loading" && (
              <div className="py-24 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-xl shadow-emerald-500/20">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  Synthesizing ML & Pharmacotherapeutic Profile
                </h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                  Running multi-label resistance classifiers, Cockcroft-Gault renal clearance adjustments, and stewardship guidelines...
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
