import { useState, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PatientForm, { PatientData } from "@/components/PatientForm";
import ResultsDisplay, { FinalResult } from "@/components/ResultsDisplay";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

type AppState = "form" | "loading" | "results";

const Index = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [appState, setAppState] = useState<AppState>("form");
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [results, setResults] = useState<FinalResult | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsDarkMode(false);
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

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
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
        title: "Prediction Complete",
        description: `Pathogen classified as ${resultData.predictions.bacteria_type_prediction}.`,
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
    <div className="min-h-screen bg-background">
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Backend Status Bar */}
      <div className="border-b border-border bg-muted/40 py-1.5 px-4 text-xs">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Backend API ({API_BASE_URL}):</span>
            {backendStatus === "online" ? (
              <span className="flex items-center gap-1 font-semibold text-success">
                <Wifi className="h-3.5 w-3.5" />
                Live (FastAPI ML Service Connected)
              </span>
            ) : backendStatus === "checking" ? (
              <span className="text-muted-foreground">Checking connection...</span>
            ) : (
              <span className="flex items-center gap-1 font-semibold text-warning">
                <WifiOff className="h-3.5 w-3.5" />
                Offline (Run: uvicorn app.main:app --port 8000)
              </span>
            )}
          </div>
          <button
            onClick={checkBackendHealth}
            className="text-[11px] text-primary hover:underline"
          >
            Recheck
          </button>
        </div>
      </div>

      <main>
        {errorMessage && (
          <div className="container mx-auto px-4 pt-6 md:px-6">
            <Alert variant="destructive" className="mx-auto max-w-4xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>API Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </div>
        )}

        <HeroSection />

        {appState === "form" && (
          <PatientForm onSubmit={handleFormSubmit} isLoading={false} />
        )}

        {appState === "loading" && (
          <div className="py-20 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full gradient-primary shadow-primary">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-foreground border-t-transparent" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              Executing Machine Learning & Pharmacology Pipeline
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Predicting pathogen taxonomy, multi-label resistance, and calculating renal antibiotic adjustments...
            </p>
          </div>
        )}

        {appState === "results" && results && (
          <ResultsDisplay results={results} onReset={handleReset} apiUrl={API_BASE_URL} />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
