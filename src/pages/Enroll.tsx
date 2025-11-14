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
import { toast } from "sonner";
import heroImage from "@/assets/hero-classroom.jpg";

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
    toast.success("Enrollment form submitted successfully!");
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
          <p className="text-xl mb-2">Your enrollment form has been submitted successfully.</p>
          <p className="text-primary-foreground/90 mb-8 max-w-md mx-auto">
            We'll review your application and contact you within 1-2 business days to discuss 
            next steps and schedule a tour.
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
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Enrollment Form</h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Start your child's journey with Genesis Learning Academy today
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Complete Your Application</CardTitle>
              <CardDescription>
                Fill out the form below and we'll contact you to discuss enrollment and schedule a tour.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Parent Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary">Parent/Guardian Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="parentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
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
                            <FormLabel>Phone Number *</FormLabel>
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
              <div className="space-y-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Children Information</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ childName: "", childAge: "", preferredStartDate: "" })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Child
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">Child {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-destructive hover:text-destructive"
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
                          <FormLabel>Child's Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Child's full name" {...field} />
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
                          <FormLabel>Child's Age Group *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select age group" />
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
                          <FormLabel>Preferred Start Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>

              {/* Additional Information */}
              <div className="space-y-4 pt-6 border-t border-border">
                    <h3 className="text-lg font-semibold text-primary">Additional Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="languagePreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language Preference *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
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
                          <FormLabel>Additional Information or Questions (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us anything else we should know about your child or family..."
                              className="resize-none h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" variant="cta" size="lg" className="w-full">
                      Submit Enrollment Form
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="mt-8 text-center text-muted-foreground">
            <p className="mb-2">Need help with enrollment? Call us at:</p>
            <a href="tel:770-672-4255" className="text-primary font-semibold text-lg hover:text-accent">
              (770) 672-4255
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Enroll;
