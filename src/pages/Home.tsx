import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, Clock, Award, ArrowRight, Shield, GraduationCap, Home as HomeIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroImage from "@/assets/genesis-building-exterior.jpg";
import happyChild from "@/assets/happy-child-playground.jpg";
import childActivity from "@/assets/child-art-activity.jpg";

const Home = () => {
  const features = [
    {
      icon: Heart,
      title: "Nurturing Environment",
      description: "Every child receives individual attention in a warm, caring atmosphere",
    },
    {
      icon: Users,
      title: "Experienced Teachers",
      description: "Caring educators who bring warmth, dedication, and expertise to every day",
    },
    {
      icon: Clock,
      title: "Flexible Hours",
      description: "Open 6:30 AM - 6:00 PM weekdays to accommodate your schedule",
    },
    {
      icon: Award,
      title: "Quality Education",
      description: "Age-appropriate curriculum from infants through school-age",
    },
  ];

  return (
    <div className="min-h-screen -mt-0">
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] flex items-center -mt-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              A Caring Learning Environment for Children in Kennesaw
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Genesis Learning Academy provides a safe, nurturing, structured space where children can grow, learn, and feel supported.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild variant="cta" size="lg">
                <Link to="/enroll">Get Started <ArrowRight className="ml-2" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-white hover:bg-white/90 text-primary border-white">
                <Link to="/programs">Explore Programs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Highlights Section */}
      <section className="py-20 bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-5xl mx-auto">
            <div className="text-center px-4">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <HomeIcon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Family-Focused Care</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">A warm community where every family feels at home</p>
            </div>
            
            <div className="text-center px-4">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Experienced Teachers</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Passionate educators dedicated to your child's growth</p>
            </div>
            
            <div className="text-center px-4">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Safe, Clean Learning Spaces</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Bright, sanitized spaces where children learn and play safely</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-warmBg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
              Why Choose Our Kennesaw Daycare?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A Black-owned and operated daycare in Kennesaw, GA committed to excellence in early childhood education
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-md hover:shadow-xl transition-shadow">
                <CardContent className="p-6 md:p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-3">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
                About Genesis Learning Academy
              </h2>
              <p className="text-lg text-foreground leading-relaxed">
                At Genesis Learning Academy, we believe every child deserves a nurturing environment where they can grow, learn, and thrive. 
                Our philosophy centers on creating a warm, inclusive community where children feel safe, valued, and inspired to explore the world around them. 
                As a Black-owned daycare in Kennesaw, we're proud to offer diverse role models and culturally responsive education that prepares children for success. 
                Our experienced educators combine proven early childhood development practices with genuine love and care, making us more than just a daycare—we're a family.
              </p>
              <Button asChild variant="default" size="lg" className="hover-scale mt-2">
                <Link to="/about">Learn More About Us <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="relative h-[350px] md:h-[400px] rounded-lg overflow-hidden shadow-xl">
              <img 
                src={childActivity} 
                alt="Children engaged in creative activities at Genesis Learning Academy" 
                className="w-full h-full object-cover object-[center_30%]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-warmBg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find quick answers to common questions about our programs and services.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="ages" className="bg-card rounded-lg border px-6">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  What ages do you serve?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  We serve children from infants (6 weeks) through school-age, including Infants, Toddlers, Twos, Preschool, Georgia Lottery Funded Pre-K, After School, and Summer Camp programs.{" "}
                  <Link to="/programs" className="text-primary font-medium hover:underline">
                    Learn more about our programs →
                  </Link>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="curriculum" className="bg-card rounded-lg border px-6">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  What curriculum do you use?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  We use The Creative Curriculum®, which emphasizes learning through play, hands-on exploration, and meaningful interactions. Teachers use observation-based lesson planning adapted to each child's interests and developmental level.{" "}
                  <Link to="/programs" className="text-primary font-medium hover:underline">
                    Read more about our curriculum →
                  </Link>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="hours" className="bg-card rounded-lg border px-6">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  What are your hours of operation?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  We are open Monday through Friday, 6:30 AM to 6:00 PM. We're here to accommodate your busy schedule.{" "}
                  <Link to="/resources" className="text-primary font-medium hover:underline">
                    See contact details →
                  </Link>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="enrollment" className="bg-card rounded-lg border px-6">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  How do I start enrollment?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Getting started is easy! Simply submit our online enrollment form and our team will follow up with you to discuss next steps and schedule a tour.{" "}
                  <Link to="/enroll" className="text-primary font-medium hover:underline">
                    Start Enrollment →
                  </Link>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="meals" className="bg-card rounded-lg border px-6">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  Do you provide meals and snacks?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Yes! We participate in the CACFP (Child and Adult Care Food Program), providing nutritious meals and snacks that meet USDA guidelines for healthy child development.{" "}
                  <Link to="/resources" className="text-primary font-medium hover:underline">
                    Learn about our meal program →
                  </Link>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="transportation" className="bg-card rounded-lg border px-6">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  Do you offer transportation for after school?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Yes, our Junior Achievers after school program includes pickup from nearby elementary schools. Transportation is available for an additional weekly fee.{" "}
                  <Link to="/programs#junior-achievers" className="text-primary font-medium hover:underline">
                    Learn about Junior Achievers →
                  </Link>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Join Our Family?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
            Give your child the gift of quality education in a loving, inclusive environment. 
            Enroll today and become part of the Genesis family.
          </p>
          <Button asChild variant="cta" size="lg" className="min-w-[200px]">
            <Link to="/enroll">Submit Enrollment Request</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
