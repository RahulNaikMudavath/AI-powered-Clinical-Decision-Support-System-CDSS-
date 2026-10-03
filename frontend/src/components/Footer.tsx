import { Activity, Mail, MapPin, GraduationCap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Project Info */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-primary">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">UTI-AI</h3>
                <p className="text-xs text-muted-foreground">
                  Intelligent Antibiotic Recommendation
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              An AI-powered clinical decision support system for UTI pathogen prediction 
              and evidence-based antibiotic recommendations.
            </p>
          </div>

          {/* College Info */}
          <div>
            <h4 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <GraduationCap className="h-5 w-5 text-primary" />
              Academic Project
            </h4>
            <p className="text-sm text-muted-foreground">
              Developed as a PharmD internship project combining pharmaceutical knowledge 
              with machine learning to improve antimicrobial stewardship.
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              College of Pharmacy
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Contact</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>contact@uti-ai.project</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Department of Clinical Pharmacy</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} UTI-AI Project. Developed for academic and research purposes.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This tool is for educational purposes only and should not replace professional medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
