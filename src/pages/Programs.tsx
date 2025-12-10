import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Baby, Smile, Palette, GraduationCap, BookOpen, Brain, Users, Lightbulb, Sparkles, Backpack, Bus } from "lucide-react";
import infantImage from "@/assets/infant-gentle-beginnings.jpg";
import toddlerImage from "@/assets/toddler-little-adventures.jpg";
import twosImage from "@/assets/twos-mini-makers.jpg";
import preschoolImage from "@/assets/preschool-scholars.jpg";
import preKImage from "@/assets/child-learning-activity.jpg";
import headerBg from "@/assets/classroom-header-1.jpg";

const Programs = () => {
  const programs = [
    {
      icon: Baby,
      title: "Gentle Beginnings",
      subtitle: "Infants",
      ageRange: "0-12 months",
      description: "A calm and nurturing space for children who are starting their growth journey. We provide gentle, loving care that supports early bonding, sensory exploration, and developmental milestones in a secure environment.",
      image: infantImage,
    },
    {
      icon: Smile,
      title: "Little Adventures",
      subtitle: "Toddlers",
      ageRange: "13-24 months",
      description: "Discovering the world around them! Watch your little one thrive as they safely explore, develop language skills, and build friendships through hands-on play and creative discovery.",
      image: toddlerImage,
    },
    {
      icon: Palette,
      title: "Mini Makers",
      subtitle: "Twos",
      ageRange: "2-3 years",
      description: "Hands-on learning and creativity! Your child explores art, building, and imaginative play while developing independence, social skills, and early learning foundations in a supportive environment.",
      image: twosImage,
    },
    {
      icon: GraduationCap,
      title: "Preschool Scholars",
      subtitle: "Preschool",
      ageRange: "3-4 years",
      description: "Focused on growth and learning. Your child gains confidence and independence in a safe, supportive space through engaging activities that build early literacy, problem-solving skills, and positive peer relationships.",
      image: preschoolImage,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="relative bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16 overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${headerBg})` }}
        />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Programs</h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
            Quality education and care for children at every stage of development, 
            from infants through pre-kindergarten
          </p>
        </div>
      </section>

      {/* Creative Curriculum Section */}
      <section className="py-20 bg-warmBg">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                <BookOpen className="h-5 w-5" />
                <span className="font-semibold">Our Curriculum</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
                The Creative Curriculum®
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                We use The Creative Curriculum, a widely recognized research-based curriculum for early childhood education, 
                designed to support the development of infants, toddlers, and preschoolers through meaningful learning experiences.
              </p>
            </div>

            {/* What It Focuses On */}
            <div className="bg-background rounded-xl p-8 shadow-lg mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary">Learning Through Play & Exploration</h3>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                The Creative Curriculum emphasizes learning through play, hands-on exploration, and meaningful interactions. 
                It supports the whole child—not just academics—and is built around key developmental areas:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["Social-Emotional", "Physical", "Cognitive", "Literacy", "Mathematics", "Science", "Social Studies", "Art"].map((area, index) => (
                  <div key={index} className="bg-warmBg rounded-lg px-4 py-3 text-center">
                    <span className="text-sm font-medium text-foreground">{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How Children Learn & How Teachers Teach */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-none shadow-lg">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                      <Lightbulb className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-primary">How Children Learn</h3>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="text-accent mt-1">✓</span>
                      <span>Interest-based learning that sparks curiosity</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent mt-1">✓</span>
                      <span>Learning centers for hands-on exploration</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent mt-1">✓</span>
                      <span>Teacher-guided and child-initiated experiences</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent mt-1">✓</span>
                      <span>Daily routines that promote independence</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-primary">How Our Teachers Teach</h3>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="text-accent mt-1">✓</span>
                      <span>Observe and document children's learning</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent mt-1">✓</span>
                      <span>Plan lessons based on interests and developmental levels</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent mt-1">✓</span>
                      <span>Adapt activities for different learning styles</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent mt-1">✓</span>
                      <span>Build strong teacher-child relationships</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Our Programs</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Quality education and care tailored to each stage of development
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {programs.map((program, index) => (
              <Card key={index} className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover-scale">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={program.image} 
                    alt={`${program.title} program at Genesis Learning Academy`}
                    className="w-full h-full object-cover object-[center_30%]"
                  />
                  <div className="absolute top-4 left-4 bg-primary/90 text-primary-foreground px-4 py-2 rounded-full">
                    <div className="flex items-center gap-2">
                      <program.icon className="h-5 w-5" />
                      <span className="font-semibold">{program.ageRange}</span>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-1">
                    {program.title}
                  </h3>
                  <p className="text-sm text-accent font-medium mb-3">{program.subtitle}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {program.description}
                  </p>
                  <Button asChild variant="cta" size="sm" className="w-full">
                    <Link to="/enroll">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Junior Achievers Program */}
      <section className="py-20 bg-warmBg">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
              <div className="relative">
                <img 
                  src={preKImage} 
                  alt="Junior Achievers Afterschool Program" 
                  className="rounded-xl shadow-xl w-full h-80 object-cover object-[center_40%]"
                />
                <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg">
                  <div className="flex items-center gap-2">
                    <Backpack className="h-5 w-5" />
                    <span className="font-bold">Ages 5-12</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                  <Backpack className="h-5 w-5" />
                  <span className="font-semibold">Afterschool & Summer Camp</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                  Junior Achievers Program
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  A fun and engaging enrichment program for elementary school children. Our goal is to spark curiosity, 
                  foster creativity, and build confidence while supporting early learning and school readiness.
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-background rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-primary mb-2">Confidence Building</h4>
                    <p className="text-sm text-muted-foreground">Independence and self-assurance</p>
                  </div>
                  <div className="bg-background rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-primary mb-2">STEM Activities</h4>
                    <p className="text-sm text-muted-foreground">Hands-on learning experiences</p>
                  </div>
                  <div className="bg-background rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-primary mb-2">Teamwork</h4>
                    <p className="text-sm text-muted-foreground">Collaborative skill building</p>
                  </div>
                  <div className="bg-background rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-primary mb-2">Problem Solving</h4>
                    <p className="text-sm text-muted-foreground">Puzzles, games & challenges</p>
                  </div>
                </div>

                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Bus className="h-6 w-6 text-accent" />
                    <div>
                      <h4 className="font-semibold text-primary">School Pickup Available</h4>
                      <p className="text-sm text-muted-foreground">We pick up from nearby elementary schools</p>
                    </div>
                  </div>
                </div>

                <Button asChild variant="cta" size="lg">
                  <Link to="/enroll">Enroll in Junior Achievers</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background border-t">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Join our Kennesaw daycare family and give your child the foundation for lifelong success
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="cta" size="lg" className="w-full sm:w-auto min-w-[160px]">
              <Link to="/enroll">Enroll Now</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto min-w-[160px]">
              <a href="tel:770-672-4255">Call: (770) 672-4255</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Programs;