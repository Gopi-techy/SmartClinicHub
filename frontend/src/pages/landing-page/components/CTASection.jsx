import React from "react";
import AppIcon from "../../../components/AppIcon";

const CTASection = () => {
  return (
    <>
      <footer className="bg-background border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo + Name */}
          <div className="flex items-center gap-2">
            <AppIcon name="Heart" className="text-primary" size={22} />
            <span className="font-semibold text-foreground text-lg">
              SmartClinicHub
            </span>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="#privacy" className="hover:text-primary transition">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-primary transition">
              Terms of Service
            </a>
            <a href="#support" className="hover:text-primary transition">
              Support
            </a>
            <a href="#contact" className="hover:text-primary transition">
              Contact
            </a>
          </div>

          {/* React Icon + Copyright */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Built with</span>
            <span>❤️ by Gopinath</span>
          </div>
        </div>
      </footer>

      {/* Inline CSS */}
      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .react-icon {
          color: #61dafb; /* React Blue */
          animation: spin-slow 6s linear infinite;
        }
      `}</style>
    </>
  );
};

export default CTASection;
