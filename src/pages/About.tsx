import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, Shield, Users, Globe, BookOpen } from "lucide-react";
import teachersTeam from "@/assets/teachers-team-classroom.jpg";
import heroImage from "@/assets/outdoor-play-new.jpg";
import ownerImage from "@/assets/owner-ms-angelia.jpg";

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Safety First",
      description: "Secure facilities, trained staff, and comprehensive safety protocols give you peace of mind every day",
    },
    {
      icon: BookOpen,
      title: "Quality Learning",
      description: "Research-based curriculum tailored to each age group, fostering curiosity and school readiness",
    },
    {
      icon: Users,
      title: "Strong Community",
      description: "A welcoming environment where families connect, support each other, and feel truly at home",
    },
    {
      icon: Heart,
      title: "Open Communication",
      description: "Regular updates, daily reports, and ongoing dialogue keep you connected to your child's progress",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
            A nurturing childcare center in Kennesaw where every child feels safe, valued, and ready to learn
          </p>
        </div>
      </section>

      {/* Owner Section */}
      <section className="py-16 bg-warmBg">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center md:text-left">
            Meet Our Owner
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
            <div className="relative h-[500px] rounded-lg overflow-hidden shadow-xl">
              <img 
                src={ownerImage} 
                alt="Ms. Angelia, Owner and Director of Genesis Learning Academy" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary mb-4">Ms. Angelia</h3>
              <p className="text-lg font-semibold text-foreground mb-4">
                Owner & Director
              </p>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  As a mother of 5 children and 2 grandchildren, Ms. Angelia understands the importance of 
                  providing a nurturing and educational environment for young minds. She pursued her education 
                  at Clayton State University and Atlanta Area Technical College, where she completed courses 
                  in both business and education.
                </p>
                <p>
                  Ms. Angelia's passion for early education led her to establish Genesis Learning Academy in 
                  the heart of Kennesaw, GA. Her center has not only been a place of learning and growth for 
                  countless children but has also become a pillar of support within the community.
                </p>
                <p>
                  Through partnerships with organizations such as Family Promise and Must Ministry, Ms. Angelia 
                  has been actively involved in helping families in need. Her dedication to serving others and 
                  making a positive impact on the lives of children and families is truly commendable.
                </p>
                <p className="font-semibold text-foreground">
                  Genesis Learning Academy holds a significant place in history as the very first childcare 
                  center in Kennesaw, GA. Previously owned and operated by the late Carolyn Prewett for 25 years, 
                  Ms. Angelia continues to carry on the legacy of providing exceptional care and education to 
                  young learners.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center md:text-left">
            Our Mission
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="relative h-[400px] rounded-lg overflow-hidden shadow-xl">
              <img 
                src={heroImage} 
                alt="Teacher and child playing outdoors at Genesis Learning Academy" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-lg text-foreground mb-4">
                At Genesis Learning Academy, we believe every child deserves a strong foundation for success. 
                As a locally operated and Black-owned learning center, we are proud to serve families in the 
                Kennesaw community with exceptional early childhood education where your child feels safe, loved, 
                and inspired to learn.
              </p>
              <p className="text-muted-foreground mb-4">
                We understand that choosing childcare is one of the most important decisions you'll make as a parent. 
                That's why we've created a warm, structured environment where children develop at their own pace, 
                surrounded by caring teachers who celebrate their unique gifts and encourage their natural curiosity.
              </p>
              <p className="text-muted-foreground mb-4">
                Our age-appropriate curriculum focuses on hands-on learning experiences that build social, emotional, 
                and cognitive skills. From interactive play to early literacy activities, every moment is designed to 
                nurture growth and prepare children for future academic success.
              </p>
              <p className="text-muted-foreground">
                We believe in strong partnerships with families. Through daily communication, regular updates, and 
                open-door policies, we ensure you're always connected to your child's learning journey. Located 
                conveniently near Downtown Kennesaw and just minutes from I-75, we're here to support your family 
                with flexible hours and a welcoming community where your child can truly thrive.
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
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center md:text-left">
            Our Caring Teachers
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-lg text-foreground mb-4">
                Your child will be cared for by experienced educators who bring warmth, patience, and dedication 
                to every interaction. Our teachers are carefully selected for their qualifications, genuine love 
                of working with children, and commitment to creating a nurturing, supportive learning environment.
              </p>
              <div className="space-y-3 text-muted-foreground mb-6">
                <p className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Qualified early childhood educators with proven expertise</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>CPR and First Aid certified for your child's safety</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Background checked and thoroughly vetted</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Ongoing professional development and training</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Passionate about fostering each child's unique potential</span>
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
            Come Visit Us
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            We'd love to meet you and show you why families trust Genesis Learning Academy. 
            Schedule a tour or start enrollment today.
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
