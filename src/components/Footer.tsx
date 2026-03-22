import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm relative z-10">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="MockMate AI" className="h-8 w-8 rounded-lg" />
            <span className="font-display text-lg font-bold">MockMate AI</span>
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/setup" className="hover:text-foreground transition-colors">Practice</Link>
            <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">Account</Link>
          </nav>
        </div>

        <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MockMate AI. All rights reserved with Aditya Raj.
        </div>
      </div>
    </footer>
  );
}
