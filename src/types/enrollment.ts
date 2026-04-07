import * as z from "zod";

// ─── Helpers ───────────────────────────────────────────────────────────
const optStr = z.string().optional().default("");
const reqStr = (msg: string) => z.string().min(1, msg);

// ─── Step 1: Child Information ─────────────────────────────────────────
export const childInfoSchema = z.object({
  childFullName: reqStr("Child's full name is required"),
  childBirthDate: reqStr("Birth date is required"),
  childSex: reqStr("Please select sex"),
  childNickName: optStr,
  childHomeAddress: reqStr("Home address is required"),
  childCity: reqStr("City is required"),
  childState: reqStr("State is required"),
  childZipCode: reqStr("Zip code is required"),
  childHomePhone: optStr,
});

// ─── Step 2: Parent/Guardian Information ───────────────────────────────
const parentSchema = z.object({
  fullName: optStr,
  birthDate: optStr,
  homePhone: optStr,
  cellPhone: optStr,
  homeAddress: optStr,
  city: optStr,
  state: optStr,
  zipCode: optStr,
  occupation: optStr,
  workPhone: optStr,
  workHours: optStr,
  employerName: optStr,
  employerAddress: optStr,
  email: optStr,
});

const householdMemberSchema = z.object({
  name: optStr,
  age: optStr,
  relationship: optStr,
});

export const parentGuardianSchema = z.object({
  parent1: parentSchema.extend({
    fullName: reqStr("First parent/guardian name is required"),
    cellPhone: reqStr("Cell phone is required"),
    email: z.string().email("Invalid email").or(z.literal("")).optional().default(""),
  }),
  parent2: parentSchema,
  legalCustodyParent: optStr,
  parentalStatus: reqStr("Parental status is required"),
  otherHouseholdMembers: z.array(householdMemberSchema).default([
    { name: "", age: "", relationship: "" },
    { name: "", age: "", relationship: "" },
    { name: "", age: "", relationship: "" },
    { name: "", age: "", relationship: "" },
  ]),
});

// ─── Step 3: Emergency Contacts & Pickup ───────────────────────────────
const emergencyContactSchema = z.object({
  name: optStr,
  homeCell: optStr,
  workPhone: optStr,
  relationship: optStr,
  address: optStr,
  cityStateZip: optStr,
});

const authorizedPickupSchema = z.object({
  name: optStr,
  relationship: optStr,
  homeCell: optStr,
  address: optStr,
});

const unauthorizedPickupSchema = z.object({
  name: optStr,
  comment: optStr,
});

export const emergencyContactsSchema = z.object({
  emergencyContact1: emergencyContactSchema.extend({
    name: reqStr("Emergency contact #1 name is required"),
    homeCell: reqStr("Emergency contact #1 phone is required"),
  }),
  emergencyContact2: emergencyContactSchema,
  authorizedPickup1: authorizedPickupSchema,
  authorizedPickup2: authorizedPickupSchema,
  kidCode: reqStr("Kid Code (secret pickup word) is required"),
  unauthorizedPickup1: unauthorizedPickupSchema,
  unauthorizedPickup2: unauthorizedPickupSchema,
});

// ─── Step 4: Payment Policies ──────────────────────────────────────────
export const paymentPoliciesSchema = z.object({
  ackHoursOvertime: z.boolean().refine(v => v, "You must acknowledge this policy"),
  ackPaymentDeadline: z.boolean().refine(v => v, "You must acknowledge this policy"),
  ackRegistrationFee: z.boolean().refine(v => v, "You must acknowledge this policy"),
  ackVacationPolicy: z.boolean().refine(v => v, "You must acknowledge this policy"),
  ackNoAbsenceDiscounts: z.boolean().refine(v => v, "You must acknowledge this policy"),
  ackDisenrollmentNotice: z.boolean().refine(v => v, "You must acknowledge this policy"),
  ackAgeGrouping: z.boolean().refine(v => v, "You must acknowledge this policy"),
  ackEscortPolicy: z.boolean().refine(v => v, "You must acknowledge this policy"),
  isAfterSchool: z.boolean().default(false),
  ackTransportationFee: z.boolean().optional().default(false),
  ackDayServicePayment: z.boolean().optional().default(false),
});

// ─── Step 5: Medical & Emergency ───────────────────────────────────────
export const medicalInfoSchema = z.object({
  physicianName: optStr,
  physicianPhone: optStr,
  preferredHospital: optStr,
  hospitalPhone: optStr,
  regularMedications: optStr,
  bloodType: optStr,
  medicalAllergies: optStr,
  foodAllergies: optStr,
  otherAllergies: optStr,
  specialHealthConditions: optStr,
  ackEmergencyMedicalCare: z.boolean().refine(v => v, "You must authorize emergency medical care"),
});

// ─── Step 6: Policies & Consent ────────────────────────────────────────
export const policiesConsentSchema = z.object({
  ackNoLiabilityInsurance: z.boolean().refine(v => v, "You must acknowledge this policy"),
  ackChildCombination: z.boolean().refine(v => v, "You must acknowledge this policy"),
  topicalBabyWipes: z.boolean().default(false),
  topicalBandAids: z.boolean().default(false),
  topicalNeosporin: z.boolean().default(false),
  topicalBactine: z.boolean().default(false),
  topicalSunscreen: z.boolean().default(false),
  topicalInsectRepellent: z.boolean().default(false),
  topicalNonRxOintment: z.boolean().default(false),
  topicalBabyPowder: z.boolean().default(false),
  topicalOther: z.boolean().default(false),
  topicalOtherSpecify: optStr,
});

// ─── Step 7: Photo/Media Authorization ─────────────────────────────────
export const photoMediaSchema = z.object({
  photoAuthorization: reqStr("Please select an option"),
});

// ─── Step 8: Infant Information (conditional) ──────────────────────────
export const infantInfoSchema = z.object({
  ackSafeSleep: z.boolean().default(false),
  takesBottle: optStr,
  bottleWarmed: optStr,
  holdsOwnBottle: optStr,
  feedsSelf: optStr,
  foodStrained: z.boolean().default(false),
  foodBaby: z.boolean().default(false),
  foodFormula: z.boolean().default(false),
  foodWholeMilk: z.boolean().default(false),
  foodTable: z.boolean().default(false),
  foodOther: z.boolean().default(false),
  foodOtherSpecify: optStr,
  formulaType: optStr,
  formulaAmount: optStr,
  formulaSchedule: optStr,
  pacifierUse: optStr,
  pacifierWhen: optStr,
  devRollOver: optStr,
  devSitAlone: optStr,
  devCrawl: optStr,
  devWalk: optStr,
  foodLikes: optStr,
  foodDislikes: optStr,
  foodAllergiesInfant: optStr,
  solidFoodsInstructions: optStr,
  formulaOption: optStr,
});

// ─── Step 9: CACFP & Medicaid ──────────────────────────────────────────
export const cacfpSchema = z.object({
  optOutMedicaidSharing: z.boolean().default(false),
  snapTanfCase: optStr,
  catHeadStart: z.boolean().default(false),
  catFosterChild: z.boolean().default(false),
  catMigrant: z.boolean().default(false),
  catRunaway: z.boolean().default(false),
  catHomeless: z.boolean().default(false),
  householdIncome: optStr,
  householdSize: optStr,
  ethnicHispanic: optStr,
  raceAmericanIndian: z.boolean().default(false),
  raceAsian: z.boolean().default(false),
  raceBlack: z.boolean().default(false),
  raceHawaiian: z.boolean().default(false),
  raceWhite: z.boolean().default(false),
  mealBreakfast: z.boolean().default(false),
  mealAMSnack: z.boolean().default(false),
  mealLunch: z.boolean().default(false),
  mealPMSnack: z.boolean().default(false),
  mealSupper: z.boolean().default(false),
  mealEveningSnack: z.boolean().default(false),
  dayMon: z.boolean().default(false),
  dayTue: z.boolean().default(false),
  dayWed: z.boolean().default(false),
  dayThu: z.boolean().default(false),
  dayFri: z.boolean().default(false),
  daySat: z.boolean().default(false),
  hoursOfAttendance: optStr,
});

// ─── Step 10: Transportation (conditional) ─────────────────────────────
export const transportationSchema = z.object({
  transFatherName: optStr,
  transFatherPhone: optStr,
  transMotherName: optStr,
  transMotherPhone: optStr,
  transEmergencyContact: optStr,
  transEmergencyPhone: optStr,
  transDoctorName: optStr,
  transDoctorPhone: optStr,
  transPickupLocation: optStr,
  transDeliveryLocation: optStr,
  transPickupTime: optStr,
  transDeliveryTime: optStr,
  transDayMon: z.boolean().default(false),
  transDayTue: z.boolean().default(false),
  transDayWed: z.boolean().default(false),
  transDayThu: z.boolean().default(false),
  transDayFri: z.boolean().default(false),
  transAuthorizedPerson: optStr,
});

// ─── Step 11: About Your Family (optional) ─────────────────────────────
export const aboutFamilySchema = z.object({
  familyMembers: optStr,
  familyBirthday: optStr,
  familyActivities: optStr,
  familyStrengths: optStr,
  familyWorkOn: optStr,
  familyMedicalNeeds: optStr,
  familyOtherInfo: optStr,
});

// ─── Combined Schema ───────────────────────────────────────────────────
export const fullEnrollmentSchema = z.object({
  childInfo: childInfoSchema,
  parentGuardian: parentGuardianSchema,
  emergencyContacts: emergencyContactsSchema,
  paymentPolicies: paymentPoliciesSchema,
  medicalInfo: medicalInfoSchema,
  policiesConsent: policiesConsentSchema,
  photoMedia: photoMediaSchema,
  infantInfo: infantInfoSchema,
  cacfp: cacfpSchema,
  transportation: transportationSchema,
  aboutFamily: aboutFamilySchema,
});

export type EnrollmentFormData = z.infer<typeof fullEnrollmentSchema>;

// Step schemas array for per-step validation
export const stepSchemas = [
  z.object({ childInfo: childInfoSchema }),
  z.object({ parentGuardian: parentGuardianSchema }),
  z.object({ emergencyContacts: emergencyContactsSchema }),
  z.object({ paymentPolicies: paymentPoliciesSchema }),
  z.object({ medicalInfo: medicalInfoSchema }),
  z.object({ policiesConsent: policiesConsentSchema }),
  z.object({ photoMedia: photoMediaSchema }),
  z.object({ infantInfo: infantInfoSchema }),
  z.object({ cacfp: cacfpSchema }),
  z.object({ transportation: transportationSchema }),
  z.object({ aboutFamily: aboutFamilySchema }),
  // Step 12 is review — no extra validation
] as const;

export const STEP_TITLES = [
  "Child Information",
  "Parent/Guardian Information",
  "Emergency Contacts & Pickup",
  "Payment Policies",
  "Medical & Emergency Info",
  "Policies & Consent",
  "Photo/Media Authorization",
  "Infant Information",
  "CACFP & Medicaid Info",
  "Transportation",
  "About Your Family",
  "Review & Submit",
];
