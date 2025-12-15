import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const Tuition = () => {
  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Tuition & Fees</h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
            Quality child care in Kennesaw
          </p>
        </div>
      </section>

      {/* Call Us Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="shadow-lg max-w-2xl mx-auto">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
                <Phone className="h-10 w-10 text-accent" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
                Call Us for Current Tuition Rates
              </h2>
              
              <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-lg mx-auto">
                For the most up-to-date tuition and fee information, please call our front office and we'll be happy to assist you.
              </p>

              <Button 
                asChild 
                size="lg" 
                className="text-lg px-8 py-6 h-auto"
              >
                <a href="tel:770-672-4255">
                  <Phone className="mr-2 h-5 w-5" />
                  Call Now: (770) 672-4255
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Tuition;
