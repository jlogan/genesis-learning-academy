import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, Award, Users, Shield } from "lucide-react";
import teachersTeam from "@/assets/teachers-team.jpg";
import heroImage from "@/assets/hero-classroom.jpg";

const About = () => {
  const values = [
    {
      icon: Heart,
      title: "Love & Care",
      description: "Every child is treated with warmth, respect, and individual attention",
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We maintain the highest standards in early childhood education",
    },
    {
      icon: Users,
      title: "Community",
      description: "Building strong relationships with families and our Kennesaw community",
    },
    {
      icon: Shield,
      title: "Safety First",
      description: "Secure facilities and trained staff ensure your child's wellbeing",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
            A Black-owned early learning center dedicated to nurturing the next generation 
            with love, quality education, and community values
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] rounded-lg overflow-hidden shadow-xl">
              <img 
                src={heroImage} 
                alt="Teachers and children learning together at Genesis Learning Academy" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-foreground mb-4">
                Genesis Learning Academy of Kennesaw was founded with a clear vision: to provide 
                exceptional early childhood education in an environment where diversity is celebrated 
                and every child feels valued.
              </p>
              <p className="text-muted-foreground mb-4">
                As a Black-owned and operated center, we take pride in creating a space where 
                children see themselves reflected in their educators and curriculum. We believe 
                representation matters, and our diverse team of passionate teachers brings unique 
                perspectives that enrich every child's learning experience.
              </p>
              <p className="text-muted-foreground">
                We're more than just a daycare – we're a community partner committed to supporting 
                Kennesaw families with flexible hours, affordable care, and a nurturing environment 
                where children truly thrive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-warmBg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do at Genesis Learning Academy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="border-none shadow-md hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
                    <value.icon className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Teachers Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
                Our Exceptional Teachers
              </h2>
              <p className="text-lg text-foreground mb-4">
                Our team of experienced, diverse Black educators brings passion, expertise, and 
                cultural awareness to every classroom. Each teacher is carefully selected for their 
                dedication to early childhood education and commitment to creating inclusive learning 
                environments.
              </p>
              <div className="space-y-3 text-muted-foreground mb-6">
                <p className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>State-certified early childhood educators</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>CPR and First Aid certified</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Ongoing professional development training</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Background checked and vetted</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Passionate about diversity and inclusion</span>
                </p>
              </div>
              <Button asChild variant="cta" size="lg">
                <Link to="/enroll">Join Our Community</Link>
              </Button>
            </div>
            <div className="relative h-[500px] rounded-lg overflow-hidden shadow-xl">
              <img 
                src={teachersTeam} 
                alt="Diverse team of Black educators at Genesis Learning Academy" 
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
            Visit Us Today
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            We'd love to show you around our facility and introduce you to our amazing team. 
            Schedule a tour or start your enrollment today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="cta" size="lg">
              <Link to="/enroll">Start Enrollment</Link>
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

export default About;
