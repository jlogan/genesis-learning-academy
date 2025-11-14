import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Baby, Smile, Palette, GraduationCap, Backpack } from "lucide-react";
import toddlerImage from "@/assets/toddler-program.jpg";
import preschoolImage from "@/assets/preschool-program.jpg";

const Programs = () => {
  const programs = [
    {
      icon: Baby,
      title: "Infants",
      ageRange: "0-12 months",
      description: "Gentle care for your youngest learners with focus on sensory development, bonding, and basic motor skills.",
      highlights: [
        "Safe, nurturing environment",
        "Individual feeding & sleeping schedules",
        "Daily parent communication",
        "Sensory exploration activities"
      ],
      image: toddlerImage,
    },
    {
      icon: Smile,
      title: "Toddlers",
      ageRange: "13-24 months",
      description: "Supporting early exploration and language development through play-based learning and social interaction.",
      highlights: [
        "Potty training support",
        "Language development activities",
        "Social skills building",
        "Creative art & music"
      ],
      image: toddlerImage,
    },
    {
      icon: Palette,
      title: "Preschool",
      ageRange: "3-4 years",
      description: "Structured learning activities that prepare children for Pre-K with emphasis on creativity and independence.",
      highlights: [
        "Early literacy & math concepts",
        "Hands-on science exploration",
        "Social & emotional learning",
        "Fine motor skill development"
      ],
      image: preschoolImage,
    },
    {
      icon: GraduationCap,
      title: "Pre-Kindergarten",
      ageRange: "4 years",
      description: "Comprehensive kindergarten readiness program focusing on academic skills and school preparation.",
      highlights: [
        "Kindergarten prep curriculum",
        "Reading & writing foundations",
        "Math & problem-solving",
        "Critical thinking skills"
      ],
      image: preschoolImage,
    },
    {
      icon: Backpack,
      title: "School-Age",
      ageRange: "5+ years",
      description: "Before and after school care with homework help, enrichment activities, and safe supervision.",
      highlights: [
        "Homework assistance",
        "STEM activities",
        "Sports & physical education",
        "Arts & crafts projects"
      ],
      image: preschoolImage,
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
            from infants through school-age
          </p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-12">
            {programs.map((program, index) => (
              <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className={`grid md:grid-cols-2 gap-0 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                  <div className={`relative h-64 md:h-auto ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                    <img 
                      src={program.image} 
                      alt={`${program.title} program at Genesis Learning Academy`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className={`p-8 ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                    <CardHeader className="p-0 mb-4">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                          <program.icon className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl text-primary">{program.title}</CardTitle>
                          <p className="text-sm font-medium text-accent">{program.ageRange}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                      <p className="text-foreground">{program.description}</p>
                      <div>
                        <h4 className="font-semibold text-primary mb-2">Program Highlights:</h4>
                        <ul className="space-y-2">
                          {program.highlights.map((highlight, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="text-accent mt-1">•</span>
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center bg-warmBg rounded-lg p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
              Find the Perfect Program for Your Child
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Not sure which program is right for your child? Contact us or submit an enrollment 
              form, and we'll help you find the best fit for your family's needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="cta" size="lg">
                <Link to="/enroll">Start Enrollment</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="tel:770-672-4255">Call Us: (770) 672-4255</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Programs;
