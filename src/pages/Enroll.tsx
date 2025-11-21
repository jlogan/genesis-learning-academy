import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import heroImage from "@/assets/hero-classroom.jpg";
import academySign from "@/assets/academy-sign.png";

const childSchema = z.object({
  childName: z.string().trim().min(2, "Child's name must be at least 2 characters").max(100, "Name too long"),
  childAge: z.string().min(1, "Please select age"),
  preferredStartDate: z.string().min(1, "Please select start date"),
});

const enrollmentSchema = z.object({
  parentName: z.string().trim().min(2, "Parent name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  phone: z.string().trim().min(10, "Please enter a valid phone number").max(20, "Phone number too long"),
  children: z.array(childSchema).min(1, "Please add at least one child"),
  languagePreference: z.string().min(1, "Please select a language preference"),
  additionalInfo: z.string().max(1000, "Message too long").optional(),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

const Enroll = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      parentName: "",
      email: "",
      phone: "",
      children: [{ childName: "", childAge: "", preferredStartDate: "" }],
      languagePreference: "",
      additionalInfo: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "children",
  });

  const onSubmit = (data: EnrollmentFormData) => {
    console.log("Enrollment form submitted:", data);
    toast({
      title: "Thank you!",
      description: "Your enrollment request has been received. A member of our team will reach out shortly.",
    });
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-primary/90" />
        <div className="relative z-10 text-center text-primary-foreground px-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent mb-6">
            <CheckCircle2 className="w-12 h-12 text-accent-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Thank You!</h1>
          <p className="text-xl mb-2">Your enrollment request has been received.</p>
          <p className="text-primary-foreground/90 mb-8 max-w-md mx-auto">
            A member of our team will reach out shortly to discuss next steps and answer any questions you may have.
          </p>
          <Button 
            variant="cta" 
            size="lg"
            onClick={() => window.location.href = "/"}
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warmBg">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Start Enrollment</h1>
          <p className="text-lg text-primary-foreground/95 leading-relaxed">
            Submit your information below and our enrollment team will contact you within 24 hours to answer your questions and schedule a tour of our facility.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="shadow-lg border-border/50">
            <CardContent className="p-8 md:p-12">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                  {/* Parent Information */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Parent or Guardian</h3>
                      <p className="text-sm text-muted-foreground">Please provide your contact information</p>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="parentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Your Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Jane Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your.email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Phone Number *</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="(770) 555-1234" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

              {/* Children Information */}
              <div className="space-y-6 pt-10 border-t border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Child Information</h3>
                    <p className="text-sm text-muted-foreground">Add each child you'd like to enroll</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={() => append({ childName: "", childAge: "", preferredStartDate: "" })}
                    className="w-full sm:w-auto border-primary/30 hover:bg-primary/5"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Child
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id} className="border-2 border-border/60 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 space-y-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-foreground">Child {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => remove(index)}
                          className="hover:bg-destructive/90"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`children.${index}.childName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Child's Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Michael Johnson" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`children.${index}.childAge`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Age Group *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your child's age group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0-12m">Infants (0-12 months)</SelectItem>
                              <SelectItem value="13-24m">Toddlers (13-24 months)</SelectItem>
                              <SelectItem value="3-4y">Preschool (3-4 years)</SelectItem>
                              <SelectItem value="4y">Pre-K (4 years)</SelectItem>
                              <SelectItem value="5+">School-Age (5+ years)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`children.${index}.preferredStartDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">When would you like to start? *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Additional Information */}
              <div className="space-y-6 pt-10 border-t border-border/50">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Additional Details</h3>
                  <p className="text-sm text-muted-foreground">Help us better understand your needs</p>
                </div>
                    
                    <FormField
                      control={form.control}
                      name="languagePreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Preferred Language *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your preferred language" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="english">English</SelectItem>
                              <SelectItem value="spanish">Spanish</SelectItem>
                              <SelectItem value="bilingual">Bilingual (English/Spanish)</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="additionalInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Anything else we should know? (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Share any special needs, allergies, schedules, or questions you have..."
                              className="resize-none h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-8">
                    <Button type="submit" variant="cta" size="lg" className="w-full text-lg py-6">
                      Submit Enrollment Request
                    </Button>
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      By submitting, you agree to be contacted by our team
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="mt-12 p-6 bg-muted/30 rounded-lg border border-border/50 text-center">
            <p className="text-muted-foreground mb-3">Questions about enrollment?</p>
            <a href="tel:770-672-4255" className="text-primary font-semibold text-xl hover:text-accent transition-colors">
              (770) 672-4255
            </a>
          </div>

          {/* Location Section with Map and Sign */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Visit Our Academy</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={academySign} 
                  alt="Genesis Learning Academy of Kennesaw Sign" 
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg h-[400px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3308.9!2d-84.6157!3d34.0234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88f57b0c7d8e8e8d%3A0x1234567890abcdef!2s2098%20Carruth%20St%20NW%2C%20Kennesaw%2C%20GA%2030144!5e0!3m2!1sen!2sus!4v1234567890123"
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
        </div>
      </section>
    </div>
  );
};

export default Enroll;
