import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import genesisLogo from "@/assets/genesis-logo-clean.png";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { href: "/", label: "Home" },
    { href: "/programs", label: "Programs" },
    { href: "/about", label: "About Us" },
    { href: "/gallery", label: "Gallery" },
    { href: "/resources", label: "Parent Resources" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 pt-2">
        {/* Logo + Header CTA Section */}
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-3 pb-3">
          <Link to="/" className="flex items-center">
            <img src={genesisLogo} alt="Genesis Learning Academy" className="h-24 lg:h-28 w-auto object-contain" />
          </Link>

          <div className="hidden lg:flex items-center justify-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-3 py-1.5 text-sm font-bold transition-colors",
                  isActive(link.href)
                    ? "text-primary underline underline-offset-4 decoration-2"
                    : "text-foreground hover:text-primary hover:underline hover:underline-offset-4 hover:decoration-2"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3">
            <a
              href="tel:770-672-4255"
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/15 transition-colors"
              aria-label="Call Genesis Learning Academy at 770-672-4255"
            >
              <Phone className="h-4 w-4" />
              Call Us: (770) 672-4255
            </a>
            <Button asChild variant="cta" size="default">
              <Link to="/contact">Schedule a Visit</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex justify-center pb-4 border-t border-border pt-4">
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
          <div className="lg:hidden py-4 space-y-2 border-t border-border animate-in slide-in-from-top-2 duration-200">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block px-3.5 py-1.5 text-sm font-bold transition-colors text-center",
                  isActive(link.href)
                    ? "text-primary underline underline-offset-4 decoration-2"
                    : "text-foreground hover:text-primary hover:underline hover:underline-offset-4 hover:decoration-2"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-4 pt-2 space-y-2">
              <Button asChild variant="cta" size="lg" className="w-full">
                <Link to="/contact" onClick={() => setIsOpen(false)}>
                  Schedule a Visit
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link to="/contact" onClick={() => setIsOpen(false)}>
                  Ask a Question
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full">
                <a href="tel:770-672-4255" onClick={() => setIsOpen(false)}>
                  Call Us: (770) 672-4255
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
