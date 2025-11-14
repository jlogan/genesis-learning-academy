import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, Clock, Award, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-classroom.jpg";
import outdoorPlay from "@/assets/outdoor-play.jpg";

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
      description: "Our diverse team of Black educators brings passion and expertise",
    },
    {
      icon: Clock,
      title: "Flexible Hours",
      description: "Open 6:30 AM - 6:30 PM weekdays to accommodate your schedule",
    },
    {
      icon: Award,
      title: "Quality Education",
      description: "Age-appropriate curriculum from infants through school-age",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Kennesaw's Premier Daycare & Learning Center
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-white/90">
              Where every child thrives in a loving, inclusive environment
            </p>
            <p className="text-lg md:text-xl mb-8 text-white/80">
              Walking distance from Downtown Kennesaw • Minutes from I-75 • Perfect for commuting families
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild variant="cta" size="lg">
                <Link to="/enroll">Start Enrollment <ArrowRight className="ml-2" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-white hover:bg-white/90 text-primary border-white">
                <Link to="/programs">Explore Programs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-warmBg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Why Choose Our Kennesaw Daycare?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A Black-owned and operated daycare in Kennesaw, GA committed to excellence in early childhood education
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-md hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
                Your Trusted Kennesaw Childcare Partner
              </h2>
              <p className="text-lg text-foreground mb-4">
                Looking for a daycare in Kennesaw that's convenient and caring? Genesis Learning Academy is perfectly located 
                just steps from Downtown Kennesaw and minutes from I-75, making drop-off and pick-up easy for busy parents 
                commuting to work.
              </p>
              <p className="text-muted-foreground mb-6">
                Our Black-owned center brings together experienced educators who are passionate about early childhood development. 
                We're more than a daycare – we're a family committed to serving Kennesaw families with flexible hours and affordable care.
              </p>
              <Button asChild variant="default" size="lg">
                <Link to="/about">Meet Our Teachers</Link>
              </Button>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden shadow-xl">
              <img 
                src={outdoorPlay} 
                alt="Children playing outdoors with teachers at Genesis Learning Academy" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Join Our Family?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Give your child the gift of quality education in a loving, inclusive environment. 
            Enroll today and become part of the Genesis family.
          </p>
          <Button asChild variant="cta" size="lg">
            <Link to="/enroll">Complete Enrollment Form</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
