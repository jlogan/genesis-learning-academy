import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock, Mail, Facebook, Instagram, Calendar, FileText } from "lucide-react";
import academySign from "@/assets/academy-sign-new.jpg";
import procareLogo from "@/assets/procare-logo.png";

const Resources = () => {
  const testimonials = [
    {
      name: "Sarah J.",
      role: "Parent of 2 children",
      quote: "Genesis Learning Academy has been a blessing for our family. The teachers genuinely care about each child, and I love that my kids see themselves represented in their educators.",
      rating: 5,
    },
    {
      name: "Michael T.",
      role: "Parent of 1 child",
      quote: "The flexible hours are perfect for our working family schedule. The staff is professional, loving, and always communicative. Highly recommend!",
      rating: 5,
    },
    {
      name: "Jessica M.",
      role: "Parent of 3 children",
      quote: "As a Black-owned business, Genesis truly understands our community. My children have thrived here, both academically and socially. The curriculum is excellent!",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Parent Resources</h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
            Everything you need to know about our center, hours, location, and more
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Location & Contact Card */}
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-primary mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Address</h3>
                      <p className="text-muted-foreground">2098 Carruth St NW</p>
                      <p className="text-muted-foreground">Kennesaw, GA 30144</p>
                      <a 
                        href="https://maps.google.com/?q=2098+Carruth+St+NW+Kennesaw+GA+30144" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent text-sm hover:underline inline-block mt-1"
                      >
                        Get Directions →
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                      <a href="tel:770-672-4255" className="text-accent text-lg hover:underline">
                        (770) 672-4255
                      </a>
                      <p className="text-muted-foreground text-sm mt-1">Call us anytime during business hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email</h3>
                      <a href="mailto:info@genesislearningacademy.com" className="text-accent hover:underline">
                        info@genesislearningacademy.com
                      </a>
                      <p className="text-muted-foreground text-sm mt-1">We respond within 24 hours</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hours & Schedule Card */}
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-primary mb-6">Hours & Schedule</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Operating Hours</h3>
                      <div className="space-y-1 text-muted-foreground">
                        <p className="flex justify-between">
                          <span className="font-medium">Monday - Friday:</span>
                          <span className="text-accent">6:30 AM - 6:30 PM</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="font-medium">Saturday - Sunday:</span>
                          <span>Closed</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Holidays</h3>
                      <p className="text-muted-foreground text-sm">
                        We observe major U.S. holidays. Families are notified in advance of any 
                        closures or adjusted schedules.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Drop-off & Pick-up</h3>
                      <p className="text-muted-foreground text-sm">
                        Flexible arrival and departure times within operating hours. Please sign 
                        your child in and out daily.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Parent Portal Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="shadow-lg max-w-3xl mx-auto">
            <CardContent className="p-8 text-center">
              <img 
                src={procareLogo} 
                alt="ProCare Solutions - Parent Portal" 
                className="h-16 mx-auto mb-6"
              />
              <h2 className="text-2xl font-bold text-primary mb-4">Parent Portal Access</h2>
              <p className="text-muted-foreground mb-6">
                Stay connected with your child's daily activities, photos, and updates through our ProCare parent portal.
              </p>
              <Button asChild size="lg" className="mb-4">
                <a 
                  href="https://schools.procareconnect.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Access Parent Portal
                </a>
              </Button>
              <p className="text-sm text-muted-foreground">
                Need help accessing the portal? Please speak with our staff at the daycare for assistance with your login credentials.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Map & Image Section */}
      <section className="py-16 bg-warmBg">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-lg overflow-hidden shadow-xl h-[400px]">
              <img 
                src={academySign} 
                alt="Genesis Learning Academy of Kennesaw Sign" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl h-[400px]">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3313.5!2d-84.615!3d34.023!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDAxJzIyLjgiTiA4NMKwMzYnNTQuMCJX!5e0!3m2!1sen!2sus!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Genesis Learning Academy Location"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Follow Us on Social Media</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stay connected with Genesis Learning Academy! Follow us for daily updates, photos of activities, 
            parenting tips, and community events.
          </p>
          <div className="flex gap-6 justify-center">
            <a
              href="https://www.facebook.com/genesiskennesaw"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 p-6 rounded-lg bg-secondary hover:bg-accent hover:scale-105 transition-all group"
            >
              <Facebook className="h-12 w-12 text-primary group-hover:text-accent-foreground" />
              <span className="font-semibold text-foreground group-hover:text-accent-foreground">Facebook</span>
              <span className="text-sm text-muted-foreground group-hover:text-accent-foreground/80">@genesiskennesaw</span>
            </a>
            <a
              href="https://www.instagram.com/genesis_kennesaw"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 p-6 rounded-lg bg-secondary hover:bg-accent hover:scale-105 transition-all group"
            >
              <Instagram className="h-12 w-12 text-primary group-hover:text-accent-foreground" />
              <span className="font-semibold text-foreground group-hover:text-accent-foreground">Instagram</span>
              <span className="text-sm text-muted-foreground group-hover:text-accent-foreground/80">@genesis_kennesaw</span>
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-warmBg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">What Parents Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hear from families who trust Genesis Learning Academy with their children's care and education
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-accent text-xl">★</span>
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Have questions or ready to enroll? Contact us today to learn more about our programs 
            and schedule a tour of our facility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="cta" size="lg">
              <a href="/enroll">Submit Enrollment Form</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-white hover:bg-white/90 text-primary border-white">
              <a href="tel:770-672-4255">Call: (770) 672-4255</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Resources;
