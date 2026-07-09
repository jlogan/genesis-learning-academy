import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { trackContactSubmission } from "@/utils/analytics";
import { CalendarDays, Clock, MapPin, Phone, Send } from "lucide-react";

type ContactFormState = {
  parentName: string;
  email: string;
  phone: string;
  childAge: string;
  interest: string;
  message: string;
};

const initialFormState: ContactFormState = {
  parentName: "",
  email: "",
  phone: "",
  childAge: "",
  interest: "Schedule a visit",
  message: "",
};

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof ContactFormState, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Unable to send your message right now.");
      }

      trackContactSubmission({
        parentName: formData.parentName,
        email: formData.email,
        interest: formData.interest,
      });

      toast({
        title: "Thanks — we received your message.",
        description: "Genesis Learning Academy will follow up with you shortly.",
      });
      setFormData(initialFormState);
    } catch (error) {
      toast({
        title: "Message not sent",
        description:
          error instanceof Error
            ? `${error.message} Please call us at (770) 672-4255.`
            : "Please call us at (770) 672-4255.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-warmBg">
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Ask a Question or Schedule a Visit</h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto leading-relaxed">
            Not ready to enroll yet? That is okay. Call us or send a quick note and we will help you learn more about Genesis Learning Academy.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="lg:col-span-1 space-y-4">
              <Card className="shadow-lg border-none">
                <CardContent className="p-6 space-y-5">
                  <h2 className="text-2xl font-bold text-primary">Contact Genesis</h2>
                  <a href="tel:770-672-4255" className="flex items-center gap-3 text-foreground hover:text-primary transition-colors">
                    <Phone className="h-5 w-5 text-accent" />
                    <span className="font-semibold">(770) 672-4255</span>
                  </a>
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <MapPin className="h-5 w-5 text-accent mt-1" />
                    <span>2098 Carruth St NW<br />Kennesaw, GA 30144</span>
                  </div>
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <Clock className="h-5 w-5 text-accent mt-1" />
                    <span>Monday-Friday<br />6:30 AM - 6:00 PM</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-none bg-primary text-primary-foreground">
                <CardContent className="p-6">
                  <CalendarDays className="h-8 w-8 mb-3 text-accent" />
                  <h3 className="text-xl font-bold mb-2">A visit is the easiest first step.</h3>
                  <p className="text-primary-foreground/85">
                    Tour the classrooms, meet the team, and ask questions before filling out the full enrollment packet.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="lg:col-span-2 shadow-xl border-none">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">Send Us a Message</h2>
                <p className="text-muted-foreground mb-6">
                  Use this form for questions, program availability, tuition details, or to request a visit.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-foreground">Parent/Guardian Name *</span>
                      <input
                        required
                        value={formData.parentName}
                        onChange={(event) => handleChange("parentName", event.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-foreground">Email *</span>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(event) => handleChange("email", event.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-foreground">Phone</span>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(event) => handleChange("phone", event.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-foreground">Child's Age / Program Interest</span>
                      <input
                        value={formData.childAge}
                        onChange={(event) => handleChange("childAge", event.target.value)}
                        placeholder="Infant, toddler, Pre-K, afterschool, etc."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>
                  </div>

                  <label className="space-y-2 block">
                    <span className="text-sm font-semibold text-foreground">How can we help? *</span>
                    <select
                      required
                      value={formData.interest}
                      onChange={(event) => handleChange("interest", event.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option>Schedule a visit</option>
                      <option>Ask a question</option>
                      <option>Check program availability</option>
                      <option>Discuss tuition or fees</option>
                      <option>I am ready for enrollment next steps</option>
                    </select>
                  </label>

                  <label className="space-y-2 block">
                    <span className="text-sm font-semibold text-foreground">Message *</span>
                    <textarea
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(event) => handleChange("message", event.target.value)}
                      placeholder="Tell us what questions you have or when you would like to visit."
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="submit" variant="cta" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                      {isSubmitting ? "Sending..." : "Send Message"}
                      <Send className="ml-2 h-4 w-4" />
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                      <a href="tel:770-672-4255">Call Instead</a>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
