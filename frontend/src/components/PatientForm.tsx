import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Sparkles, Send, TestTube, Activity, Stethoscope } from "lucide-react";

export interface PatientData {
  AGE: number;
  GENDER: string;
  DEPARTMENT: string;
  CHIEF_COMPLAINTS: string;
  COMORBIDITIES: string;
  RISKFACTORS: string;
  SURGICAL_HISTORY: string;
  SOCIAL_HISTORY: string;
  DIAGNOSIS: string;
  CLASSIFICATION_OF_UTI: string;
  TYPE_OF_UTI: string;
  SITE_OF_INFECTION: string;
  TYPE_OF_SAMPLE: string;
  PREVIOUS_ANTIBIOTIC_USED: string;

  // Lab Results
  CBP_LYMPHOCYTES: number;
  WBC: number;
  POLYMORPHS: number;
  CRP: number;
  RFT_SERUM_CREATININE: number;
  SERUM_URIC_ACID: number;
  BLOOD_UREA: number;
  CUE_PUS_CELLS: number;
  EPITHELIAL_CELLS: number;
  PROTEINS: string;
  RBC: number;
}

interface PatientFormProps {
  onSubmit: (data: PatientData) => void;
  isLoading: boolean;
}

// Preset clinical profiles for 1-click evaluation
export const CLINICAL_PRESETS = [
  {
    title: "Complicated Pyelonephritis",
    subtitle: "Male 52, Catheterized, Creatinine 2.1",
    badge: "Upper UTI / High Risk",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    data: {
      AGE: 52,
      GENDER: "Male",
      DEPARTMENT: "Urology",
      CHIEF_COMPLAINTS: "Fever;Flank pain;Dysuria",
      COMORBIDITIES: "Diabetes",
      RISKFACTORS: "Catheterization",
      SURGICAL_HISTORY: "No",
      SOCIAL_HISTORY: "Non smoker",
      DIAGNOSIS: "Acute pyelonephritis",
      CLASSIFICATION_OF_UTI: "Complicated",
      TYPE_OF_UTI: "Acute",
      SITE_OF_INFECTION: "Upper UTI",
      TYPE_OF_SAMPLE: "Urine",
      PREVIOUS_ANTIBIOTIC_USED: "Ciprofloxacin",
      CBP_LYMPHOCYTES: 24,
      WBC: 18200,
      POLYMORPHS: 78,
      CRP: 65,
      RFT_SERUM_CREATININE: 2.1,
      SERUM_URIC_ACID: 6.2,
      BLOOD_UREA: 48,
      CUE_PUS_CELLS: 28,
      EPITHELIAL_CELLS: 6,
      PROTEINS: "Positive",
      RBC: 6,
    },
  },
  {
    title: "Acute Uncomplicated Cystitis",
    subtitle: "Female 34, Community-Acquired, Normal Renal",
    badge: "Lower UTI / Standard",
    badgeClass: "bg-success/10 text-success border-success/20",
    data: {
      AGE: 34,
      GENDER: "Female",
      DEPARTMENT: "General Medicine",
      CHIEF_COMPLAINTS: "Dysuria;Increased frequency",
      COMORBIDITIES: "None",
      RISKFACTORS: "Poor hygiene",
      SURGICAL_HISTORY: "No",
      SOCIAL_HISTORY: "Non smoker",
      DIAGNOSIS: "Acute cystitis",
      CLASSIFICATION_OF_UTI: "Uncomplicated",
      TYPE_OF_UTI: "Acute",
      SITE_OF_INFECTION: "Lower UTI",
      TYPE_OF_SAMPLE: "Mid-stream Urine",
      PREVIOUS_ANTIBIOTIC_USED: "Amoxicillin",
      CBP_LYMPHOCYTES: 32,
      WBC: 9800,
      POLYMORPHS: 68,
      CRP: 6,
      RFT_SERUM_CREATININE: 0.9,
      SERUM_URIC_ACID: 4.8,
      BLOOD_UREA: 28,
      CUE_PUS_CELLS: 12,
      EPITHELIAL_CELLS: 4,
      PROTEINS: "Trace",
      RBC: 3,
    },
  },
  {
    title: "Recurrent Geriatric UTI",
    subtitle: "Female 74, Impaired Clearance, Creatinine 2.4",
    badge: "Recurrent / Renal Caution",
    badgeClass: "bg-warning/10 text-warning border-warning/20",
    data: {
      AGE: 74,
      GENDER: "Female",
      DEPARTMENT: "Nephrology",
      CHIEF_COMPLAINTS: "Dysuria;Urgency;Lower abdominal pain;Fever",
      COMORBIDITIES: "Hypertension;CKD;Diabetes",
      RISKFACTORS: "Recurrent UTI history;Catheterization",
      SURGICAL_HISTORY: "Yes",
      SOCIAL_HISTORY: "Non smoker",
      DIAGNOSIS: "Recurrent complicated UTI",
      CLASSIFICATION_OF_UTI: "Complicated",
      TYPE_OF_UTI: "Recurrent",
      SITE_OF_INFECTION: "Upper UTI",
      TYPE_OF_SAMPLE: "Catheterized Urine",
      PREVIOUS_ANTIBIOTIC_USED: "Ciprofloxacin;Cefixime",
      CBP_LYMPHOCYTES: 18,
      WBC: 16500,
      POLYMORPHS: 82,
      CRP: 54,
      RFT_SERUM_CREATININE: 2.4,
      SERUM_URIC_ACID: 7.1,
      BLOOD_UREA: 62,
      CUE_PUS_CELLS: 35,
      EPITHELIAL_CELLS: 8,
      PROTEINS: "Positive",
      RBC: 9,
    },
  },
];

const complaintOptions = [
  "Dysuria",
  "Flank pain",
  "Fever",
  "Increased frequency",
  "Urgency",
  "Lower abdominal pain",
  "Hematuria",
  "Nausea/Vomiting",
];

const comorbidityOptions = [
  "Diabetes",
  "Hypertension",
  "CKD",
  "BPH",
  "Kidney Stones",
  "Liver Disease",
];

const riskOptions = [
  "Catheterization",
  "Sexual activity",
  "Poor hygiene",
  "Immunocompromised",
  "Pregnancy",
  "Recurrent UTI history",
];

const antibioticOptions = [
  "Ciprofloxacin",
  "Amoxicillin",
  "Cefixime",
  "Nitrofurantoin",
  "Ceftriaxone",
  "Ampicillin",
  "Levofloxacin",
];

const PatientForm = ({ onSubmit, isLoading }: PatientFormProps) => {
  const [activeTab, setActiveTab] = useState<"clinical" | "labs">("clinical");
  const [formData, setFormData] = useState<PatientData>(CLINICAL_PRESETS[0].data);

  const loadPreset = (presetIndex: number) => {
    setFormData(CLINICAL_PRESETS[presetIndex].data);
  };

  const handleTextChange = (field: keyof PatientData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof PatientData, value: string) => {
    const parsed = parseFloat(value);
    setFormData((prev) => ({ ...prev, [field]: isNaN(parsed) ? 0 : parsed }));
  };

  const toggleSemicolonItem = (field: "CHIEF_COMPLAINTS" | "COMORBIDITIES" | "RISKFACTORS" | "PREVIOUS_ANTIBIOTIC_USED", item: string) => {
    const current = formData[field]
      ? formData[field].split(";").map((s) => s.strip ? s.strip() : s.trim()).filter(Boolean)
      : [];
    const exists = current.includes(item);
    const updated = exists ? current.filter((x) => x !== item) : [...current, item];
    setFormData((prev) => ({ ...prev, [field]: updated.join(";") }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <section id="patient-form" className="py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
              <ClipboardList className="h-4 w-4" />
              <span>Evidence-Based Clinical Intake</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Patient Assessment & Diagnostic Panel
            </h2>
            <p className="mt-2 text-muted-foreground">
              Input patient demographics, infection history, and laboratory biomarkers for machine learning susceptibility prediction
            </p>
          </div>

          {/* Quick Presets Bar */}
          <div className="mb-8 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Quick Clinical Case Presets (1-Click Fill)
              </span>
              <span className="text-xs text-muted-foreground">Select a case to auto-populate all 25 clinical & lab parameters</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {CLINICAL_PRESETS.map((preset, idx) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => loadPreset(idx)}
                  className="group flex flex-col items-start justify-between rounded-lg border border-border/80 bg-background/50 p-3 text-left transition-all hover:border-primary hover:bg-accent/40"
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary">
                      {preset.title}
                    </span>
                    <Badge variant="outline" className={`text-[10px] ${preset.badgeClass}`}>
                      {preset.badge}
                    </Badge>
                  </div>
                  <span className="mt-1 text-xs text-muted-foreground">{preset.subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Form Container */}
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card shadow-elevated">
            {/* Navigation Tabs */}
            <div className="flex border-b border-border bg-muted/30">
              <button
                type="button"
                onClick={() => setActiveTab("clinical")}
                className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-4 text-sm font-medium transition-all ${
                  activeTab === "clinical"
                    ? "border-primary bg-card text-primary font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Stethoscope className="h-4 w-4" />
                1. Clinical Presentation & Demographics
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("labs")}
                className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-4 text-sm font-medium transition-all ${
                  activeTab === "labs"
                    ? "border-primary bg-card text-primary font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <TestTube className="h-4 w-4" />
                2. Laboratory Biomarkers & Urine Microscopy
              </button>
            </div>

            <div className="p-6 md:p-8">
              {/* TAB 1: Clinical Presentation */}
              {activeTab === "clinical" && (
                <div className="space-y-6">
                  {/* Basic Demographics */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Patient Demographics
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <Label htmlFor="age" className="text-xs font-medium">Age (Years)</Label>
                        <Input
                          id="age"
                          type="number"
                          value={formData.AGE}
                          onChange={(e) => handleNumberChange("AGE", e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="gender" className="text-xs font-medium">Gender</Label>
                        <Select
                          value={formData.GENDER}
                          onValueChange={(val) => handleTextChange("GENDER", val)}
                        >
                          <SelectTrigger id="gender" className="mt-1">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="department" className="text-xs font-medium">Clinical Department</Label>
                        <Select
                          value={formData.DEPARTMENT}
                          onValueChange={(val) => handleTextChange("DEPARTMENT", val)}
                        >
                          <SelectTrigger id="department" className="mt-1">
                            <SelectValue placeholder="Department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Urology">Urology</SelectItem>
                            <SelectItem value="General Medicine">General Medicine</SelectItem>
                            <SelectItem value="Nephrology">Nephrology</SelectItem>
                            <SelectItem value="Gynecology">Gynecology</SelectItem>
                            <SelectItem value="Emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="sample" className="text-xs font-medium">Specimen Source</Label>
                        <Select
                          value={formData.TYPE_OF_SAMPLE}
                          onValueChange={(val) => handleTextChange("TYPE_OF_SAMPLE", val)}
                        >
                          <SelectTrigger id="sample" className="mt-1">
                            <SelectValue placeholder="Sample type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Urine">Clean Catch Urine</SelectItem>
                            <SelectItem value="Catheterized Urine">Catheterized Urine</SelectItem>
                            <SelectItem value="Mid-stream Urine">Mid-stream Urine (MSU)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Infection Classification */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Infection Classification & Diagnosis
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <Label htmlFor="dx" className="text-xs font-medium">Working Diagnosis</Label>
                        <Input
                          id="dx"
                          value={formData.DIAGNOSIS}
                          onChange={(e) => handleTextChange("DIAGNOSIS", e.target.value)}
                          className="mt-1"
                          placeholder="e.g. Acute pyelonephritis"
                        />
                      </div>

                      <div>
                        <Label htmlFor="classification" className="text-xs font-medium">Classification</Label>
                        <Select
                          value={formData.CLASSIFICATION_OF_UTI}
                          onValueChange={(val) => handleTextChange("CLASSIFICATION_OF_UTI", val)}
                        >
                          <SelectTrigger id="classification" className="mt-1">
                            <SelectValue placeholder="Classification" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Complicated">Complicated</SelectItem>
                            <SelectItem value="Uncomplicated">Uncomplicated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="site" className="text-xs font-medium">Anatomical Site</Label>
                        <Select
                          value={formData.SITE_OF_INFECTION}
                          onValueChange={(val) => handleTextChange("SITE_OF_INFECTION", val)}
                        >
                          <SelectTrigger id="site" className="mt-1">
                            <SelectValue placeholder="Site" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Upper UTI">Upper UTI (Pyelonephritis)</SelectItem>
                            <SelectItem value="Lower UTI">Lower UTI (Cystitis)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="acuity" className="text-xs font-medium">Clinical Acuity</Label>
                        <Select
                          value={formData.TYPE_OF_UTI}
                          onValueChange={(val) => handleTextChange("TYPE_OF_UTI", val)}
                        >
                          <SelectTrigger id="acuity" className="mt-1">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Acute">Acute</SelectItem>
                            <SelectItem value="Recurrent">Recurrent</SelectItem>
                            <SelectItem value="Chronic">Chronic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Chief Complaints */}
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Chief Complaints (Select all present)
                    </Label>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {complaintOptions.map((item) => {
                        const isChecked = formData.CHIEF_COMPLAINTS.split(";").includes(item);
                        return (
                          <label
                            key={item}
                            className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs transition-all ${
                              isChecked
                                ? "border-primary bg-primary/5 font-semibold text-primary"
                                : "border-border hover:bg-muted/40 text-foreground"
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggleSemicolonItem("CHIEF_COMPLAINTS", item)}
                            />
                            <span>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comorbidities & Risk Factors */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Comorbidities
                      </Label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {comorbidityOptions.map((item) => {
                          const isChecked = formData.COMORBIDITIES.split(";").includes(item);
                          return (
                            <label
                              key={item}
                              className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs transition-all ${
                                isChecked
                                  ? "border-primary bg-primary/5 font-semibold text-primary"
                                  : "border-border hover:bg-muted/40 text-foreground"
                              }`}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleSemicolonItem("COMORBIDITIES", item)}
                              />
                              <span>{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Risk Factors
                      </Label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {riskOptions.map((item) => {
                          const isChecked = formData.RISKFACTORS.split(";").includes(item);
                          return (
                            <label
                              key={item}
                              className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs transition-all ${
                                isChecked
                                  ? "border-primary bg-primary/5 font-semibold text-primary"
                                  : "border-border hover:bg-muted/40 text-foreground"
                              }`}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleSemicolonItem("RISKFACTORS", item)}
                              />
                              <span>{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Prior Antibiotic Exposure */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Prior Antibiotics Used (Past 90 Days)
                      </Label>
                      <span className="text-[11px] text-muted-foreground">Used by ML model to assess induced resistance</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {antibioticOptions.map((item) => {
                        const isChecked = formData.PREVIOUS_ANTIBIOTIC_USED.split(";").includes(item);
                        return (
                          <Badge
                            key={item}
                            variant={isChecked ? "default" : "outline"}
                            onClick={() => toggleSemicolonItem("PREVIOUS_ANTIBIOTIC_USED", item)}
                            className="cursor-pointer text-xs py-1 px-3 transition-all"
                          >
                            {isChecked ? "✓ " : "+ "}
                            {item}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Laboratory Biomarkers */}
              {activeTab === "labs" && (
                <div className="space-y-6">
                  {/* Blood Biomarkers */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Systemic Inflammatory & Hematologic Markers
                      </h3>
                      <Badge variant="outline" className="text-xs text-muted-foreground">CBC & Inflammatory Profile</Badge>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <div className="flex justify-between">
                          <Label htmlFor="wbc" className="text-xs font-medium">Total WBC Count</Label>
                          <span className="text-[10px] text-muted-foreground">4,000–11,000 /mcL</span>
                        </div>
                        <Input
                          id="wbc"
                          type="number"
                          value={formData.WBC}
                          onChange={(e) => handleNumberChange("WBC", e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between">
                          <Label htmlFor="crp" className="text-xs font-medium">C-Reactive Protein (CRP)</Label>
                          <span className="text-[10px] text-muted-foreground">&lt; 10 mg/L</span>
                        </div>
                        <Input
                          id="crp"
                          type="number"
                          value={formData.CRP}
                          onChange={(e) => handleNumberChange("CRP", e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between">
                          <Label htmlFor="polymorphs" className="text-xs font-medium">Polymorphs (Neutrophils)</Label>
                          <span className="text-[10px] text-muted-foreground">40–75 %</span>
                        </div>
                        <Input
                          id="polymorphs"
                          type="number"
                          value={formData.POLYMORPHS}
                          onChange={(e) => handleNumberChange("POLYMORPHS", e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between">
                          <Label htmlFor="lymphocytes" className="text-xs font-medium">Lymphocytes</Label>
                          <span className="text-[10px] text-muted-foreground">20–40 %</span>
                        </div>
                        <Input
                          id="lymphocytes"
                          type="number"
                          value={formData.CBP_LYMPHOCYTES}
                          onChange={(e) => handleNumberChange("CBP_LYMPHOCYTES", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Renal Function Tests */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Renal Function Panel (RFT)
                      </h3>
                      <Badge variant="outline" className="text-xs text-warning bg-warning/5 border-warning/20">
                        Critical for Antibiotic Dosing
                      </Badge>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <div className="flex justify-between">
                          <Label htmlFor="creatinine" className="text-xs font-medium text-primary">
                            Serum Creatinine
                          </Label>
                          <span className="text-[10px] text-muted-foreground">0.6–1.2 mg/dL</span>
                        </div>
                        <Input
                          id="creatinine"
                          type="number"
                          step="0.1"
                          value={formData.RFT_SERUM_CREATININE}
                          onChange={(e) => handleNumberChange("RFT_SERUM_CREATININE", e.target.value)}
                          className="mt-1 font-semibold"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between">
                          <Label htmlFor="blood_urea" className="text-xs font-medium">Blood Urea</Label>
                          <span className="text-[10px] text-muted-foreground">15–40 mg/dL</span>
                        </div>
                        <Input
                          id="blood_urea"
                          type="number"
                          value={formData.BLOOD_UREA}
                          onChange={(e) => handleNumberChange("BLOOD_UREA", e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between">
                          <Label htmlFor="uric_acid" className="text-xs font-medium">Serum Uric Acid</Label>
                          <span className="text-[10px] text-muted-foreground">3.5–7.2 mg/dL</span>
                        </div>
                        <Input
                          id="uric_acid"
                          type="number"
                          step="0.1"
                          value={formData.SERUM_URIC_ACID}
                          onChange={(e) => handleNumberChange("SERUM_URIC_ACID", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Urine Analysis & Microscopy */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Complete Urine Examination (CUE Microscopy)
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <div className="flex justify-between">
                          <Label htmlFor="pus" className="text-xs font-medium">Pus Cells (Leukocytes)</Label>
                          <span className="text-[10px] text-muted-foreground">0–5 /hpf</span>
                        </div>
                        <Input
                          id="pus"
                          type="number"
                          value={formData.CUE_PUS_CELLS}
                          onChange={(e) => handleNumberChange("CUE_PUS_CELLS", e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between">
                          <Label htmlFor="epithelial" className="text-xs font-medium">Epithelial Cells</Label>
                          <span className="text-[10px] text-muted-foreground">0–5 /hpf</span>
                        </div>
                        <Input
                          id="epithelial"
                          type="number"
                          value={formData.EPITHELIAL_CELLS}
                          onChange={(e) => handleNumberChange("EPITHELIAL_CELLS", e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between">
                          <Label htmlFor="protein" className="text-xs font-medium">Proteinuria</Label>
                          <span className="text-[10px] text-muted-foreground">Dipstick</span>
                        </div>
                        <Select
                          value={formData.PROTEINS}
                          onValueChange={(val) => handleTextChange("PROTEINS", val)}
                        >
                          <SelectTrigger id="protein" className="mt-1">
                            <SelectValue placeholder="Proteins" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Negative">Negative</SelectItem>
                            <SelectItem value="Trace">Trace</SelectItem>
                            <SelectItem value="Positive">Positive (1+ to 3+)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <div className="flex justify-between">
                          <Label htmlFor="rbc" className="text-xs font-medium">RBCs (Hematuria)</Label>
                          <span className="text-[10px] text-muted-foreground">0–3 /hpf</span>
                        </div>
                        <Input
                          id="rbc"
                          type="number"
                          value={formData.RBC}
                          onChange={(e) => handleNumberChange("RBC", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Footer Action Bar */}
            <div className="flex flex-col items-center justify-between gap-4 border-t border-border bg-muted/20 p-6 sm:flex-row">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Activity className="h-4 w-4 text-primary" />
                <span>
                  {activeTab === "clinical" ? "Tab 1 of 2 completed" : "Tab 2 of 2 ready for inference"}
                </span>
              </div>

              <div className="flex w-full items-center gap-3 sm:w-auto">
                {activeTab === "clinical" ? (
                  <Button
                    type="button"
                    onClick={() => setActiveTab("labs")}
                    variant="outline"
                    className="flex-1 sm:flex-initial"
                  >
                    Next: Review Labs →
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setActiveTab("clinical")}
                    variant="ghost"
                    className="flex-1 sm:flex-initial"
                  >
                    ← Back to Clinical Data
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 gradient-primary text-primary-foreground shadow-primary sm:flex-initial"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Analyzing Models...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Generate AI Recommendation
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default PatientForm;
