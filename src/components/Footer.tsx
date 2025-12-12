import { Link } from "react-router-dom";
import { MapPin, Phone, Clock, Facebook, Instagram } from "lucide-react";
import brogrammersLogo from "@/assets/brogrammers-logo.png";
import qualityRatedLogo from "@/assets/quality-rated-logo.png";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand & Tagline */}
          <div>
            <h3 className="font-bold text-xl mb-3">Genesis Learning Academy</h3>
            <p className="text-primary-foreground/80 text-sm mb-4">
              Serving families in Kennesaw with care and commitment.
            </p>
            {/* Quality Rated Badge */}
            <a
              href="https://families.decal.ga.gov/Provider/Details/48020"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:opacity-80 transition-opacity"
              aria-label="View our Quality Rated profile on Georgia DECAL"
            >
              <img 
                src={qualityRatedLogo} 
                alt="Quality Rated Child Care" 
                className="h-12 w-auto"
              />
            </a>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold text-lg mb-3">Contact Us</h4>
            <div className="space-y-2 text-sm text-primary-foreground/80">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <a 
                  href="https://www.google.com/maps/dir/?api=1&destination=2098+Carruth+St+NW+Kennesaw+GA+30144"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors"
                >
                  2098 Carruth St NW, Kennesaw, GA 30144
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:770-672-4255" className="hover:text-accent transition-colors">
                  (770) 672-4255
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Monday-Friday: 6:30 AM - 6:00 PM</span>
              </div>
            </div>
          </div>

          {/* Quick Links & Social */}
          <div>
            <h4 className="font-semibold text-lg mb-3">Connect With Us</h4>
            <div className="flex gap-4 mb-4">
              <a
                href="https://www.facebook.com/genesiskennesaw"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Visit our Facebook page"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/genesis_kennesaw"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Visit our Instagram page"
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

        <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center">
          <p className="text-sm text-primary-foreground/70 mb-4">
            © {new Date().getFullYear()} Genesis Learning Academy of Kennesaw. All rights reserved.
          </p>
          <a 
            href="https://brogrammersagency.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-all duration-300 group"
          >
            <img 
              src={brogrammersLogo} 
              alt="Brogrammers Agency Logo" 
              className="h-8 w-8 object-contain group-hover:scale-110 transition-transform duration-300"
            />
            <span className="text-primary-foreground/90 font-medium group-hover:text-accent transition-colors">
              Built by Brogrammers Agency
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
