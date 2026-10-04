import { useState } from "react";
import { 
  Microscope, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  CircleDot, 
  Layers, 
  Activity,
  Maximize2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface AstDisc {
  code: string;
  name: string;
  class: string;
  status: "sensitive" | "resistant";
  zoneDiameter: number; // in mm
  breakpoint: string;
  regionalSusceptibility: number; // e.g. 88%
  renalCaution: boolean;
  angle: number; // in degrees for circular placement
}

interface PetriDishVisualizerProps {
  bacteriaType?: string; // "Gram-negative bacteria" | "Gram-positive bacteria" | null
  sensitiveAntibiotics?: string[];
  resistantAntibiotics?: string[];
  creatinine?: number;
}

const DEFAULT_DISCS: AstDisc[] = [
  {
    code: "FOS",
    name: "Fosfomycin",
    class: "Epoxide / Phosphonic",
    status: "sensitive",
    zoneDiameter: 28,
    breakpoint: "CLSI S >= 24mm",
    regionalSusceptibility: 88,
    renalCaution: false,
    angle: 0
  },
  {
    code: "NIT",
    name: "Nitrofurantoin",
    class: "Nitrofuran",
    status: "sensitive",
    zoneDiameter: 22,
    breakpoint: "CLSI S >= 17mm",
    regionalSusceptibility: 84,
    renalCaution: true,
    angle: 45
  },
  {
    code: "MEM",
    name: "Meropenem",
    class: "Carbapenem",
    status: "sensitive",
    zoneDiameter: 31,
    breakpoint: "CLSI S >= 23mm",
    regionalSusceptibility: 80,
    renalCaution: true,
    angle: 90
  },
  {
    code: "AMK",
    name: "Amikacin",
    class: "Aminoglycoside",
    status: "sensitive",
    zoneDiameter: 26,
    breakpoint: "CLSI S >= 17mm",
    regionalSusceptibility: 82,
    renalCaution: true,
    angle: 135
  },
  {
    code: "CIP",
    name: "Ciprofloxacin",
    class: "Fluoroquinolone",
    status: "resistant",
    zoneDiameter: 6, // 6mm is disc diameter, meaning 0mm zone
    breakpoint: "CLSI R <= 15mm",
    regionalSusceptibility: 34,
    renalCaution: true,
    angle: 180
  },
  {
    code: "CRO",
    name: "Ceftriaxone",
    class: "3rd Gen Cephalosporin",
    status: "resistant",
    zoneDiameter: 8,
    breakpoint: "CLSI R <= 19mm",
    regionalSusceptibility: 42,
    renalCaution: false,
    angle: 225
  },
  {
    code: "TZP",
    name: "Piperacillin-Tazobactam",
    class: "Penicillin + BLI",
    status: "sensitive",
    zoneDiameter: 25,
    breakpoint: "CLSI S >= 21mm",
    regionalSusceptibility: 78,
    renalCaution: true,
    angle: 270
  },
  {
    code: "TMP",
    name: "Trimethoprim-Sulfa",
    class: "Folate Antagonist",
    status: "resistant",
    zoneDiameter: 6,
    breakpoint: "CLSI R <= 10mm",
    regionalSusceptibility: 38,
    renalCaution: true,
    angle: 315
  }
];

const PetriDishVisualizer = ({
  bacteriaType = "Gram-negative bacteria",
  sensitiveAntibiotics,
  resistantAntibiotics,
  creatinine = 1.2
}: PetriDishVisualizerProps) => {
  const [selectedDisc, setSelectedDisc] = useState<AstDisc | null>(DEFAULT_DISCS[0]);
  const [viewMode, setViewMode] = useState<"ast" | "gram_stain">("ast");

  const isGramNegative = !bacteriaType || bacteriaType.toLowerCase().includes("negative");

  // Dynamically compute discs status if custom list supplied
  const activeDiscs = DEFAULT_DISCS.map((d) => {
    let status = d.status;
    let zone = d.zoneDiameter;

    if (sensitiveAntibiotics && sensitiveAntibiotics.length > 0) {
      const match = sensitiveAntibiotics.some(
        (s) => s.toLowerCase().includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(s.toLowerCase())
      );
      if (match) {
        status = "sensitive";
        zone = Math.max(d.zoneDiameter, 24);
      }
    }

    if (resistantAntibiotics && resistantAntibiotics.length > 0) {
      const match = resistantAntibiotics.some(
        (r) => r.toLowerCase().includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(r.toLowerCase())
      );
      if (match) {
        status = "resistant";
        zone = 6;
      }
    }

    return {
      ...d,
      status,
      zoneDiameter: zone
    };
  });

  const sensitiveCount = activeDiscs.filter((d) => d.status === "sensitive").length;
  const resistantCount = activeDiscs.filter((d) => d.status === "resistant").length;

  // Dish dimensions
  const dishRadius = 150; // px
  const centerCoord = 175; // px (350x350 box)
  const discOrbitRadius = 100; // px

  return (
    <div className="hud-card rounded-2xl p-5 border border-cyan-500/20 bg-card/60 backdrop-blur-xl shadow-card overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-400 shadow-sm">
            <Microscope className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground tracking-tight">
                Microbial Culture & Kirby-Bauer AST
              </h3>
              <Badge 
                variant="outline" 
                className={`text-[10px] font-mono ${
                  isGramNegative 
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30" 
                    : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                }`}
              >
                {isGramNegative ? "GRAM-NEGATIVE (RODS)" : "GRAM-POSITIVE (COCCI)"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Simulated Mueller-Hinton agar plate showing disc diffusion zones of inhibition & resistance profiles.
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setViewMode("ast")}
            className={`px-3 py-1 rounded-md font-mono text-[11px] transition-all ${
              viewMode === "ast"
                ? "bg-background text-cyan-400 shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            AST Discs
          </button>
          <button
            type="button"
            onClick={() => setViewMode("gram_stain")}
            className={`px-3 py-1 rounded-md font-mono text-[11px] transition-all ${
              viewMode === "gram_stain"
                ? "bg-background text-cyan-400 shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Gram Stain Smear
          </button>
        </div>
      </div>

      {/* Main Visualizer Body: Petri Dish (Left) + Detail Card (Right) */}
      <div className="grid gap-6 md:grid-cols-12 items-center">
        {/* Petri Dish Canvas */}
        <div className="md:col-span-7 flex flex-col items-center justify-center">
          <div className="relative w-[340px] h-[340px] flex items-center justify-center">
            {/* Outer Glass Rim */}
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 bg-slate-950/80 shadow-[0_0_50px_rgba(0,242,254,0.15)] backdrop-blur-md" />
            
            {/* Inner Metallic Bezel */}
            <div className="absolute inset-2 rounded-full border border-cyan-400/30 bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 pointer-events-none" />

            {/* Agar Surface Medium */}
            <div 
              className={`absolute inset-4 rounded-full agar-surface overflow-hidden ${
                isGramNegative ? "bg-slate-950" : "bg-slate-950"
              }`}
            >
              {/* Radial subtle agar gradient */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,242,254,0.06)_0%,rgba(0,0,0,0.85)_100%)]" />

              {/* Background Bacterial Lawn Texture */}
              {viewMode === "ast" ? (
                <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none">
                  <pattern id="bacterial-lawn" width="20" height="20" patternUnits="userSpaceOnUse">
                    {isGramNegative ? (
                      // Pinkish-rose Bacilli (rods)
                      <rect x="3" y="6" width="10" height="4" rx="2" fill="#f43f5e" opacity="0.6" />
                    ) : (
                      // Deep purple Cocci clusters
                      <circle cx="8" cy="8" r="3.5" fill="#a855f7" opacity="0.7" />
                    )}
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#bacterial-lawn)" />
                </svg>
              ) : (
                // High-power Gram Stain microscopy view
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                  <div className="space-y-2">
                    <div className="mx-auto w-16 h-16 rounded-full border border-dashed border-cyan-400/40 flex items-center justify-center animate-spin-slow">
                      <Microscope className="h-8 w-8 text-cyan-400" />
                    </div>
                    <div className="font-mono text-xs font-semibold text-foreground">
                      1000x Oil Immersion View
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[200px] mx-auto">
                      {isGramNegative 
                        ? "Gram-negative, non-spore forming bacilli. Suggestive of Escherichia coli / Enterobacteriaceae." 
                        : "Gram-positive spherical cocci in pairs and chains. Suggestive of Enterococcus faecalis."}
                    </p>
                  </div>
                </div>
              )}

              {/* Radar Sweep Animation Line */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-1/2 h-1/2 origin-bottom-right radar-spinner bg-gradient-to-t from-cyan-400/15 via-transparent to-transparent" />
              </div>
            </div>

            {/* SVG AST Discs & Zones of Inhibition */}
            {viewMode === "ast" && (
              <svg 
                viewBox="0 0 350 350" 
                className="absolute inset-0 w-full h-full z-10 select-none"
              >
                {activeDiscs.map((disc, idx) => {
                  const rad = (disc.angle * Math.PI) / 180;
                  const cx = centerCoord + discOrbitRadius * Math.cos(rad);
                  const cy = centerCoord + discOrbitRadius * Math.sin(rad);

                  const isSensitive = disc.status === "sensitive";
                  const isSelected = selectedDisc?.code === disc.code;
                  const zoneVisualRadius = isSensitive ? disc.zoneDiameter * 1.3 : 12;

                  return (
                    <g 
                      key={idx} 
                      className="cursor-pointer transition-all duration-200"
                      onClick={() => setSelectedDisc(disc)}
                    >
                      {/* Zone of Inhibition Halo */}
                      {isSensitive ? (
                        <>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={zoneVisualRadius}
                            fill="rgba(16, 185, 129, 0.12)"
                            stroke="rgba(16, 185, 129, 0.6)"
                            strokeWidth={isSelected ? 2 : 1}
                            strokeDasharray={isSelected ? "none" : "3,3"}
                            className="pulse-halo-anim"
                          />
                          <circle
                            cx={cx}
                            cy={cy}
                            r={zoneVisualRadius * 0.7}
                            fill="rgba(0, 242, 254, 0.08)"
                          />
                        </>
                      ) : (
                        // Resistant: No Zone (Red Warning Ring)
                        <circle
                          cx={cx}
                          cy={cy}
                          r={14}
                          fill="rgba(244, 63, 94, 0.2)"
                          stroke="rgba(244, 63, 94, 0.8)"
                          strokeWidth={1.5}
                        />
                      )}

                      {/* Paper Antibiotic Disc (White Round Filter Paper) */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={11}
                        fill="#f8fafc"
                        stroke={isSelected ? "#00f2fe" : "#94a3b8"}
                        strokeWidth={isSelected ? 2.5 : 1}
                        className="shadow-md"
                      />

                      {/* Disc Abbreviation Label */}
                      <text
                        x={cx}
                        y={cy + 3.5}
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize="8"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="bold"
                        pointerEvents="none"
                      >
                        {disc.code}
                      </text>
                    </g>
                  );
                })}

                {/* Center Culture Marker */}
                <circle cx={centerCoord} cy={centerCoord} r={6} fill="rgba(0,242,254,0.4)" />
                <circle cx={centerCoord} cy={centerCoord} r={2} fill="#00f2fe" />
              </svg>
            )}
          </div>

          {/* Quick Disc Counters */}
          <div className="mt-3 flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{sensitiveCount} Sensitive Zones</span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              <span>{resistantCount} Resistant Discs</span>
            </span>
          </div>
        </div>

        {/* Selected Antibiotic Disc Inspector Card (Right) */}
        <div className="md:col-span-5 space-y-3.5">
          <div className="rounded-xl border border-border/80 bg-background/60 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Disc AST Inspector
              </span>
              {selectedDisc && (
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono font-semibold ${
                    selectedDisc.status === "sensitive"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  }`}
                >
                  {selectedDisc.status === "sensitive" ? "SUSCEPTIBLE (S)" : "RESISTANT (R)"}
                </Badge>
              )}
            </div>

            {selectedDisc ? (
              <div className="space-y-3">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-lg font-bold text-foreground tracking-tight">
                      {selectedDisc.name}
                    </h4>
                    <span className="font-mono text-xs text-cyan-400">
                      [{selectedDisc.code}]
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Class: <span className="text-foreground font-medium">{selectedDisc.class}</span>
                  </p>
                </div>

                {/* Telemetry Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
                    <span className="text-[10px] text-muted-foreground block">Inhibition Zone</span>
                    <span className={`text-sm font-bold ${
                      selectedDisc.status === "sensitive" ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {selectedDisc.zoneDiameter} mm
                    </span>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
                    <span className="text-[10px] text-muted-foreground block">Hospital Susceptibility</span>
                    <span className="text-sm font-bold text-cyan-400">
                      {selectedDisc.regionalSusceptibility}%
                    </span>
                  </div>
                </div>

                {/* CLSI Criteria */}
                <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span>CLSI Criterion:</span>
                    <span className="text-foreground">{selectedDisc.breakpoint}</span>
                  </div>
                  {selectedDisc.renalCaution && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-mono pt-1 border-t border-border/40">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>Renal dose adjustment advised (CrCl &lt; 50 mL/min)</span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {selectedDisc.status === "sensitive"
                    ? `Clear halo demonstrates complete suppression of ${isGramNegative ? "Gram-negative bacilli" : "Gram-positive cocci"} around the ${selectedDisc.name} paper disc.`
                    : `Confluent bacterial growth touches the disc margin (0mm zone), indicating intrinsic or plasmid-mediated beta-lactamase / target mutation resistance.`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Click any disc on the agar plate to inspect its AST zone telemetry.
              </p>
            )}
          </div>

          {/* Quick Disc Selector Carousel / Row */}
          <div className="flex flex-wrap gap-1.5">
            {activeDiscs.map((d) => (
              <button
                key={d.code}
                type="button"
                onClick={() => setSelectedDisc(d)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition-all border ${
                  selectedDisc?.code === d.code
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold shadow-sm"
                    : d.status === "sensitive"
                    ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
                    : "bg-rose-500/5 text-rose-400 border-rose-500/20 hover:bg-rose-500/10"
                }`}
              >
                {d.code} ({d.status === "sensitive" ? "S" : "R"})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetriDishVisualizer;
