import { 
  Cpu, 
  ShieldCheck, 
  Database, 
  GitBranch, 
  BarChart2, 
  CheckCircle2, 
  Lock, 
  FileCode, 
  Activity, 
  AlertCircle 
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import modelMetrics from "@/data/model_metrics.json";

const FEATURE_IMPORTANCES = [
  { feature: "Serum Creatinine", importance: 0.0341, category: "Renal Function" },
  { feature: "Estimated CrCl (Cockcroft-Gault)", importance: 0.0331, category: "Renal Clearance" },
  { feature: "Blood Urea", importance: 0.0309, category: "Renal Function" },
  { feature: "Serum Uric Acid", importance: 0.0299, category: "Renal / Metabolic" },
  { feature: "Urea / Creatinine Ratio", importance: 0.0249, category: "Renal Ratio" },
  { feature: "Total WBC Count", importance: 0.0215, category: "Hematology" },
  { feature: "Patient Age", importance: 0.0194, category: "Demographics" },
  { feature: "C-Reactive Protein (CRP)", importance: 0.0115, category: "Inflammation" },
  { feature: "CBP Lymphocytes %", importance: 0.0112, category: "Hematology" },
  { feature: "Absolute Neutrophil Count (ANC)", importance: 0.0107, category: "Hematology" },
  { feature: "Absolute Lymphocyte Count (ALC)", importance: 0.0092, category: "Hematology" },
  { feature: "CUE Pus Cells (/hpf)", importance: 0.0088, category: "Urinalysis" }
];

const ModelGovernance = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-2xl border border-secondary/20 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 p-6 md:p-8 backdrop-blur-xl shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 border border-secondary/20 px-3.5 py-1 text-xs font-semibold text-secondary mb-3">
              <Cpu className="h-3.5 w-3.5" />
              <span>Machine Learning Architecture & Governance Engine</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Clinical Model Intelligence & Validation
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              Transparent telemetry, performance benchmarks, and safety guardrails powering the UTI-AI Decision Support System. Calibrated against {modelMetrics.cohort.total_records} verified inpatient records ({modelMetrics.cohort.culture_confirmed_cases} culture-confirmed isolates: {modelMetrics.cohort.gram_negative_percent}% Gram-Negative, {modelMetrics.cohort.gram_positive_percent}% Gram-Positive).
            </p>
          </div>
          
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider">Guardrails</span>
              <span className="text-sm font-semibold">100% Conflict Free</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tri-Model Performance Scorecards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Model 1 */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <Activity className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Random Forest Classifier
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Model 1: Bacteria Taxonomy</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Distinguishes Gram-negative bacilli from Gram-positive cocci using patient biomarkers and symptoms.
            </p>
          </div>
          <div className="border-t border-border pt-4 grid grid-cols-2 gap-3 text-left">
            <div>
              <span className="text-[11px] text-muted-foreground">5-Fold CV Accuracy</span>
              <p className="text-xl font-bold text-foreground">
                {modelMetrics.model_1_taxonomy.cross_validation.mean_accuracy}%
              </p>
              <span className="text-[10px] text-muted-foreground font-mono">
                ±{modelMetrics.model_1_taxonomy.cross_validation.std_accuracy}% (F1: {modelMetrics.model_1_taxonomy.cross_validation.mean_weighted_f1})
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground">Holdout Test Split</span>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {modelMetrics.model_1_taxonomy.holdout_test_split_20pct.accuracy}%
              </p>
              <span className="text-[10px] text-muted-foreground font-mono">
                {modelMetrics.model_1_taxonomy.holdout_test_split_20pct.test_samples} test cases
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground">Target Classes</span>
              <p className="text-sm font-semibold text-foreground">2 (Gram - / +)</p>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground">Status</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" /> Deployed
              </span>
            </div>
          </div>
        </div>

        {/* Model 2 */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <span className="rounded-lg bg-rose-500/10 p-2 text-rose-500">
              <AlertCircle className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              MultiOutput Classifier
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Model 2: Antimicrobial Resistance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Predicts multi-label resistance signatures across {modelMetrics.model_2_resistance.evaluated_drugs_count} clinically supported antimicrobials.
            </p>
          </div>
          <div className="border-t border-border pt-4 grid grid-cols-2 gap-3 text-left">
            <div>
              <span className="text-[11px] text-muted-foreground">Holdout Label Accuracy</span>
              <p className="text-xl font-bold text-foreground">
                {modelMetrics.model_2_resistance.holdout_test_split_20pct.label_accuracy}%
              </p>
              <span className="text-[10px] text-muted-foreground font-mono">
                Micro-F1: {modelMetrics.model_2_resistance.holdout_test_split_20pct.micro_f1}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground">Hamming Loss</span>
              <p className="text-sm font-semibold text-foreground font-mono">
                {modelMetrics.model_2_resistance.holdout_test_split_20pct.hamming_loss}
              </p>
              <span className="text-[10px] text-muted-foreground">
                {modelMetrics.model_2_resistance.holdout_test_split_20pct.test_samples} test samples
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground">Drug Panel</span>
              <p className="text-sm font-semibold text-foreground">{modelMetrics.model_2_resistance.evaluated_drugs_count} Antibiotics</p>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground">Status</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" /> Deployed
              </span>
            </div>
          </div>
        </div>

        {/* Model 3 */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <span className="rounded-lg bg-cyan-500/10 p-2 text-cyan-500">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              MultiOutput Classifier
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Model 3: Susceptibility Prediction</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Forecasts therapeutic susceptibility across {modelMetrics.model_3_susceptibility.evaluated_drugs_count} first-line, broad-spectrum, and reserve agents.
            </p>
          </div>
          <div className="border-t border-border pt-4 grid grid-cols-2 gap-3 text-left">
            <div>
              <span className="text-[11px] text-muted-foreground">Holdout Label Accuracy</span>
              <p className="text-xl font-bold text-foreground">
                {modelMetrics.model_3_susceptibility.holdout_test_split_20pct.label_accuracy}%
              </p>
              <span className="text-[10px] text-muted-foreground font-mono">
                Micro-F1: {modelMetrics.model_3_susceptibility.holdout_test_split_20pct.micro_f1}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground">Hamming Loss</span>
              <p className="text-sm font-semibold text-foreground font-mono">
                {modelMetrics.model_3_susceptibility.holdout_test_split_20pct.hamming_loss}
              </p>
              <span className="text-[10px] text-muted-foreground">
                {modelMetrics.model_3_susceptibility.holdout_test_split_20pct.test_samples} test samples
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground">Drug Panel</span>
              <p className="text-sm font-semibold text-foreground">{modelMetrics.model_3_susceptibility.evaluated_drugs_count} Antibiotics</p>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground">Status</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" /> Deployed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importance Chart */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              Clinical Feature Importance (Gini Impurity Reduction)
            </h3>
            <p className="text-xs text-muted-foreground">
              Normalized importance scores identifying the strongest predictive clinical biomarkers across the cohort
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={FEATURE_IMPORTANCES} 
              layout="vertical" 
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.15} />
              <XAxis type="number" domain={[0, 0.04]} tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="feature" tick={{ fontSize: 11 }} width={160} />
              <Tooltip 
                formatter={(value: any) => [`${(Number(value) * 100).toFixed(2)}%`, 'Relative Weight']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))', 
                  borderRadius: '0.75rem',
                  fontSize: '12px' 
                }} 
              />
              <Bar dataKey="importance" fill="#0d9488" radius={[0, 4, 4, 0]}>
                {FEATURE_IMPORTANCES.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index < 3 ? '#059669' : index < 6 ? '#0284c7' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Clinical Safety & Pipeline Architecture Flow */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-indigo-500" />
          End-to-End Decision Architecture & Safety Pipeline
        </h3>
        <p className="text-xs text-muted-foreground">
          Step-by-step data execution pipeline ensuring clinical reproducibility and safeguarding against contradictory recommendations:
        </p>

        <div className="grid gap-3 md:grid-cols-5 text-xs">
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1.5">
            <span className="font-bold text-primary">Stage 1</span>
            <h4 className="font-semibold text-foreground">Intake & Preprocessing</h4>
            <p className="text-muted-foreground text-[11px]">
              Type-casts 11 numerical biomarkers, one-hot encodes 7 categoricals, and extracts TF-IDF n-grams from notes.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1.5">
            <span className="font-bold text-emerald-500">Stage 2</span>
            <h4 className="font-semibold text-foreground">Model 1 Taxonomy</h4>
            <p className="text-muted-foreground text-[11px]">
              Classifies Gram-negative vs Gram-positive profile with balanced weighting to overcome natural clinical class skews.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1.5">
            <span className="font-bold text-rose-500">Stage 3</span>
            <h4 className="font-semibold text-foreground">Dual Multi-Label ML</h4>
            <p className="text-muted-foreground text-[11px]">
              Injects Model 1 taxonomy output into Models 2 & 3 to predict resistant and susceptible drug candidates concurrently.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1.5">
            <span className="font-bold text-amber-500">Stage 4</span>
            <h4 className="font-semibold text-foreground">Exclusivity Guardrail</h4>
            <p className="text-muted-foreground text-[11px]">
              Automated reconciliation: If a drug is predicted resistant, it is strictly filtered out of sensitive recommendations.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1.5">
            <span className="font-bold text-secondary">Stage 5</span>
            <h4 className="font-semibold text-foreground">Pharmacotherapy & Priya</h4>
            <p className="text-muted-foreground text-[11px]">
              Calculates eGFR/CrCl renal dose intervals and generates evidence-based antibiotic plans via multi-provider AI engine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelGovernance;
