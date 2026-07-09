import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
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
  FormDescription,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Baby,
  User,
  Phone,
  CreditCard,
  Heart,
  Shield,
  Camera,
  Bus,
  Home,
  FileCheck,
  ClipboardList,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import heroImage from "@/assets/hero-classroom.jpg";
import { trackEnrollmentSubmission } from "@/utils/analytics";
import {
  fullEnrollmentSchema,
  STEP_TITLES,
  type EnrollmentFormData,
  childInfoSchema,
  parentGuardianSchema,
  emergencyContactsSchema,
  paymentPoliciesSchema,
  medicalInfoSchema,
  policiesConsentSchema,
  photoMediaSchema,
  infantInfoSchema,
  cacfpSchema,
  transportationSchema,
  aboutFamilySchema,
} from "@/types/enrollment";

// ─── Constants ─────────────────────────────────────────────────────────
const STORAGE_KEY = "gla-enrollment-draft";
const TOTAL_STEPS = 12;

const STEP_ICONS = [
  Baby, User, Phone, CreditCard, Heart, Shield, Camera, Baby, ClipboardList, Bus, Home, FileCheck,
];

const PAYMENT_POLICIES = [
  {
    key: "ackHoursOvertime" as const,
    title: "Hours & Overtime",
    text: "Operating hours are Monday–Friday, 6:30 AM – 6:30 PM. A late fee of $5.00 per minute will be assessed for each minute a child remains at the center after closing time or beyond contracted hours.",
  },
  {
    key: "ackPaymentDeadline" as const,
    title: "Payment Deadline",
    text: "Tuition payments are due every Monday before the start of the service week. If payment is not received by Tuesday morning, the child may not attend until the balance is paid in full.",
  },
  {
    key: "ackRegistrationFee" as const,
    title: "Annual Registration Fee",
    text: "An annual, non-refundable registration fee of $100.00 per child is due each January and upon initial enrollment.",
  },
  {
    key: "ackVacationPolicy" as const,
    title: "Vacation Policy",
    text: "After one year of continuous enrollment, families are eligible for one week of vacation at half the regular tuition rate. Vacation must be requested in writing at least two weeks in advance.",
  },
  {
    key: "ackNoAbsenceDiscounts" as const,
    title: "No Absence Discounts",
    text: "No discounts, credits, or refunds are given for absences, holidays, sick days, or closures due to inclement weather.",
  },
  {
    key: "ackDisenrollmentNotice" as const,
    title: "Disenrollment Notice",
    text: "A minimum of two weeks' written notice is required prior to withdrawing a child from the program. Failure to provide notice will result in a charge of two weeks' tuition.",
  },
  {
    key: "ackAgeGrouping" as const,
    title: "Age Grouping Policy",
    text: "Genesis Learning Academy serves children from 6 weeks through 12 years of age. Children are grouped based on age and developmental stage.",
  },
  {
    key: "ackEscortPolicy" as const,
    title: "Escort Policy",
    text: "All children must be escorted into and out of the building by a parent, guardian, or authorized adult. Children may not enter or leave the building unattended at any time.",
  },
];

// ─── Default Form Values ───────────────────────────────────────────────
function getDefaultValues(): EnrollmentFormData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* use defaults */ }
  return {
    childInfo: {
      childFullName: "", childBirthDate: "", childSex: "", childNickName: "",
      childHomeAddress: "", childCity: "", childState: "", childZipCode: "", childHomePhone: "",
    },
    parentGuardian: {
      parent1: {
        fullName: "", birthDate: "", homePhone: "", cellPhone: "", homeAddress: "",
        city: "", state: "", zipCode: "", occupation: "", workPhone: "", workHours: "",
        employerName: "", employerAddress: "", email: "",
      },
      parent2: {
        fullName: "", birthDate: "", homePhone: "", cellPhone: "", homeAddress: "",
        city: "", state: "", zipCode: "", occupation: "", workPhone: "", workHours: "",
        employerName: "", employerAddress: "", email: "",
      },
      legalCustodyParent: "",
      parentalStatus: "",
      otherHouseholdMembers: [
        { name: "", age: "", relationship: "" },
        { name: "", age: "", relationship: "" },
        { name: "", age: "", relationship: "" },
        { name: "", age: "", relationship: "" },
      ],
    },
    emergencyContacts: {
      emergencyContact1: { name: "", homeCell: "", workPhone: "", relationship: "", address: "", cityStateZip: "" },
      emergencyContact2: { name: "", homeCell: "", workPhone: "", relationship: "", address: "", cityStateZip: "" },
      authorizedPickup1: { name: "", relationship: "", homeCell: "", address: "" },
      authorizedPickup2: { name: "", relationship: "", homeCell: "", address: "" },
      kidCode: "",
      unauthorizedPickup1: { name: "", comment: "" },
      unauthorizedPickup2: { name: "", comment: "" },
    },
    paymentPolicies: {
      ackHoursOvertime: false, ackPaymentDeadline: false, ackRegistrationFee: false,
      ackVacationPolicy: false, ackNoAbsenceDiscounts: false, ackDisenrollmentNotice: false,
      ackAgeGrouping: false, ackEscortPolicy: false,
      isAfterSchool: false, ackTransportationFee: false, ackDayServicePayment: false,
    },
    medicalInfo: {
      physicianName: "", physicianPhone: "", preferredHospital: "", hospitalPhone: "",
      regularMedications: "", bloodType: "", medicalAllergies: "", foodAllergies: "",
      otherAllergies: "", specialHealthConditions: "", ackEmergencyMedicalCare: false,
    },
    policiesConsent: {
      ackNoLiabilityInsurance: false, ackChildCombination: false,
      topicalBabyWipes: false, topicalBandAids: false, topicalNeosporin: false,
      topicalBactine: false, topicalSunscreen: false, topicalInsectRepellent: false,
      topicalNonRxOintment: false, topicalBabyPowder: false, topicalOther: false,
      topicalOtherSpecify: "",
    },
    photoMedia: { photoAuthorization: "" },
    infantInfo: {
      ackSafeSleep: false,
      takesBottle: "", bottleWarmed: "", holdsOwnBottle: "", feedsSelf: "",
      foodStrained: false, foodBaby: false, foodFormula: false, foodWholeMilk: false,
      foodTable: false, foodOther: false, foodOtherSpecify: "",
      formulaType: "", formulaAmount: "", formulaSchedule: "",
      pacifierUse: "", pacifierWhen: "",
      devRollOver: "", devSitAlone: "", devCrawl: "", devWalk: "",
      foodLikes: "", foodDislikes: "", foodAllergiesInfant: "",
      solidFoodsInstructions: "", formulaOption: "",
    },
    cacfp: {
      optOutMedicaidSharing: false, snapTanfCase: "",
      catHeadStart: false, catFosterChild: false, catMigrant: false,
      catRunaway: false, catHomeless: false,
      householdIncome: "", householdSize: "",
      ethnicHispanic: "",
      raceAmericanIndian: false, raceAsian: false, raceBlack: false,
      raceHawaiian: false, raceWhite: false,
      mealBreakfast: false, mealAMSnack: false, mealLunch: false,
      mealPMSnack: false, mealSupper: false, mealEveningSnack: false,
      dayMon: false, dayTue: false, dayWed: false, dayThu: false, dayFri: false, daySat: false,
      hoursOfAttendance: "",
    },
    transportation: {
      transFatherName: "", transFatherPhone: "", transMotherName: "", transMotherPhone: "",
      transEmergencyContact: "", transEmergencyPhone: "", transDoctorName: "", transDoctorPhone: "",
      transPickupLocation: "", transDeliveryLocation: "", transPickupTime: "", transDeliveryTime: "",
      transDayMon: false, transDayTue: false, transDayWed: false, transDayThu: false, transDayFri: false,
      transAuthorizedPerson: "",
    },
    aboutFamily: {
      familyMembers: "", familyBirthday: "", familyActivities: "", familyStrengths: "",
      familyWorkOn: "", familyMedicalNeeds: "", familyOtherInfo: "",
    },
  };
}

// ─── Helper: Check if child is infant (<2 years) ──────────────────────
function isInfant(birthDate: string): boolean {
  if (!birthDate) return false;
  const birth = new Date(birthDate);
  const now = new Date();
  const ageMs = now.getTime() - birth.getTime();
  const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
  return ageYears < 2;
}

// ─── Reusable Field Components ─────────────────────────────────────────
function TextField({
  form, name, label, placeholder, type = "text", required = false, className = "",
}: {
  form: any; name: string; label: string; placeholder?: string; type?: string; required?: boolean; className?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}{required && " *"}</FormLabel>
          <FormControl>
            <Input type={type} placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CheckboxField({
  form, name, label, description,
}: {
  form: any; name: string; label: string; description?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="text-sm font-normal">{label}</FormLabel>
            {description && <FormDescription className="text-xs">{description}</FormDescription>}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function YesNoSelect({ form, name, label }: { form: any; name: string; label: string }) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ─── Step Components ───────────────────────────────────────────────────

function Step1ChildInfo({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-1">Child Information</h3>
        <p className="text-sm text-muted-foreground">Basic details about the child being enrolled</p>
      </div>
      <TextField form={form} name="childInfo.childFullName" label="Child's Full Name" placeholder="First Middle Last" required />
      <div className="grid md:grid-cols-3 gap-4">
        <TextField form={form} name="childInfo.childBirthDate" label="Birth Date" type="date" required />
        <FormField
          control={form.control}
          name="childInfo.childSex"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sex *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <TextField form={form} name="childInfo.childNickName" label="Nick Name" placeholder="Optional" />
      </div>
      <TextField form={form} name="childInfo.childHomeAddress" label="Home Address" placeholder="Street Address" required />
      <div className="grid md:grid-cols-3 gap-4">
        <TextField form={form} name="childInfo.childCity" label="City" required />
        <TextField form={form} name="childInfo.childState" label="State" required />
        <TextField form={form} name="childInfo.childZipCode" label="Zip Code" required />
      </div>
      <TextField form={form} name="childInfo.childHomePhone" label="Home Phone" type="tel" placeholder="(770) 555-1234" />
    </div>
  );
}

function ParentFields({ form, prefix, label, required = false }: { form: any; prefix: string; label: string; required?: boolean }) {
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-foreground">{label}</h4>
      <TextField form={form} name={`${prefix}.fullName`} label="Full Name" required={required} />
      <div className="grid md:grid-cols-2 gap-4">
        <TextField form={form} name={`${prefix}.birthDate`} label="Birth Date" type="date" />
        <TextField form={form} name={`${prefix}.email`} label="Email" type="email" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <TextField form={form} name={`${prefix}.homePhone`} label="Home Phone" type="tel" />
        <TextField form={form} name={`${prefix}.cellPhone`} label="Cell #" type="tel" required={required} />
      </div>
      <TextField form={form} name={`${prefix}.homeAddress`} label="Home Address" />
      <div className="grid md:grid-cols-3 gap-4">
        <TextField form={form} name={`${prefix}.city`} label="City" />
        <TextField form={form} name={`${prefix}.state`} label="State" />
        <TextField form={form} name={`${prefix}.zipCode`} label="Zip Code" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <TextField form={form} name={`${prefix}.occupation`} label="Occupation" />
        <TextField form={form} name={`${prefix}.workPhone`} label="Work Phone" type="tel" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <TextField form={form} name={`${prefix}.workHours`} label="Work Hours" placeholder="e.g., 8AM - 5PM" />
        <TextField form={form} name={`${prefix}.employerName`} label="Employer Name" />
      </div>
      <TextField form={form} name={`${prefix}.employerAddress`} label="Employer Address" />
    </div>
  );
}

function Step2ParentGuardian({ form }: { form: any }) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-1">Parent/Guardian Information</h3>
        <p className="text-sm text-muted-foreground">Contact details for parents or legal guardians</p>
      </div>
      <ParentFields form={form} prefix="parentGuardian.parent1" label="1st Parent/Guardian" required />
      <Separator />
      <ParentFields form={form} prefix="parentGuardian.parent2" label="2nd Parent/Guardian (Optional)" />
      <Separator />
      <TextField form={form} name="parentGuardian.legalCustodyParent" label="Parent/Guardian with Legal Custody" />
      <FormField
        control={form.control}
        name="parentGuardian.parentalStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Parental Status *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="living_together">Living Together</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="separated">Separated</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-foreground">Other Household Members</h4>
        <p className="text-sm text-muted-foreground">List other people living in the household</p>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="grid md:grid-cols-3 gap-3">
            <TextField form={form} name={`parentGuardian.otherHouseholdMembers.${i}.name`} label={`Member ${i + 1} Name`} />
            <TextField form={form} name={`parentGuardian.otherHouseholdMembers.${i}.age`} label="Age" />
            <TextField form={form} name={`parentGuardian.otherHouseholdMembers.${i}.relationship`} label="Relationship" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Step3EmergencyContacts({ form }: { form: any }) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-1">Emergency Contacts & Pickup Authorization</h3>
        <p className="text-sm text-muted-foreground">People we can contact in an emergency and who may pick up your child</p>
      </div>
      {[1, 2].map((n) => (
        <div key={n} className="space-y-4">
          <h4 className="text-lg font-semibold">Emergency Contact #{n}{n === 1 ? " *" : ""}</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <TextField form={form} name={`emergencyContacts.emergencyContact${n}.name`} label="Name" required={n === 1} />
            <TextField form={form} name={`emergencyContacts.emergencyContact${n}.homeCell`} label="Home/Cell #" type="tel" required={n === 1} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <TextField form={form} name={`emergencyContacts.emergencyContact${n}.workPhone`} label="Work Phone" type="tel" />
            <TextField form={form} name={`emergencyContacts.emergencyContact${n}.relationship`} label="Relationship" />
          </div>
          <TextField form={form} name={`emergencyContacts.emergencyContact${n}.address`} label="Address" />
          <TextField form={form} name={`emergencyContacts.emergencyContact${n}.cityStateZip`} label="City, State, Zip" />
          {n === 1 && <Separator />}
        </div>
      ))}
      <Separator />
      <h4 className="text-lg font-semibold">Authorized Pickup Persons</h4>
      <p className="text-sm text-muted-foreground">Besides parents, who is authorized to pick up your child?</p>
      {[1, 2].map((n) => (
        <div key={n} className="space-y-4">
          <h5 className="font-medium">Authorized Person #{n}</h5>
          <div className="grid md:grid-cols-2 gap-4">
            <TextField form={form} name={`emergencyContacts.authorizedPickup${n}.name`} label="Name" />
            <TextField form={form} name={`emergencyContacts.authorizedPickup${n}.relationship`} label="Relationship" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <TextField form={form} name={`emergencyContacts.authorizedPickup${n}.homeCell`} label="Home/Cell #" type="tel" />
            <TextField form={form} name={`emergencyContacts.authorizedPickup${n}.address`} label="Address" />
          </div>
        </div>
      ))}
      <Separator />
      <div className="space-y-4">
        <TextField form={form} name="emergencyContacts.kidCode" label="Kid Code (Secret Pickup Word)" placeholder="A secret word your child knows for safe pickup" required />
        <p className="text-xs text-muted-foreground">This word will be used to verify authorized pickups when someone other than a parent picks up your child.</p>
      </div>
      <Separator />
      <h4 className="text-lg font-semibold">Unauthorized Pickup Persons</h4>
      <p className="text-sm text-muted-foreground">People who should NOT be allowed to pick up your child</p>
      {[1, 2].map((n) => (
        <div key={n} className="grid md:grid-cols-2 gap-4">
          <TextField form={form} name={`emergencyContacts.unauthorizedPickup${n}.name`} label={`Person ${n} Name`} />
          <TextField form={form} name={`emergencyContacts.unauthorizedPickup${n}.comment`} label="Comment/Reason" />
        </div>
      ))}
    </div>
  );
}

function Step4PaymentPolicies({ form }: { form: any }) {
  const isAfterSchool = useWatch({ control: form.control, name: "paymentPolicies.isAfterSchool" });
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-1">Payment Policies & Acknowledgments</h3>
        <p className="text-sm text-muted-foreground">Please read and acknowledge each policy</p>
      </div>
      {PAYMENT_POLICIES.map((policy) => (
        <Card key={policy.key} className="border-border/60">
          <CardContent className="p-4 space-y-3">
            <h4 className="font-semibold text-sm">{policy.title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{policy.text}</p>
            <FormField
              control={form.control}
              name={`paymentPolicies.${policy.key}`}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="text-sm font-medium text-primary">I acknowledge and agree *</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      ))}
      <Separator />
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">After-School Program</h4>
        <CheckboxField form={form} name="paymentPolicies.isAfterSchool" label="My child will participate in the after-school program" />
        {isAfterSchool && (
          <div className="ml-6 space-y-3">
            <Card className="border-border/60">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground">A transportation fee of $20.00 will be charged for each no-show (when the child is not at school for pickup but transportation was arranged).</p>
                <CheckboxField form={form} name="paymentPolicies.ackTransportationFee" label="I acknowledge the transportation no-show fee *" />
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground">Payment for day service is required in advance and is non-refundable for days of absence.</p>
                <CheckboxField form={form} name="paymentPolicies.ackDayServicePayment" label="I acknowledge the day service payment policy *" />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function Step5MedicalInfo({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-1">Medical & Emergency Information</h3>
        <p className="text-sm text-muted-foreground">Medical details to ensure your child's safety and well-being</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <TextField form={form} name="medicalInfo.physicianName" label="Child's Physician Name" />
        <TextField form={form} name="medicalInfo.physicianPhone" label="Physician Phone" type="tel" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <TextField form={form} name="medicalInfo.preferredHospital" label="Preferred Hospital" />
        <TextField form={form} name="medicalInfo.hospitalPhone" label="Hospital Phone" type="tel" />
      </div>
      <TextField form={form} name="medicalInfo.regularMedications" label="Regular Medications" placeholder="List any medications your child takes regularly" />
      <div className="grid md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="medicalInfo.bloodType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Blood Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select if known" /></SelectTrigger></FormControl>
                <SelectContent>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <TextField form={form} name="medicalInfo.medicalAllergies" label="Medical Allergies" placeholder="e.g., Penicillin, Latex" />
      <TextField form={form} name="medicalInfo.foodAllergies" label="Food Allergies" placeholder="e.g., Peanuts, Dairy, Gluten" />
      <TextField form={form} name="medicalInfo.otherAllergies" label="Other Allergies" placeholder="e.g., Bee stings, Seasonal" />
      <FormField
        control={form.control}
        name="medicalInfo.specialHealthConditions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Special Health Conditions</FormLabel>
            <FormControl>
              <Textarea placeholder="Asthma, seizures, diabetes, or other conditions we should know about" className="resize-none h-24" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Separator />
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <h4 className="font-semibold">Emergency Medical Care Authorization</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            In the event of a medical emergency, I authorize Genesis Learning Academy to seek emergency medical treatment for my child, including but not limited to calling 911, transporting to the nearest hospital, and consenting to necessary medical procedures if I or my emergency contacts cannot be reached.
          </p>
          <FormField
            control={form.control}
            name="medicalInfo.ackEmergencyMedicalCare"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="text-sm font-medium text-primary">I authorize emergency medical care for my child *</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Step6PoliciesConsent({ form }: { form: any }) {
  const topicals = [
    { name: "topicalBabyWipes", label: "Baby Wipes" },
    { name: "topicalBandAids", label: "Band-Aids" },
    { name: "topicalNeosporin", label: "Neosporin" },
    { name: "topicalBactine", label: "Bactine" },
    { name: "topicalSunscreen", label: "Sunscreen" },
    { name: "topicalInsectRepellent", label: "Insect Repellent" },
    { name: "topicalNonRxOintment", label: "Non-Rx Ointment (A&D/Desitin/Vaseline)" },
    { name: "topicalBabyPowder", label: "Baby Powder" },
    { name: "topicalOther", label: "Other" },
  ];
  const showOther = useWatch({ control: form.control, name: "policiesConsent.topicalOther" });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-1">Policies & Consent Forms</h3>
        <p className="text-sm text-muted-foreground">Additional policies and authorizations</p>
      </div>
      <Card className="border-border/60">
        <CardContent className="p-4 space-y-3">
          <h4 className="font-semibold">No Liability Insurance Notice</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Genesis Learning Academy of Kennesaw does not carry liability insurance for injuries to children enrolled in the program. By signing this form, I acknowledge that I am aware of this fact and agree to hold the center harmless from any claims arising from injuries sustained by my child while in care, except in cases of gross negligence.
          </p>
          <FormField
            control={form.control}
            name="policiesConsent.ackNoLiabilityInsurance"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="text-sm font-medium text-primary">I acknowledge this notice *</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
      <Card className="border-border/60">
        <CardContent className="p-4 space-y-3">
          <h4 className="font-semibold">Child Combination Consent</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            I understand that children may occasionally be grouped with children of different ages (combined classrooms) during early morning drop-off, late afternoon pickup, field trips, or special activities, and I consent to this practice.
          </p>
          <FormField
            control={form.control}
            name="policiesConsent.ackChildCombination"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="text-sm font-medium text-primary">I consent *</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
      <Separator />
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Authorization for Topical Preparations</h4>
        <p className="text-sm text-muted-foreground">Check each item you authorize the center to apply to your child as needed:</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {topicals.map((t) => (
            <CheckboxField key={t.name} form={form} name={`policiesConsent.${t.name}`} label={t.label} />
          ))}
        </div>
        {showOther && (
          <TextField form={form} name="policiesConsent.topicalOtherSpecify" label="Please specify other topical preparation" />
        )}
      </div>
    </div>
  );
}

function Step7PhotoMedia({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-1">Photo/Media Authorization</h3>
        <p className="text-sm text-muted-foreground">Permission for photographs and video recordings</p>
      </div>
      <Card className="border-border/60">
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Genesis Learning Academy of Kennesaw may take photographs and/or video recordings of children during regular activities, special events, and field trips. These images may be used for:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
            <li>Display within the center</li>
            <li>The center's website and social media pages</li>
            <li>Promotional and marketing materials</li>
            <li>Newsletters and parent communication</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            No child's last name will be used in conjunction with any photo or video.
          </p>
          <Separator />
          <FormField
            control={form.control}
            name="photoMedia.photoAuthorization"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">Your Choice *</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-3 mt-2">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="authorize" id="photo-authorize" />
                      <Label htmlFor="photo-authorize" className="flex-1 cursor-pointer">
                        <span className="font-medium">I Authorize</span>
                        <span className="block text-sm text-muted-foreground">I grant permission for my child to be photographed/videotaped</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="opt_out" id="photo-opt-out" />
                      <Label htmlFor="photo-opt-out" className="flex-1 cursor-pointer">
                        <span className="font-medium">I Opt Out</span>
                        <span className="block text-sm text-muted-foreground">I do NOT grant permission for my child to be photographed/videotaped</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Step8InfantInfo({ form }: { form: any }) {
  const safeSleepRules = [
    "Infants will always be placed on their backs to sleep unless a physician's written directive specifies otherwise.",
    "Firm, flat mattresses with tight-fitting sheets will be used in all cribs.",
    "No soft bedding, pillows, bumper pads, stuffed animals, or toys will be placed in the crib.",
    "Infants will not be placed to sleep on waterbeds, sofas, soft mattresses, or other soft surfaces.",
    "Swaddling is not permitted at the center unless authorized by a physician.",
    "Room temperature will be maintained at a comfortable level to avoid overheating.",
    "Infants will be actively monitored during sleep periods with visual checks at least every 15 minutes.",
    "If a sleeping infant is found on their stomach, they will be gently repositioned on their back.",
    "Parents will be informed of the center's safe sleep policy upon enrollment.",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-1">Infant Information</h3>
        <p className="text-sm text-muted-foreground">Additional details for children under 2 years of age</p>
      </div>
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <h4 className="font-semibold">Safe Sleep Practices</h4>
          <p className="text-sm text-muted-foreground mb-2">Genesis Learning Academy follows these safe sleep practices:</p>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2 ml-2">
            {safeSleepRules.map((rule, i) => <li key={i}>{rule}</li>)}
          </ol>
          <CheckboxField form={form} name="infantInfo.ackSafeSleep" label="I acknowledge and agree to the safe sleep practices above *" />
        </CardContent>
      </Card>

      <Separator />
      <h4 className="text-lg font-semibold">Infant Feeding Plan</h4>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        <YesNoSelect form={form} name="infantInfo.takesBottle" label="Takes a bottle?" />
        <YesNoSelect form={form} name="infantInfo.bottleWarmed" label="Bottle warmed?" />
        <YesNoSelect form={form} name="infantInfo.holdsOwnBottle" label="Holds own bottle?" />
        <YesNoSelect form={form} name="infantInfo.feedsSelf" label="Feeds self?" />
      </div>

      <div className="space-y-3">
        <h5 className="font-medium text-sm">Food Types</h5>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          <CheckboxField form={form} name="infantInfo.foodStrained" label="Strained Foods" />
          <CheckboxField form={form} name="infantInfo.foodBaby" label="Baby Foods" />
          <CheckboxField form={form} name="infantInfo.foodFormula" label="Formula" />
          <CheckboxField form={form} name="infantInfo.foodWholeMilk" label="Whole Milk" />
          <CheckboxField form={form} name="infantInfo.foodTable" label="Table Food" />
          <CheckboxField form={form} name="infantInfo.foodOther" label="Other" />
        </div>
        {useWatch({ control: form.control, name: "infantInfo.foodOther" }) && (
          <TextField form={form} name="infantInfo.foodOtherSpecify" label="Specify other food" />
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <TextField form={form} name="infantInfo.formulaType" label="Formula Type" placeholder="e.g., Similac Advance" />
        <TextField form={form} name="infantInfo.formulaAmount" label="Amount" placeholder="e.g., 6 oz" />
        <TextField form={form} name="infantInfo.formulaSchedule" label="Schedule" placeholder="e.g., Every 3 hours" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <YesNoSelect form={form} name="infantInfo.pacifierUse" label="Uses a pacifier?" />
        <TextField form={form} name="infantInfo.pacifierWhen" label="When? (nap, always, etc.)" />
      </div>

      <Separator />
      <h4 className="text-lg font-semibold">Developmental Skills</h4>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        <YesNoSelect form={form} name="infantInfo.devRollOver" label="Can roll over?" />
        <YesNoSelect form={form} name="infantInfo.devSitAlone" label="Can sit alone?" />
        <YesNoSelect form={form} name="infantInfo.devCrawl" label="Can crawl?" />
        <YesNoSelect form={form} name="infantInfo.devWalk" label="Can walk?" />
      </div>

      <TextField form={form} name="infantInfo.foodLikes" label="Food Likes" placeholder="Foods your child enjoys" />
      <TextField form={form} name="infantInfo.foodDislikes" label="Food Dislikes" placeholder="Foods your child does not like" />
      <TextField form={form} name="infantInfo.foodAllergiesInfant" label="Known Food Allergies" />
      <FormField
        control={form.control}
        name="infantInfo.solidFoodsInstructions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Solid Foods Instructions</FormLabel>
            <FormControl>
              <Textarea placeholder="Any special instructions for solid food introduction or preparation" className="resize-none h-20" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />
      <Card className="border-border/60">
        <CardContent className="p-4 space-y-3">
          <h4 className="font-semibold">Infant Formula Affidavit</h4>
          <FormField
            control={form.control}
            name="infantInfo.formulaOption"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-3 mt-2">
                    <div className="flex items-start space-x-3 p-3 rounded-lg border border-border">
                      <RadioGroupItem value="center_provides" id="formula-center" className="mt-1" />
                      <Label htmlFor="formula-center" className="cursor-pointer">
                        <span className="font-medium">Center Provides</span>
                        <span className="block text-sm text-muted-foreground">The center will provide Similac formula and Rice cereal for my infant</span>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg border border-border">
                      <RadioGroupItem value="parent_provides" id="formula-parent" className="mt-1" />
                      <Label htmlFor="formula-parent" className="cursor-pointer">
                        <span className="font-medium">Parent Provides</span>
                        <span className="block text-sm text-muted-foreground">I will provide my own formula and food for my infant</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Step9CACFP({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-1">CACFP & Medicaid Information</h3>
        <p className="text-sm text-muted-foreground">Child and Adult Care Food Program eligibility information</p>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-4 space-y-3">
          <h4 className="font-semibold">Medicaid/SCHIP Information</h4>
          <p className="text-sm text-muted-foreground">
            Information about your child's enrollment may be shared with Medicaid/SCHIP to identify children eligible for free or reduced-cost health insurance. Check the box below if you wish to opt OUT.
          </p>
          <CheckboxField form={form} name="cacfp.optOutMedicaidSharing" label="I do NOT want my information shared with Medicaid/SCHIP" />
        </CardContent>
      </Card>

      <Separator />
      <h4 className="text-lg font-semibold">CACFP Income Eligibility</h4>
      <TextField form={form} name="cacfp.snapTanfCase" label="SNAP/TANF/FDPIR Case Number (if applicable)" placeholder="Enter case number if receiving benefits" />

      <div className="space-y-3">
        <h5 className="font-medium text-sm">Categorical Eligibility (check all that apply)</h5>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          <CheckboxField form={form} name="cacfp.catHeadStart" label="Head Start" />
          <CheckboxField form={form} name="cacfp.catFosterChild" label="Foster Child" />
          <CheckboxField form={form} name="cacfp.catMigrant" label="Migrant" />
          <CheckboxField form={form} name="cacfp.catRunaway" label="Runaway" />
          <CheckboxField form={form} name="cacfp.catHomeless" label="Homeless" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <TextField form={form} name="cacfp.householdIncome" label="Annual Household Income (optional)" placeholder="e.g., $45,000" />
        <TextField form={form} name="cacfp.householdSize" label="Number of Household Members" placeholder="e.g., 4" />
      </div>

      <Separator />
      <div className="space-y-3">
        <h5 className="font-medium text-sm">Ethnic/Racial Identity (voluntary)</h5>
        <FormField
          control={form.control}
          name="cacfp.ethnicHispanic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hispanic or Latino?</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="decline">Prefer not to answer</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          <CheckboxField form={form} name="cacfp.raceAmericanIndian" label="American Indian/Alaska Native" />
          <CheckboxField form={form} name="cacfp.raceAsian" label="Asian" />
          <CheckboxField form={form} name="cacfp.raceBlack" label="Black/African American" />
          <CheckboxField form={form} name="cacfp.raceHawaiian" label="Native Hawaiian/Pacific Islander" />
          <CheckboxField form={form} name="cacfp.raceWhite" label="White" />
        </div>
      </div>

      <Separator />
      <div className="space-y-3">
        <h5 className="font-medium text-sm">Meals Attending</h5>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <CheckboxField form={form} name="cacfp.mealBreakfast" label="Breakfast" />
          <CheckboxField form={form} name="cacfp.mealAMSnack" label="AM Snack" />
          <CheckboxField form={form} name="cacfp.mealLunch" label="Lunch" />
          <CheckboxField form={form} name="cacfp.mealPMSnack" label="PM Snack" />
          <CheckboxField form={form} name="cacfp.mealSupper" label="Supper" />
          <CheckboxField form={form} name="cacfp.mealEveningSnack" label="Evening Snack" />
        </div>
      </div>

      <div className="space-y-3">
        <h5 className="font-medium text-sm">Days Attending</h5>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {["Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <CheckboxField key={d} form={form} name={`cacfp.day${d}`} label={d} />
          ))}
        </div>
      </div>
      <TextField form={form} name="cacfp.hoursOfAttendance" label="Hours of Attendance" placeholder="e.g., 7:00 AM - 5:30 PM" />
    </div>
  );
}

function Step10Transportation({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-1">Transportation Information</h3>
        <p className="text-sm text-muted-foreground">Vehicle emergency information and transportation agreement</p>
      </div>

      <h4 className="text-lg font-semibold">Vehicle Emergency Info</h4>
      <div className="grid md:grid-cols-2 gap-4">
        <TextField form={form} name="transportation.transFatherName" label="Father's Name" />
        <TextField form={form} name="transportation.transFatherPhone" label="Father's Phone" type="tel" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <TextField form={form} name="transportation.transMotherName" label="Mother's Name" />
        <TextField form={form} name="transportation.transMotherPhone" label="Mother's Phone" type="tel" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <TextField form={form} name="transportation.transEmergencyContact" label="Emergency Contact" />
        <TextField form={form} name="transportation.transEmergencyPhone" label="Emergency Phone" type="tel" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <TextField form={form} name="transportation.transDoctorName" label="Doctor's Name" />
        <TextField form={form} name="transportation.transDoctorPhone" label="Doctor's Phone" type="tel" />
      </div>

      <Separator />
      <h4 className="text-lg font-semibold">Transportation Agreement</h4>
      <div className="grid md:grid-cols-2 gap-4">
        <TextField form={form} name="transportation.transPickupLocation" label="Pickup Location (School Name)" />
        <TextField form={form} name="transportation.transDeliveryLocation" label="Delivery Location" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <TextField form={form} name="transportation.transPickupTime" label="Pickup Time" placeholder="e.g., 3:15 PM" />
        <TextField form={form} name="transportation.transDeliveryTime" label="Delivery Time" placeholder="e.g., 3:30 PM" />
      </div>
      <div className="space-y-3">
        <h5 className="font-medium text-sm">Days (check all that apply)</h5>
        <div className="grid grid-cols-5 gap-3">
          {["Mon","Tue","Wed","Thu","Fri"].map(d => (
            <CheckboxField key={d} form={form} name={`transportation.transDay${d}`} label={d} />
          ))}
        </div>
      </div>
      <TextField form={form} name="transportation.transAuthorizedPerson" label="Authorized Person for Transportation" placeholder="Person authorized to receive child at delivery location" />
    </div>
  );
}

function Step11AboutFamily({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-1">About Your Family</h3>
        <p className="text-sm text-muted-foreground">Help us get to know your family better (all fields optional)</p>
      </div>
      <FormField control={form.control} name="aboutFamily.familyMembers" render={({ field }) => (
        <FormItem><FormLabel>Family Members</FormLabel><FormControl><Textarea placeholder="Tell us about your family members" className="resize-none h-20" {...field} /></FormControl></FormItem>
      )} />
      <TextField form={form} name="aboutFamily.familyBirthday" label="Child's Birthday (for celebrations)" placeholder="e.g., March 15" />
      <FormField control={form.control} name="aboutFamily.familyActivities" render={({ field }) => (
        <FormItem><FormLabel>Activities & Interests</FormLabel><FormControl><Textarea placeholder="What activities does your child enjoy?" className="resize-none h-20" {...field} /></FormControl></FormItem>
      )} />
      <FormField control={form.control} name="aboutFamily.familyStrengths" render={({ field }) => (
        <FormItem><FormLabel>Strengths</FormLabel><FormControl><Textarea placeholder="What are your child's strengths?" className="resize-none h-20" {...field} /></FormControl></FormItem>
      )} />
      <FormField control={form.control} name="aboutFamily.familyWorkOn" render={({ field }) => (
        <FormItem><FormLabel>Things to Work On</FormLabel><FormControl><Textarea placeholder="What areas would you like us to help your child develop?" className="resize-none h-20" {...field} /></FormControl></FormItem>
      )} />
      <FormField control={form.control} name="aboutFamily.familyMedicalNeeds" render={({ field }) => (
        <FormItem><FormLabel>Medical Needs/Allergies</FormLabel><FormControl><Textarea placeholder="Any additional medical needs or allergies" className="resize-none h-20" {...field} /></FormControl></FormItem>
      )} />
      <FormField control={form.control} name="aboutFamily.familyOtherInfo" render={({ field }) => (
        <FormItem><FormLabel>Other Information</FormLabel><FormControl><Textarea placeholder="Anything else you'd like us to know?" className="resize-none h-20" {...field} /></FormControl></FormItem>
      )} />
    </div>
  );
}

// ─── Review Step Component ─────────────────────────────────────────────
function ReviewSection({ title, data, stepIndex, onEdit }: { title: string; data: Record<string, any>; stepIndex: number; onEdit: (step: number) => void }) {
  const displayValue = (val: any): string => {
    if (val === true) return "Yes";
    if (val === false) return "No";
    if (val === "" || val === undefined || val === null) return "—";
    if (Array.isArray(val)) return val.map((v, i) => typeof v === "object" ? Object.values(v).filter(Boolean).join(", ") : String(v)).filter(Boolean).join("; ") || "—";
    if (typeof val === "object") return Object.entries(val).map(([k, v]) => `${k}: ${displayValue(v)}`).join(", ");
    return String(val);
  };

  const formatKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase())
      .replace(/ack /i, "✓ ")
      .replace(/^Cat /, "")
      .replace(/^Day /, "")
      .replace(/^Meal /, "")
      .replace(/^Race /, "")
      .replace(/^Trans /, "")
      .replace(/^Topical /, "")
      .replace(/^Food /, "Food: ");
  };

  const hasData = Object.values(data).some((v) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") return v.length > 0;
    if (Array.isArray(v)) return v.some((item) => typeof item === "object" ? Object.values(item).some(Boolean) : Boolean(item));
    if (typeof v === "object" && v !== null) return Object.values(v).some(Boolean);
    return false;
  });

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(stepIndex)}>Edit</Button>
      </CardHeader>
      <CardContent className="pt-0">
        {hasData ? (
          <div className="grid gap-1 text-sm">
            {Object.entries(data).map(([key, val]) => {
              const display = displayValue(val);
              if (display === "—" || display === "No") return null;
              return (
                <div key={key} className="flex gap-2 py-1 border-b border-border/30 last:border-0">
                  <span className="text-muted-foreground min-w-[140px] shrink-0">{formatKey(key)}:</span>
                  <span className="text-foreground">{display}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No data entered</p>
        )}
      </CardContent>
    </Card>
  );
}

function Step12Review({ form, onEdit }: { form: any; onEdit: (step: number) => void }) {
  const values = form.getValues() as EnrollmentFormData;
  const sections = [
    { title: "Child Information", data: values.childInfo, step: 0 },
    { title: "1st Parent/Guardian", data: values.parentGuardian.parent1, step: 1 },
    { title: "2nd Parent/Guardian", data: values.parentGuardian.parent2, step: 1 },
    { title: "Emergency Contact #1", data: values.emergencyContacts.emergencyContact1, step: 2 },
    { title: "Emergency Contact #2", data: values.emergencyContacts.emergencyContact2, step: 2 },
    { title: "Authorized Pickup", data: { pickup1: values.emergencyContacts.authorizedPickup1, pickup2: values.emergencyContacts.authorizedPickup2, kidCode: values.emergencyContacts.kidCode }, step: 2 },
    { title: "Medical Information", data: values.medicalInfo, step: 4 },
    { title: "Photo/Media", data: values.photoMedia, step: 6 },
    { title: "CACFP / Meals & Days", data: { meals: [values.cacfp.mealBreakfast && "Breakfast", values.cacfp.mealAMSnack && "AM Snack", values.cacfp.mealLunch && "Lunch", values.cacfp.mealPMSnack && "PM Snack", values.cacfp.mealSupper && "Supper", values.cacfp.mealEveningSnack && "Evening Snack"].filter(Boolean).join(", ") || "—", days: [values.cacfp.dayMon && "Mon", values.cacfp.dayTue && "Tue", values.cacfp.dayWed && "Wed", values.cacfp.dayThu && "Thu", values.cacfp.dayFri && "Fri", values.cacfp.daySat && "Sat"].filter(Boolean).join(", ") || "—", hours: values.cacfp.hoursOfAttendance }, step: 8 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-1">Review & Submit</h3>
        <p className="text-sm text-muted-foreground">Please review all information before submitting</p>
      </div>
      {sections.map((s, i) => (
        <ReviewSection key={i} title={s.title} data={s.data as Record<string, any>} stepIndex={s.step} onEdit={onEdit} />
      ))}
      <Card className="border-amber-300 bg-amber-50">
        <CardContent className="p-4">
          <p className="text-sm text-amber-800 font-medium">
            📋 Immunization records and a signed Affidavit of Religious Objection (if applicable) must be brought in person to complete enrollment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ─── Main Enrollment Page ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

const Enroll = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(fullEnrollmentSchema),
    defaultValues: getDefaultValues(),
    mode: "onTouched",
  });

  // Watch birth date for conditional infant step
  const childBirthDate = useWatch({ control: form.control, name: "childInfo.childBirthDate" });
  const isAfterSchool = useWatch({ control: form.control, name: "paymentPolicies.isAfterSchool" });
  const showInfantStep = isInfant(childBirthDate);

  // Build active steps list (some steps are conditional)
  const activeSteps = useMemo(() => {
    const steps = [0, 1, 2, 3, 4, 5, 6]; // Always shown
    if (showInfantStep) steps.push(7); // Infant info
    steps.push(8); // CACFP
    if (isAfterSchool) steps.push(9); // Transportation
    steps.push(10, 11); // About family, Review
    return steps;
  }, [showInfantStep, isAfterSchool]);

  const totalActiveSteps = activeSteps.length;
  const activeStepIndex = activeSteps.indexOf(currentStep);
  const progressPercent = Math.round(((activeStepIndex + 1) / totalActiveSteps) * 100);
  const stepsAfterCurrent = Math.max(0, totalActiveSteps - activeStepIndex - 1);

  // Save draft to localStorage on form value changes
  const formValues = useWatch({ control: form.control });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formValues));
    } catch { /* storage full or unavailable */ }
  }, [formValues]);

  // Per-step validation schemas
  const stepValidationSchemas: Record<number, z.ZodTypeAny> = {
    0: z.object({ childInfo: childInfoSchema }),
    1: z.object({ parentGuardian: parentGuardianSchema }),
    2: z.object({ emergencyContacts: emergencyContactsSchema }),
    3: z.object({ paymentPolicies: paymentPoliciesSchema }),
    4: z.object({ medicalInfo: medicalInfoSchema }),
    5: z.object({ policiesConsent: policiesConsentSchema }),
    6: z.object({ photoMedia: photoMediaSchema }),
    7: z.object({ infantInfo: infantInfoSchema }),
    8: z.object({ cacfp: cacfpSchema }),
    9: z.object({ transportation: transportationSchema }),
    10: z.object({ aboutFamily: aboutFamilySchema }),
  };

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const schema = stepValidationSchemas[currentStep];
    if (!schema) return true; // Review step — no validation
    const values = form.getValues();
    const result = schema.safeParse(values);
    if (!result.success) {
      // Trigger form validation to show errors
      const fieldNames = result.error.issues.map((issue) => issue.path.join("."));
      for (const fieldName of fieldNames) {
        await form.trigger(fieldName as any);
      }
      return false;
    }
    return true;
  }, [currentStep, form]);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = async () => {
    const valid = await validateCurrentStep();
    if (!valid) {
      toast({
        title: "Please fix the errors above",
        description: "All required fields must be completed before proceeding.",
        variant: "destructive",
      });
      return;
    }
    const currentIndex = activeSteps.indexOf(currentStep);
    if (currentIndex < activeSteps.length - 1) {
      goToStep(activeSteps[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const currentIndex = activeSteps.indexOf(currentStep);
    if (currentIndex > 0) {
      goToStep(activeSteps[currentIndex - 1]);
    }
  };

  const onSubmit = async (data: EnrollmentFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = "Failed to submit enrollment request";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      try {
        const text = await response.text();
        text ? JSON.parse(text) : { success: true };
      } catch {
        console.warn("Could not parse response as JSON, but request succeeded");
      }

      trackEnrollmentSubmission({
        parentName: data.parentGuardian.parent1.fullName,
        email: data.parentGuardian.parent1.email || "",
        numberOfChildren: 1,
        childAges: [data.childInfo.childBirthDate],
        languagePreference: "english",
      });

      localStorage.removeItem(STORAGE_KEY);

      toast({
        title: "Thank you!",
        description: "Your enrollment application has been received. We will contact you shortly.",
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error("Enrollment submission error:", error);
      let errorMessage = "Failed to submit enrollment request. Please try again or call us at (770) 672-4255.";
      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage = "Unable to connect to server. Please check your connection and try again.";
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async () => {
    const valid = await form.trigger();
    if (valid) {
      await onSubmit(form.getValues());
    } else {
      toast({
        title: "Incomplete Application",
        description: "Please review all steps and fix any errors before submitting.",
        variant: "destructive",
      });
    }
  };

  // ─── Success State ─────────────────────────────────────────────────
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
          <p className="text-xl mb-2">Your enrollment application has been received.</p>
          <p className="text-primary-foreground/90 mb-4 max-w-md mx-auto">
            A member of our team will reach out shortly to discuss next steps and answer any questions.
          </p>
          <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto text-sm">
            📋 Please remember to bring immunization records and any required documents to the center in person.
          </p>
          <Button variant="cta" size="lg" onClick={() => (window.location.href = "/")}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // ─── Step Renderer ─────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 0: return <Step1ChildInfo form={form} />;
      case 1: return <Step2ParentGuardian form={form} />;
      case 2: return <Step3EmergencyContacts form={form} />;
      case 3: return <Step4PaymentPolicies form={form} />;
      case 4: return <Step5MedicalInfo form={form} />;
      case 5: return <Step6PoliciesConsent form={form} />;
      case 6: return <Step7PhotoMedia form={form} />;
      case 7: return <Step8InfantInfo form={form} />;
      case 8: return <Step9CACFP form={form} />;
      case 9: return <Step10Transportation form={form} />;
      case 10: return <Step11AboutFamily form={form} />;
      case 11: return <Step12Review form={form} onEdit={goToStep} />;
      default: return null;
    }
  };

  const StepIcon = STEP_ICONS[currentStep] || FileCheck;

  return (
    <div className="min-h-screen bg-warmBg">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-12">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Enrollment Application</h1>
          <p className="text-primary-foreground/95 leading-relaxed">
            Complete the enrollment packet for Genesis Learning Academy of Kennesaw. Your progress is saved automatically.
          </p>
        </div>
      </section>

      {/* Progress, remaining steps, and jump navigation (sticky) */}
      <section className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border shadow-sm">
        <div className="container mx-auto px-4 max-w-4xl py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-3">
            <div className="flex items-start gap-3 min-w-0">
              <StepIcon className="w-6 h-6 text-primary shrink-0 mt-0.5" aria-hidden />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground leading-snug">
                  Step {activeStepIndex + 1} of {totalActiveSteps}
                  <span className="font-normal text-muted-foreground"> · {STEP_TITLES[currentStep]}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {stepsAfterCurrent === 0
                    ? "Final step — review everything, then submit when you’re ready."
                    : stepsAfterCurrent === 1
                      ? "1 step left after this one."
                      : `${stepsAfterCurrent} steps left after this one.`}
                </p>
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground tabular-nums sm:text-right shrink-0">
              {progressPercent}% complete
            </p>
          </div>
          <Progress value={progressPercent} className="h-2 mb-4" />
          <nav aria-label="Jump to a step" className="-mx-1 px-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Go to step
            </p>
            <div className="flex flex-wrap gap-2">
              {activeSteps.map((stepNum, idx) => {
                const shortLabel = STEP_TITLES[stepNum].split(" ")[0];
                const isCurrent = stepNum === currentStep;
                return (
                  <Button
                    key={stepNum}
                    type="button"
                    variant={isCurrent ? "default" : "outline"}
                    size="sm"
                    className="h-8 px-2.5 text-xs font-medium"
                    onClick={() => goToStep(stepNum)}
                  >
                    <span className="sr-only">
                      {isCurrent
                        ? `Current: ${STEP_TITLES[stepNum]}`
                        : `Go to step ${idx + 1}: ${STEP_TITLES[stepNum]}`}
                    </span>
                    {idx + 1}. {shortLabel}
                  </Button>
                );
              })}
            </div>
          </nav>
        </div>
      </section>

      {/* Form Section */}
      <section className="pt-4 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="shadow-lg border-border/50">
            <CardContent className="p-6 md:p-10">
              <Form {...form}>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                  {renderStep()}

                  {/* Navigation Buttons */}
                  <Separator />
                  <div className="flex items-center justify-between gap-4 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={handlePrevious}
                      disabled={activeStepIndex === 0}
                      className="gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    {currentStep === 11 ? (
                      <Button
                        type="button"
                        variant="cta"
                        size="lg"
                        onClick={handleFormSubmit}
                        disabled={isSubmitting}
                        className="gap-2 min-w-[200px]"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Enrollment"}
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="cta"
                        size="lg"
                        onClick={handleNext}
                        className="gap-2"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="mt-6 p-6 bg-muted/30 rounded-lg border border-border/50 text-center">
            <p className="text-muted-foreground mb-3">Questions about enrollment?</p>
            <a
              href="tel:770-672-4255"
              className="text-primary font-semibold text-xl hover:text-accent transition-colors"
            >
              (770) 672-4255
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Enroll;
