import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock, Mail, Facebook, Instagram, Calendar, FileText, Star } from "lucide-react";
import academySign from "@/assets/academy-sign-new.jpg";
import procareLogo from "@/assets/procare-logo.png";
import shemariahGates from "@/assets/review-shemariah-gates.png";
import tanyshaRussell from "@/assets/review-tanysha-russell.png";
import danielTruffin from "@/assets/review-daniel-truffin.png";

const Resources = () => {
  const reviews = [
    {
      name: "Shemariah Gates",
      image: shemariahGates,
      rating: 5,
      date: "2 months ago",
      text: "This is a One of kind center, with One of a kind teachers and staff, with One of a kind vision. My children are seen and heard here, they are valued here, and they are loved here. The curriculum is perfect for my girls! I look forward to seeing the daily progress and images sent from their teachers. I'm so glad I chose Genesis Learning Academy because I'm not worried while they're in attendance!"
    },
    {
      name: "Tanysha Angel Russell",
      image: tanyshaRussell,
      rating: 5,
      date: "3 months ago",
      text: "Where do I begin? My 3 daughters have been attending Genesis Learning academy for almost 2 years now. We recently moved from another state so we were extremely cautious of where we would send our babies. GLA has been God sent for us! The facility is ALWAYS clean when we pick up/drop off the kids. The staff greets us with a smile everyday. They know all of our children by name and we ask our kids how they are treated and they are always treated with kindness. The curriculum is spot on and the meals are plentiful and nutritious based. I couldn't have asked for a better experience. It truly feels like home at GLA! ❤️"
    },
    {
      name: "Daniel Truffin",
      image: danielTruffin,
      rating: 5,
      date: "4 months ago",
      text: "My son has been going to this daycare for about a month. I love all of the employees, and they really make it feel like I'm dropping off my child off to a family member. They genuinely care about the children and their well-being and their development. It's a breath of fresh air as a parent to (especially a first-time parent)."
    }
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
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Location & Contact Card */}
            <Card className="shadow-lg">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-primary mb-6 text-center md:text-left">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-accent" />
                    </div>
                    <div className="text-center sm:text-left">
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

                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-accent" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                      <a href="tel:770-672-4255" className="text-accent text-lg hover:underline">
                        (770) 672-4255
                      </a>
                      <p className="text-muted-foreground text-sm mt-1">Call us anytime during business hours</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-accent" />
                    </div>
                    <div className="text-center sm:text-left w-full sm:w-auto">
                      <h3 className="font-semibold text-foreground mb-1">Email</h3>
                      <a href="mailto:info@genesislearningacademy.com" className="text-accent hover:underline break-all sm:break-normal">
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
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-primary mb-6 text-center md:text-left">Hours & Schedule</h2>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-accent" />
                    </div>
                    <div className="w-full">
                      <h3 className="font-semibold text-foreground mb-2 text-center sm:text-left">Operating Hours</h3>
                      <div className="space-y-2 text-muted-foreground">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <span className="font-medium text-center sm:text-left">Monday - Friday:</span>
                          <span className="text-accent text-center sm:text-right">6:30 AM - 6:30 PM</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <span className="font-medium text-center sm:text-left">Saturday - Sunday:</span>
                          <span className="text-center sm:text-right">Closed</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-6 w-6 text-accent" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="font-semibold text-foreground mb-2">Holidays</h3>
                      <p className="text-muted-foreground text-sm">
                        We observe major U.S. holidays. Families are notified in advance of any 
                        closures or adjusted schedules.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-accent" />
                    </div>
                    <div className="text-center sm:text-left">
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
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="shadow-lg max-w-3xl mx-auto">
            <CardContent className="p-6 md:p-8 text-center">
              <img 
                src={procareLogo} 
                alt="ProCare Solutions - Parent Portal" 
                className="h-16 mx-auto mb-6"
              />
              <h2 className="text-2xl font-bold text-primary mb-4">Parent Portal Access</h2>
              <p className="text-muted-foreground mb-6">
                Stay connected with your child's daily activities, photos, and updates through our ProCare parent portal.
              </p>
              <Button asChild size="lg" className="mb-4 w-full sm:w-auto">
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
      <section className="py-20 bg-warmBg">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="rounded-lg overflow-hidden shadow-xl h-[300px] md:h-[400px] w-full">
              <img 
                src={academySign} 
                alt="Genesis Learning Academy of Kennesaw Sign" 
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl h-[300px] md:h-[400px] w-full">
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
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Follow Us on Social Media</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stay connected with Genesis Learning Academy! Follow us for daily updates, photos of activities, 
            parenting tips, and community events.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a
              href="https://www.facebook.com/genesiskennesaw"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 p-6 rounded-lg bg-secondary hover:bg-accent hover:scale-105 transition-all group w-full sm:w-auto max-w-xs"
            >
              <Facebook className="h-12 w-12 text-primary group-hover:text-accent-foreground" />
              <span className="font-semibold text-foreground group-hover:text-accent-foreground">Facebook</span>
              <span className="text-sm text-muted-foreground group-hover:text-accent-foreground/80">@genesiskennesaw</span>
            </a>
            <a
              href="https://www.instagram.com/genesis_kennesaw"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 p-6 rounded-lg bg-secondary hover:bg-accent hover:scale-105 transition-all group w-full sm:w-auto max-w-xs"
            >
              <Instagram className="h-12 w-12 text-primary group-hover:text-accent-foreground" />
              <span className="font-semibold text-foreground group-hover:text-accent-foreground">Instagram</span>
              <span className="text-sm text-muted-foreground group-hover:text-accent-foreground/80">@genesis_kennesaw</span>
            </a>
          </div>
        </div>
      </section>

      {/* Google Reviews Section */}
      <section className="py-20 bg-warmBg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <h2 className="text-3xl md:text-4xl font-bold text-primary">Google Reviews</h2>
            </div>
            
            {/* Overall Rating Display */}
            <div className="flex flex-col items-center gap-3 mb-8">
              <div className="flex items-center gap-2">
                <span className="text-5xl font-bold text-primary">4.6</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 ${
                        star <= 4
                          ? "text-accent fill-accent"
                          : star === 5
                          ? "text-accent fill-accent opacity-60"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-lg text-muted-foreground">
                Based on Google reviews
              </p>
            </div>

            <Button asChild size="lg" variant="outline" className="mb-12">
              <a 
                href="https://www.google.com/search?sca_esv=16a5b3c49c9a2e73&sxsrf=AE3TifOYgxE5K4JF__WBpJzALwEMz8H5sw:1763768619004&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-EyndkXmFYcwKslSS4eorO-AoibReW42J9h4IQl42MiQl3NeUytSaCVbkppmMg8NuPhyF7UxH0Bx3hGOuqTnhucIq4KiHDkXn6e-nT0joOgcGIgITwLGYGOHjIZrxL8F5jPdMFV4%3D&q=Genesis+Learning+Academy+of+Kenessaw+Reviews&sa=X&ved=2ahUKEwi-yYGQtoSRAxWql4kEHfroLf0Q0bkNegQIJRAE&biw=1440&bih=703&dpr=2"
                target="_blank"
                rel="noopener noreferrer"
              >
                View All Reviews on Google
              </a>
            </Button>
          </div>

          {/* Review Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {reviews.map((review, index) => (
              <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  {/* Reviewer Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <img 
                      src={review.image} 
                      alt={review.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {review.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {review.date}
                      </p>
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? "text-accent fill-accent"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Review Text */}
                  <p className="text-sm text-foreground leading-relaxed">
                    {review.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Have questions or ready to enroll? Contact us today to learn more about our programs 
            and schedule a tour of our facility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="cta" size="lg" className="w-full sm:w-auto">
              <a href="/enroll">Submit Enrollment Request</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-white hover:bg-white/90 text-primary border-white w-full sm:w-auto">
              <a href="tel:770-672-4255">Call: (770) 672-4255</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Resources;
