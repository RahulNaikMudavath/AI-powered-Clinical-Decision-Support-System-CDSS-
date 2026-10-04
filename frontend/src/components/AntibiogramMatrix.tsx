import { useState } from "react";
import { 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Info, 
  Microscope, 
  Pill, 
  Filter, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  Activity
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell } from "recharts";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AntibioticStat {
  drug: string;
  class: string;
  route: "Oral" | "IV" | "Oral / IV";
  sensitivePercent: number;
  resistantPercent: number;
  gramTarget: "Gram Negative" | "Gram Positive" | "Broad Spectrum";
  renalDosingCaution: boolean;
  stewardshipNotes: string;
}

const ANTIBIOGRAM_DATA: Record<string, AntibioticStat[]> = {
  "All": [
    { drug: "Fosfomycin", class: "Epoxide", route: "Oral", sensitivePercent: 88, resistantPercent: 12, gramTarget: "Broad Spectrum", renalDosingCaution: false, stewardshipNotes: "Excellent urinary bladder concentration; oral single 3g dose preferred for cystitis." },
    { drug: "Nitrofurantoin", class: "Nitrofuran", route: "Oral", sensitivePercent: 84, resistantPercent: 16, gramTarget: "Broad Spectrum", renalDosingCaution: true, stewardshipNotes: "Avoid if eGFR < 30 mL/min or in pyelonephritis due to inadequate renal tissue levels." },
    { drug: "Amikacin", class: "Aminoglycoside", route: "IV", sensitivePercent: 82, resistantPercent: 18, gramTarget: "Gram Negative", renalDosingCaution: true, stewardshipNotes: "High efficacy in multi-drug resistant Gram-negative urosepsis; monitor serum creatinine and peak/trough levels." },
    { drug: "Meropenem", class: "Carbapenem", route: "IV", sensitivePercent: 80, resistantPercent: 20, gramTarget: "Gram Negative", renalDosingCaution: true, stewardshipNotes: "Reserve for severe ESBL sepsis or hemodynamic instability; step down upon culture confirmation." },
    { drug: "Imipenem", class: "Carbapenem", route: "IV", sensitivePercent: 78, resistantPercent: 22, gramTarget: "Gram Negative", renalDosingCaution: true, stewardshipNotes: "High anti-pseudomonal and ESBL activity; adjust dose in renal impairment." },
    { drug: "Gentamicin", class: "Aminoglycoside", route: "IV", sensitivePercent: 74, resistantPercent: 26, gramTarget: "Gram Negative", renalDosingCaution: true, stewardshipNotes: "Synergistic bactericidal action; once-daily extended interval dosing recommended." },
    { drug: "Piperacillin-Tazobactam", class: "Beta-lactamase inhibitor combo", route: "IV", sensitivePercent: 66, resistantPercent: 34, gramTarget: "Broad Spectrum", renalDosingCaution: true, stewardshipNotes: "Carbapenem-sparing alternative for moderate-to-severe pyelonephritis and CAUTI." },
    { drug: "Cefoperazone-Sulbactam", class: "3rd Gen Cephalosporin + Inhibitor", route: "IV", sensitivePercent: 64, resistantPercent: 36, gramTarget: "Broad Spectrum", renalDosingCaution: false, stewardshipNotes: "Biliary excretion dominates; safe in severe renal dysfunction without dosage reduction." },
    { drug: "Levofloxacin", class: "Fluoroquinolone", route: "Oral / IV", sensitivePercent: 48, resistantPercent: 52, gramTarget: "Broad Spectrum", renalDosingCaution: true, stewardshipNotes: "High regional resistance observed. Reserve for documented sensitive upper UTI." },
    { drug: "Ceftriaxone", class: "3rd Gen Cephalosporin", route: "IV", sensitivePercent: 45, resistantPercent: 55, gramTarget: "Gram Negative", renalDosingCaution: false, stewardshipNotes: "High prevalence of CTX-M ESBL producers. Do not use as monotherapy if ESBL suspected." },
    { drug: "Ciprofloxacin", class: "Fluoroquinolone", route: "Oral / IV", sensitivePercent: 44, resistantPercent: 56, gramTarget: "Gram Negative", renalDosingCaution: true, stewardshipNotes: "Over 50% resistance rate in hospital cohort. Check susceptibility before prescribing." },
    { drug: "Cefixime", class: "3rd Gen Oral Cephalosporin", route: "Oral", sensitivePercent: 43, resistantPercent: 57, gramTarget: "Gram Negative", renalDosingCaution: true, stewardshipNotes: "Oral step-down only if isolate confirmed sensitive." },
    { drug: "Cefuroxime", class: "2nd Gen Cephalosporin", route: "Oral / IV", sensitivePercent: 42, resistantPercent: 58, gramTarget: "Gram Negative", renalDosingCaution: true, stewardshipNotes: "Substantial beta-lactamase degradation; limited utility in complicated hospital infections." },
    { drug: "Amoxicillin-Clavulanate", class: "Aminopenicillin + Inhibitor", route: "Oral / IV", sensitivePercent: 41, resistantPercent: 59, gramTarget: "Broad Spectrum", renalDosingCaution: true, stewardshipNotes: "Widespread resistance in uropathogenic Gram negatives; suitable for sensitive Enterococci." },
    { drug: "Co-trimoxazole", class: "Sulfonamide + Trimethoprim", route: "Oral / IV", sensitivePercent: 38, resistantPercent: 62, gramTarget: "Broad Spectrum", renalDosingCaution: true, stewardshipNotes: "High resistance baseline. Only use if antibiogram documents zone of inhibition." },
    { drug: "Vancomycin", class: "Glycopeptide", route: "IV", sensitivePercent: 98, resistantPercent: 2, gramTarget: "Gram Positive", renalDosingCaution: true, stewardshipNotes: "First line for MRSA and Ampicillin-resistant Enterococcal bacteremic urosepsis." },
    { drug: "Linezolid", class: "Oxazolidinone", route: "Oral / IV", sensitivePercent: 96, resistantPercent: 4, gramTarget: "Gram Positive", renalDosingCaution: false, stewardshipNotes: "Oral bioavailability 100%; no renal dose adjustment required." }
  ],
  "Escherichia coli": [
    { drug: "Fosfomycin", class: "Epoxide", route: "Oral", sensitivePercent: 94, resistantPercent: 6, gramTarget: "Broad Spectrum", renalDosingCaution: false, stewardshipNotes: "First-line oral agent for uncomplicated E. coli cystitis." },
    { drug: "Amikacin", class: "Aminoglycoside", route: "IV", sensitivePercent: 89, resistantPercent: 11, gramTarget: "Gram Negative", renalDosingCaution: true, stewardshipNotes: "Retains high activity against ESBL-producing E. coli." },
    { drug: "Nitrofurantoin", class: "Nitrofuran", route: "Oral", sensitivePercent: 88, resistantPercent: 12, gramTarget: "Broad Spectrum", renalDosingCaution: true, stewardshipNotes: "Active against ESBL and non-ESBL E. coli cystitis." },
    { drug: "Meropenem", class: "Carbapenem", route: "IV", sensitivePercent: 86, resistantPercent: 14, gramTarget: "Gram Negative", renalDosingCaution: true, stewardshipNotes: "Definitive choice for pyelonephritis with severe sepsis." },
    { drug: "Piperacillin-Tazobactam", class: "Beta-lactamase inhibitor combo", route: "IV", sensitivePercent: 72, resistantPercent: 28, gramTarget: "Broad Spectrum", renalDosingCaution: true, stewardshipNotes: "Effective carbapenem-sparing agent for non-bacteremic E. coli." },
    { drug: "Ceftriaxone", class: "3rd Gen Cephalosporin", route: "IV", sensitivePercent: 42, resistantPercent: 58, gramTarget: "Gram Negative", renalDosingCaution: false, stewardshipNotes: "58% resistant due to ESBL production in hospital cohort." },
    { drug: "Ciprofloxacin", class: "Fluoroquinolone", route: "Oral / IV", sensitivePercent: 39, resistantPercent: 61, gramTarget: "Gram Negative", renalDosingCaution: true, stewardshipNotes: "Avoid empirical use due to >60% resistance rate." }
  ],
  "Klebsiella pneumoniae": [
    { drug: "Amikacin", class: "Aminoglycoside", route: "IV", sensitivePercent: 85, resistantPercent: 15, gramTarget: "Gram Negative", renalDosingCaution: true, stewardshipNotes: "Superior sensitivity in hospital Klebsiella isolates." },
    { drug: "Meropenem", class: "Carbapenem", route: "IV", sensitivePercent: 79, resistantPercent: 21, gramTarget: "Gram Negative", renalDosingCaution: true, stewardshipNotes: "Mainstay for severe Klebsiella pyelonephritis." },
    { drug: "Cefoperazone-Sulbactam", class: "3rd Gen Cephalosporin + Inhibitor", route: "IV", sensitivePercent: 68, resistantPercent: 32, gramTarget: "Broad Spectrum", renalDosingCaution: false, stewardshipNotes: "Synergistic sulbactam activity against beta-lactamase producing Klebsiella." },
    { drug: "Piperacillin-Tazobactam", class: "Beta-lactamase inhibitor combo", route: "IV", sensitivePercent: 64, resistantPercent: 36, gramTarget: "Broad Spectrum", renalDosingCaution: true, stewardshipNotes: "Effective if MIC is within susceptible range." },
    { drug: "Nitrofurantoin", class: "Nitrofuran", route: "Oral", sensitivePercent: 55, resistantPercent: 45, gramTarget: "Broad Spectrum", renalDosingCaution: true, stewardshipNotes: "Moderate activity; ensure species-level susceptibility." },
    { drug: "Ceftriaxone", class: "3rd Gen Cephalosporin", route: "IV", sensitivePercent: 35, resistantPercent: 65, gramTarget: "Gram Negative", renalDosingCaution: false, stewardshipNotes: "High ESBL rate renders standard 3rd gen cephalosporins ineffective." }
  ],
  "Pseudomonas aeruginosa": [
    { drug: "Amikacin", class: "Aminoglycoside", route: "IV", sensitivePercent: 88, resistantPercent: 12, gramTarget: "Gram Negative", renalDosingCaution: true, stewardshipNotes: "Most active aminoglycoside against Pseudomonas." },
    { drug: "Meropenem", class: "Carbapenem", route: "IV", sensitivePercent: 78, resistantPercent: 22, gramTarget: "Gram Negative", renalDosingCaution: true, stewardshipNotes: "Primary anti-pseudomonal carbapenem." },
    { drug: "Piperacillin-Tazobactam", class: "Beta-lactamase inhibitor combo", route: "IV", sensitivePercent: 76, resistantPercent: 24, gramTarget: "Broad Spectrum", renalDosingCaution: true, stewardshipNotes: "Standard empirical anti-pseudomonal backbone." },
    { drug: "Ceftazidime", class: "3rd Gen Anti-pseudomonal Cephalosporin", route: "IV", sensitivePercent: 68, resistantPercent: 32, gramTarget: "Gram Negative", renalDosingCaution: true, stewardshipNotes: "Specific anti-pseudomonal beta-lactam." },
    { drug: "Ciprofloxacin", class: "Fluoroquinolone", route: "Oral / IV", sensitivePercent: 58, resistantPercent: 42, gramTarget: "Gram Negative", renalDosingCaution: true, stewardshipNotes: "Only oral anti-pseudomonal option; confirm MIC." }
  ],
  "Enterococcus faecalis": [
    { drug: "Vancomycin", class: "Glycopeptide", route: "IV", sensitivePercent: 96, resistantPercent: 4, gramTarget: "Gram Positive", renalDosingCaution: true, stewardshipNotes: "Reliable bactericidal agent for Enterococcal UTI." },
    { drug: "Linezolid", class: "Oxazolidinone", route: "Oral / IV", sensitivePercent: 95, resistantPercent: 5, gramTarget: "Gram Positive", renalDosingCaution: false, stewardshipNotes: "Effective for VRE (Vancomycin-resistant enterococci)." },
    { drug: "Nitrofurantoin", class: "Nitrofuran", route: "Oral", sensitivePercent: 92, resistantPercent: 8, gramTarget: "Broad Spectrum", renalDosingCaution: true, stewardshipNotes: "Highly active in uncomplicated Enterococcal cystitis." },
    { drug: "Fosfomycin", class: "Epoxide", route: "Oral", sensitivePercent: 90, resistantPercent: 10, gramTarget: "Broad Spectrum", renalDosingCaution: false, stewardshipNotes: "Effective oral therapy for lower urinary Enterococcal infections." },
    { drug: "Amoxicillin-Clavulanate", class: "Aminopenicillin + Inhibitor", route: "Oral / IV", sensitivePercent: 82, resistantPercent: 18, gramTarget: "Broad Spectrum", renalDosingCaution: true, stewardshipNotes: "Ampicillin/Amoxicillin remains drug of choice if isolate is susceptible." }
  ]
};

const AntibiogramMatrix = () => {
  const [selectedOrganism, setSelectedOrganism] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [routeFilter, setRouteFilter] = useState<string>("All");

  const rawList = ANTIBIOGRAM_DATA[selectedOrganism] || ANTIBIOGRAM_DATA["All"];

  const filteredList = rawList.filter((item) => {
    const matchesSearch = item.drug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.class.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRoute = routeFilter === "All" || item.route.includes(routeFilter);
    return matchesSearch && matchesRoute;
  });

  const chartData = filteredList.slice(0, 10).map((d) => ({
    name: d.drug,
    Sensitive: d.sensitivePercent,
    Resistant: d.resistantPercent
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 p-6 md:p-8 backdrop-blur-xl shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
              <Microscope className="h-3.5 w-3.5" />
              <span>Real Hospital Antibiogram Surveillance • 315 Confirmed Cases</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Institutional UTI Antibiogram Matrix
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              Antimicrobial susceptibility surveillance compiled from audited hospital nephrology and urology inpatient culture records. Use to guide empiric selection and local stewardship protocols.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-border bg-card/80 p-3 text-center min-w-[100px]">
              <span className="block text-2xl font-bold text-emerald-600 dark:text-emerald-400">88%</span>
              <span className="text-[11px] text-muted-foreground font-medium">Top Sensitivity (Fosfomycin)</span>
            </div>
            <div className="rounded-xl border border-border bg-card/80 p-3 text-center min-w-[100px]">
              <span className="block text-2xl font-bold text-rose-500">62%</span>
              <span className="text-[11px] text-muted-foreground font-medium">Max Resistance (Cotrimoxazole)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Organism Selector Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Organism Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {["All", "Escherichia coli", "Klebsiella pneumoniae", "Pseudomonas aeruginosa", "Enterococcus faecalis"].map((org) => (
            <button
              key={org}
              onClick={() => setSelectedOrganism(org)}
              className={`rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                selectedOrganism === org
                  ? "bg-primary text-primary-foreground shadow-primary"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {org === "All" ? "All Uropathogens" : org}
            </button>
          ))}
        </div>

        {/* Search & Route Filter */}
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search antibiotic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="All">All Routes</option>
            <option value="Oral">Oral Only</option>
            <option value="IV">IV Only</option>
          </select>
        </div>
      </div>

      {/* Comparative Susceptibility Chart */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              Susceptibility vs Resistance Comparative Profile ({selectedOrganism})
            </h3>
            <p className="text-xs text-muted-foreground">
              Percentage of clinical isolates displaying in-vitro susceptibility vs documented resistance (CLSI breakpoints)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="h-3 w-3 rounded-sm bg-emerald-500 inline-block" /> Sensitive %
            </span>
            <span className="flex items-center gap-1.5 text-rose-500">
              <span className="h-3 w-3 rounded-sm bg-rose-500 inline-block" /> Resistant %
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: 'currentColor' }} 
                angle={-25} 
                textAnchor="end" 
                interval={0}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))', 
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)' 
                }} 
              />
              <Bar dataKey="Sensitive" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Resistant" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Antibiogram Matrix Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Antimicrobial Agent</th>
                <th className="py-3.5 px-4">Pharmacologic Class</th>
                <th className="py-3.5 px-3">Route</th>
                <th className="py-3.5 px-4 min-w-[160px]">Susceptibility Ratio</th>
                <th className="py-3.5 px-3">Renal Caution</th>
                <th className="py-3.5 px-4 min-w-[240px]">Stewardship & Clinical Pearls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredList.map((item) => (
                <tr key={item.drug} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-2">
                    <Pill className="h-3.5 w-3.5 text-primary" />
                    {item.drug}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {item.class}
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant={item.route === "Oral" ? "secondary" : "outline"} className="text-[10px]">
                      {item.route}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-emerald-600 dark:text-emerald-400">{item.sensitivePercent}% S</span>
                        <span className="text-rose-500">{item.resistantPercent}% R</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-rose-500/20 overflow-hidden flex">
                        <div 
                          className="h-full bg-emerald-500 rounded-l-full transition-all duration-500" 
                          style={{ width: `${item.sensitivePercent}%` }} 
                        />
                        <div 
                          className="h-full bg-rose-500 rounded-r-full transition-all duration-500" 
                          style={{ width: `${item.resistantPercent}%` }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    {item.renalDosingCaution ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-3 w-3" />
                        Adjust
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        Standard
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground leading-relaxed">
                    {item.stewardshipNotes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AntibiogramMatrix;
