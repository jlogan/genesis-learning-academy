import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Baby, Smile, Palette, GraduationCap } from "lucide-react";
import infantImage from "@/assets/infant-program.jpg";
import toddlerImage from "@/assets/child-construction-play.jpg";
import preschoolImage from "@/assets/child-sensory-table.jpg";
import preKImage from "@/assets/child-learning-activity.jpg";

const Programs = () => {
  const programs = [
    {
      icon: Baby,
      title: "Infants",
      ageRange: "0-12 months",
      description: "Your baby's safety and comfort come first. We provide gentle, nurturing care that supports early bonding, sensory exploration, and developmental milestones in a secure, loving environment.",
      image: infantImage,
    },
    {
      icon: Smile,
      title: "Toddlers",
      ageRange: "13-24 months",
      description: "Watch your little one thrive as they safely explore, develop language skills, and build friendships. Our nurturing teachers guide social-emotional growth through hands-on play and creative discovery.",
      image: toddlerImage,
    },
    {
      icon: Palette,
      title: "Preschool",
      ageRange: "3-4 years",
      description: "Your child gains confidence and independence in a safe, supportive space. We nurture curiosity through engaging activities that build early literacy, problem-solving skills, and positive peer relationships.",
      image: preschoolImage,
    },
    {
      icon: GraduationCap,
      title: "Pre-Kindergarten",
      ageRange: "4-5 years",
      description: "Prepare your child for kindergarten success with confidence. Our caring educators foster academic readiness, critical thinking, and social skills in a structured yet nurturing environment that celebrates each child's growth.",
      image: preKImage,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Programs</h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
            Quality education and care for children at every stage of development, 
            from infants through pre-kindergarten
          </p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-16 bg-warmBg">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {programs.map((program, index) => (
              <Card key={index} className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover-scale">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={program.image} 
                    alt={`${program.title} program at Genesis Learning Academy`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-primary/90 text-primary-foreground px-4 py-2 rounded-full">
                    <div className="flex items-center gap-2">
                      <program.icon className="h-5 w-5" />
                      <span className="font-semibold">{program.ageRange}</span>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-primary mb-3">
                    {program.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {program.description}
                  </p>
                  <Button asChild variant="cta" size="lg" className="w-full">
                    <Link to="/enroll">Start Enrollment</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-background border-t">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join our Kennesaw daycare family and give your child the foundation for lifelong success
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="cta" size="lg">
              <Link to="/enroll">Enroll Now</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="tel:770-123-4567">Call Us: (770) 123-4567</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Programs;
