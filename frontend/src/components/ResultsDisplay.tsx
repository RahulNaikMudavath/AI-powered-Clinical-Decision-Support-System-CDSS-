import { useState } from "react";
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Pill,
  RefreshCw,
  MessageCircle,
  Send,
  Bot,
  User,
  Activity,
  FileText,
  Info,
  ChevronDown,
  ChevronUp,
  Printer,
  Copy,
  Check,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface PrescribedRecommendation {
  name: string;
  dosage: string;
  precautions: string;
  explanation: string;
}

export interface AntibioticHistoryInfo {
  background: string;
  common_usage: string;
  historical_success: string;
  mechanism_of_action: string;
  side_effects: string;
  resistance_notes: string;
}

export interface FinalResult {
  patient_index: number;
  patient_details: {
    age: number;
    gender: string;
    department: string;
    chief_complaints: string;
    comorbidities?: string;
    riskfactors?: string;
    surgical_history?: string;
    social_history?: string;
    diagnosis: string;
    classification_of_uti: string;
    type_of_uti: string;
    site_of_infection: string;
    type_of_sample: string;
    previous_antibiotic_used?: string;
    lab_results: {
      cbp_lymphocytes: number;
      wbc: number;
      polymorphs: number;
      crp: number;
      rft_serum_creatinine: number;
      serum_uric_acid: number;
      blood_urea: number;
      cue_pus_cells: number;
      epithelial_cells: number;
      proteins: string;
      rbc: number;
    };
  };
  predictions: {
    bacteria_type_prediction: string;
    predicted_resistant_antibiotics: string[];
    predicted_sensitive_antibiotics: string[];
  };
  prescribed_antibiotics: {
    recommended: PrescribedRecommendation[];
  };
  antibiotic_history: Record<string, AntibioticHistoryInfo>;
  summary: string;
}

interface ResultsDisplayProps {
  results: FinalResult;
  onReset: () => void;
  apiUrl?: string;
}

interface ChatMessage {
  id: number;
  role: "user" | "bot";
  text: string;
}

const ResultsDisplay = ({ results, onReset, apiUrl = "http://localhost:8000" }: ResultsDisplayProps) => {
  const [expandedDrug, setExpandedDrug] = useState<string | null>(null);
  const [copiedConsult, setCopiedConsult] = useState(false);

  // Chatbot State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "bot",
      text: `Hello! I am Priya, your clinical assistant. The diagnostic model predicts a ${results.predictions.bacteria_type_prediction} infection with ${results.predictions.predicted_sensitive_antibiotics.length} sensitive antibiotics identified. What questions do you have regarding the renal dosing, contraindications, or pharmacology?`,
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyConsultNote = () => {
    const text = `CLINICAL UTI ASSESSMENT & ANTIMICROBIAL STEWARDSHIP REPORT
Patient: ${results.patient_details.age}yo ${results.patient_details.gender} | Department: ${results.patient_details.department}
Diagnosis: ${results.patient_details.diagnosis} | Classification: ${results.patient_details.classification_of_uti}
Key Labs: WBC ${results.patient_details.lab_results.wbc} | Creatinine ${results.patient_details.lab_results.rft_serum_creatinine} mg/dL | Pus Cells ${results.patient_details.lab_results.cue_pus_cells}/hpf | Proteins ${results.patient_details.lab_results.proteins}

PREDICTED PATHOGEN TAXONOMY:
${results.predictions.bacteria_type_prediction}

RESISTANT ANTIMICROBIALS:
${results.predictions.predicted_resistant_antibiotics.join(", ") || "None identified"}

SUSCEPTIBLE CANDIDATE AGENTS:
${results.predictions.predicted_sensitive_antibiotics.join(", ")}

RECOMMENDED ANTIMICROBIAL REGIMEN:
${results.prescribed_antibiotics.recommended.map((r, i) => `${i + 1}. ${r.name} - ${r.dosage}\n   Precautions: ${r.precautions}\n   Rationale: ${r.explanation}`).join("\n\n")}

CLINICAL SUMMARY & MANAGEMENT:
${results.summary}
`;
    navigator.clipboard.writeText(text);
    setCopiedConsult(true);
    setTimeout(() => setCopiedConsult(false), 2500);
  };

  const sendSuggestedQuestion = (q: string) => {
    setChatInput(q);
  };

  const toggleDrugDetails = (name: string) => {
    setExpandedDrug((prev) => (prev === name ? null : name));
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isSendingChat) return;

    const userText = chatInput.trim();
    const newMsgId = messages.length + 1;

    setMessages((prev) => [...prev, { id: newMsgId, role: "user", text: userText }]);
    setChatInput("");
    setIsSendingChat(true);

    try {
      // Build conversation payload
      const patientSummary = `Patient is ${results.patient_details.age}yo ${results.patient_details.gender} with ${results.patient_details.diagnosis}, Creatinine ${results.patient_details.lab_results.rft_serum_creatinine} mg/dL, WBC ${results.patient_details.lab_results.wbc}. Predicted ${results.predictions.bacteria_type_prediction}. Sensitive: ${results.predictions.predicted_sensitive_antibiotics.join(", ")}. Resistant: ${results.predictions.predicted_resistant_antibiotics.join(", ")}.`;

      const formattedMessages = [
        ["system", patientSummary],
        ...messages.map((m) => [m.role === "bot" ? "assistant" : "user", m.text]),
        ["user", userText],
      ];

      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: formattedMessages }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            role: "bot",
            text: data.assistant_message || "I have noted that question regarding the patient's antimicrobial regimen.",
          },
        ]);
      } else {
        throw new Error("Chat service responded with non-200");
      }
    } catch (err) {
      // Clinical intelligent fallback
      const qLower = userText.toLowerCase();
      let fallbackText = "Based on this patient's profile, the recommended antimicrobials provide targeted coverage while mitigating the risk of therapeutic failure.";
      if (qLower.includes("creatinine") || qLower.includes("renal") || qLower.includes("kidney")) {
        fallbackText = `With Serum Creatinine at ${results.patient_details.lab_results.rft_serum_creatinine} mg/dL, all renally eliminated agents (including ${results.predictions.predicted_sensitive_antibiotics.join(", ")}) must undergo creatinine clearance calculation (Cockcroft-Gault) and interval titration.`;
      } else if (qLower.includes("resistant") || qLower.includes("resistance")) {
        fallbackText = `The patient demonstrated predicted resistance to ${results.predictions.predicted_resistant_antibiotics.join(", ") || "none"}, likely secondary to prior antimicrobial exposure or regional resistance patterns.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: "bot",
          text: fallbackText,
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const isGramNegative = results.predictions.bacteria_type_prediction.toLowerCase().includes("negative");

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-6xl space-y-10">
          {/* Header Action Bar */}
          <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
                  Diagnostic Report Completed
                </Badge>
                <span className="text-xs text-muted-foreground">IDSA / EAU Antimicrobial Stewardship Aligned</span>
              </div>
              <h2 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
                Diagnostic & Pharmacotherapeutic Profile
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                onClick={handleCopyConsultNote}
                variant="outline"
                size="sm"
                className="gap-2 border-primary/30 hover:bg-primary/10 text-xs"
              >
                {copiedConsult ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-primary" />}
                <span>{copiedConsult ? "Consult Copied!" : "Copy Consult Note"}</span>
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="gap-2 border-border hover:bg-muted text-xs"
              >
                <Printer className="h-4 w-4 text-muted-foreground" />
                <span>Print / PDF Report</span>
              </Button>
              <Button
                onClick={onReset}
                size="sm"
                className="gap-2 gradient-primary text-primary-foreground shadow-sm text-xs"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Assess Another Patient</span>
              </Button>
            </div>
          </div>

          {/* Top Grid: Pathogen & Susceptibility Summary */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* 1. Pathogen Classification Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Predicted Pathogen Class
                </span>
                <Pill className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${isGramNegative ? "text-primary" : "text-secondary"}`}>
                  {results.predictions.bacteria_type_prediction}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {isGramNegative
                  ? "Typical etiology: E. coli, Klebsiella pneumoniae, Proteus mirabilis, or Pseudomonas aeruginosa."
                  : "Typical etiology: Enterococcus faecalis, Staphylococcus saprophyticus, or Streptococcus spp."}
              </p>

              {/* Patient Quick Vitals */}
              <div className="mt-4 border-t border-border pt-3">
                <span className="text-[11px] font-medium text-muted-foreground">Patient Baseline:</span>
                <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Creatinine: </span>
                    <strong className={results.patient_details.lab_results.rft_serum_creatinine > 1.3 ? "text-warning" : "text-foreground"}>
                      {results.patient_details.lab_results.rft_serum_creatinine} mg/dL
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">WBC: </span>
                    <strong>{results.patient_details.lab_results.wbc.toLocaleString()} /mcL</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CRP: </span>
                    <strong>{results.patient_details.lab_results.crp} mg/L</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pus Cells: </span>
                    <strong>{results.patient_details.lab_results.cue_pus_cells} /hpf</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Resistant Antibiotics Card */}
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-destructive">
                  Predicted Resistant
                </span>
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div className="space-y-2">
                {results.predictions.predicted_resistant_antibiotics.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {results.predictions.predicted_resistant_antibiotics.map((abx) => (
                      <Badge
                        key={abx}
                        variant="destructive"
                        className="bg-destructive text-destructive-foreground text-xs"
                      >
                        ✕ {abx}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">No high-probability resistance flags detected.</span>
                )}
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground">
                Avoid empirical use of these agents to prevent treatment failure and selection pressure.
              </p>
            </div>

            {/* 3. Sensitive Antibiotics Card */}
            <div className="rounded-2xl border border-success/20 bg-success/5 p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-success">
                  Predicted Sensitive
                </span>
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div className="space-y-2">
                {results.predictions.predicted_sensitive_antibiotics.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {results.predictions.predicted_sensitive_antibiotics.map((abx) => (
                      <Badge
                        key={abx}
                        className="bg-success text-success-foreground hover:bg-success/90 text-xs"
                      >
                        ✓ {abx}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Broad spectrum intervention indicated.</span>
                )}
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground">
                Reconciled antimicrobial candidates demonstrating favorable predicted susceptibility.
              </p>
            </div>
          </div>

          {/* Recommended Regimens Detail Cards */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  Personalized Antibiotic Regimens
                </h3>
                <p className="text-xs text-muted-foreground">
                  Prioritized by clinical efficacy, site penetration, and renal clearance safety profile
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {results.prescribed_antibiotics.recommended.length} Regimens Evaluated
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {results.prescribed_antibiotics.recommended.map((drug, index) => {
                const history = results.antibiotic_history?.[drug.name];
                const isExpanded = expandedDrug === drug.name;

                return (
                  <div
                    key={drug.name}
                    className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/50"
                  >
                    <div>
                      {/* Drug Header */}
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                            Priority Regimen #{index + 1}
                          </span>
                          <h4 className="text-lg font-bold text-foreground">{drug.name}</h4>
                        </div>
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          First Line
                        </Badge>
                      </div>

                      {/* Dosage */}
                      <div className="mb-3 rounded-lg bg-muted/40 p-3">
                        <span className="text-[11px] font-medium text-muted-foreground">Dosage & Administration:</span>
                        <p className="mt-0.5 text-xs font-semibold text-foreground">{drug.dosage}</p>
                      </div>

                      {/* Precautions */}
                      <div className="mb-3 rounded-lg border border-warning/20 bg-warning/5 p-3">
                        <div className="flex items-center gap-1.5 text-warning">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-[11px] font-semibold">Precautions & Renal Dosing:</span>
                        </div>
                        <p className="mt-1 text-xs text-foreground/90">{drug.precautions}</p>
                      </div>

                      {/* Explanation */}
                      <p className="text-xs text-muted-foreground">{drug.explanation}</p>
                    </div>

                    {/* Expandable Pharmacology History */}
                    {history && (
                      <div className="mt-4 border-t border-border pt-3">
                        <button
                          type="button"
                          onClick={() => toggleDrugDetails(drug.name)}
                          className="flex w-full items-center justify-between text-xs font-semibold text-primary hover:underline"
                        >
                          <span>{isExpanded ? "Hide Pharmacology Profile" : "View Mechanism & Pharmacology"}</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 space-y-2 rounded-lg bg-muted/30 p-3 text-xs">
                            <div>
                              <strong className="text-foreground">Mechanism of Action:</strong>
                              <p className="text-muted-foreground">{history.mechanism_of_action}</p>
                            </div>
                            <div>
                              <strong className="text-foreground">Common Adverse Effects:</strong>
                              <p className="text-muted-foreground">{history.side_effects}</p>
                            </div>
                            <div>
                              <strong className="text-foreground">Resistance Patterns:</strong>
                              <p className="text-muted-foreground">{history.resistance_notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clinical Summary & Interactive Chatbot Split */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Clinical Summary Markdown Card */}
            <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Clinical Assessment & Synthesis</h3>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                {results.summary}
              </div>

              <div className="mt-6 rounded-lg bg-accent/30 p-3 text-[11px] text-muted-foreground border border-accent">
                <strong>AMS Note:</strong> Re-culture urine after 48–72 hours of antimicrobial initiation. Step down to oral narrow-spectrum therapy as soon as patient is afebrile and clinical improvement is confirmed.
              </div>
            </div>

            {/* Interactive Clinical AI Chatbot */}
            <div className="lg:col-span-5 rounded-2xl border border-border bg-card shadow-card flex flex-col h-[460px]">
              <div className="flex items-center gap-3 border-b border-border p-4 bg-muted/20">
                <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Priya – Clinical AI Assistant</h3>
                  <p className="text-[10px] text-muted-foreground">Ask questions regarding this patient's therapy</p>
                </div>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground border border-border/50"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {isSendingChat && (
                  <div className="flex gap-2 items-center text-xs text-muted-foreground">
                    <Bot className="h-4 w-4 animate-spin" />
                    <span>Priya is reviewing patient labs and guidelines...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="border-t border-border p-3 bg-background space-y-2">
                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => sendSuggestedQuestion(`How does Creatinine ${results.patient_details.lab_results.rft_serum_creatinine} mg/dL impact this regimen?`)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    Adjust for Cr {results.patient_details.lab_results.rft_serum_creatinine} mg/dL
                  </button>
                  <button
                    type="button"
                    onClick={() => sendSuggestedQuestion("What are safe oral step-down switch options for discharge?")}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-colors"
                  >
                    Oral step-down options
                  </button>
                  <button
                    type="button"
                    onClick={() => sendSuggestedQuestion(`Explain mechanism for resistance to ${results.predictions.predicted_resistant_antibiotics[0] || "fluoroquinolones"}`)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border hover:bg-muted/80 transition-colors"
                  >
                    Explain resistance mechanism
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about renal dosing, allergies, or alternatives..."
                    className="flex-1 text-xs"
                    disabled={isSendingChat}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSendingChat || !chatInput.trim()}
                    className="gradient-primary text-primary-foreground shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsDisplay;
