import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import genesisLogo from "@/assets/genesis-logo-new.png";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { href: "/", label: "Home" },
    { href: "/programs", label: "Programs" },
    { href: "/about", label: "About Us" },
    { href: "/resources", label: "Parent Resources" },
    { href: "/bg-removal", label: "BG Removal" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        {/* Logo Section */}
        <div className="flex justify-center py-4">
          <Link to="/" className="flex items-center">
            <img src={genesisLogo} alt="Genesis Learning Academy" className="h-16 md:h-20 w-auto object-contain" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center gap-1 pb-4 border-t border-border pt-4">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "text-primary bg-secondary"
                  : "text-foreground hover:text-primary hover:bg-secondary/50"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Button asChild variant="cta" size="default" className="ml-4">
            <Link to="/enroll">Start Enrollment</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex justify-center pb-4 border-t border-border pt-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-md hover:bg-secondary"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-border animate-in slide-in-from-top-2 duration-200">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors text-center",
                  isActive(link.href)
                    ? "text-primary bg-secondary"
                    : "text-foreground hover:text-primary hover:bg-secondary/50"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-4 pt-2">
              <Button asChild variant="cta" size="lg" className="w-full">
                <Link to="/enroll" onClick={() => setIsOpen(false)}>
                  Start Enrollment
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
