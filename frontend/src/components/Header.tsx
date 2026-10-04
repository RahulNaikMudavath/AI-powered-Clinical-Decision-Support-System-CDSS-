import { Sun, Moon, Activity, Microscope, Cpu, Stethoscope, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  activeTab: "assessment" | "antibiogram" | "governance";
  setActiveTab: (tab: "assessment" | "antibiogram" | "governance") => void;
  backendStatus: "checking" | "online" | "offline";
}

const Header = ({ isDarkMode, toggleDarkMode, activeTab, setActiveTab, backendStatus }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-primary text-white">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-foreground">UTI-AI</span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                CDSS v2.5
              </span>
            </div>
            <span className="hidden text-xs text-muted-foreground sm:block">
              Clinical Decision Support & Antimicrobial Stewardship
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1">
          <button
            onClick={() => setActiveTab("assessment")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "assessment"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5 text-emerald-500" />
            <span>Patient Assessment</span>
          </button>

          <button
            onClick={() => setActiveTab("antibiogram")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "antibiogram"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Microscope className="h-3.5 w-3.5 text-teal-500" />
            <span>Antibiogram Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab("governance")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "governance"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Cpu className="h-3.5 w-3.5 text-blue-500" />
            <span>ML Governance</span>
          </button>
        </nav>

        {/* Right Tools (Backend status & Dark mode) */}
        <div className="flex items-center gap-2">
          {/* Status pill */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                backendStatus === "online"
                  ? "bg-emerald-500 animate-pulse"
                  : backendStatus === "checking"
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
            />
            <span className="text-[11px] font-medium text-muted-foreground">
              {backendStatus === "online" ? "FastAPI ML Online" : "Service Offline"}
            </span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleDarkMode}
            className="h-9 w-9 rounded-full border-border"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 text-warning" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="flex md:hidden border-t border-border px-2 py-1.5 justify-around bg-muted/30 text-xs">
        <button
          onClick={() => setActiveTab("assessment")}
          className={`px-3 py-1 rounded-md font-semibold ${activeTab === "assessment" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Assessment
        </button>
        <button
          onClick={() => setActiveTab("antibiogram")}
          className={`px-3 py-1 rounded-md font-semibold ${activeTab === "antibiogram" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Antibiogram
        </button>
        <button
          onClick={() => setActiveTab("governance")}
          className={`px-3 py-1 rounded-md font-semibold ${activeTab === "governance" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Governance
        </button>
      </div>
    </header>
  );
};

export default Header;
