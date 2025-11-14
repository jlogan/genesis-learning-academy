import { Link } from "react-router-dom";
import { MapPin, Phone, Clock, Facebook, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand & Tagline */}
          <div>
            <h3 className="font-bold text-xl mb-3">Genesis Learning Academy</h3>
            <p className="text-primary-foreground/80 text-sm mb-4">
              Where every child thrives in a loving, inclusive environment.
            </p>
            <p className="text-primary-foreground/70 text-xs">
              Black-owned and operated early learning center serving Kennesaw, GA.
            </p>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold text-lg mb-3">Contact Us</h4>
            <div className="space-y-2 text-sm text-primary-foreground/80">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>2098 Carruth St NW, Kennesaw, GA 30144</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:770-672-4255" className="hover:text-accent transition-colors">
                  (770) 672-4255
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Monday-Friday: 6:30 AM - 6:30 PM</span>
              </div>
            </div>
          </div>

          {/* Quick Links & Social */}
          <div>
            <h4 className="font-semibold text-lg mb-3">Connect With Us</h4>
            <div className="flex gap-4 mb-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
            <div className="space-y-2 text-sm text-primary-foreground/80">
              <Link to="/programs" className="block hover:text-accent transition-colors">
                Our Programs
              </Link>
              <Link to="/about" className="block hover:text-accent transition-colors">
                About Our Teachers
              </Link>
              <Link to="/enroll" className="block hover:text-accent transition-colors">
                Enrollment Form
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center text-sm text-primary-foreground/70">
          <p>© {new Date().getFullYear()} Genesis Learning Academy of Kennesaw. All rights reserved.</p>
          <p className="mt-2">
            Built by{" "}
            <a 
              href="https://brogrammersagency.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent hover:underline font-medium"
            >
              Brogrammers
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
