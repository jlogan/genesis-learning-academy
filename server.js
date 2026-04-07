import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// ─── PDF Generation ───────────────────────────────────────────────────────────

const BRAND = {
  name: 'Genesis Learning Academy of Killeen',
  address: '4604 Westcliff Rd, Killeen, TX 76543',
  phone: '(254) 213-5005',
};

const COLORS = {
  primary: '#1a365d',    // dark navy
  accent: '#2b6cb0',     // medium blue
  text: '#1a202c',
  muted: '#4a5568',
  line: '#cbd5e0',
};

function generateEnrollmentPDF(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50, bufferPages: true });
    const chunks = [];
    const stream = new PassThrough();
    doc.pipe(stream);
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);

    const pageWidth = doc.page.width - 100; // minus margins
    let y; // track vertical position

    // ── Helper Functions ──

    function drawHeader() {
      doc.rect(0, 0, doc.page.width, 80).fill(COLORS.primary);
      doc.fill('#ffffff')
        .fontSize(18).font('Helvetica-Bold')
        .text(BRAND.name, 50, 20, { width: pageWidth, align: 'center' });
      doc.fontSize(9).font('Helvetica')
        .text(`${BRAND.address}  |  ${BRAND.phone}`, 50, 45, { width: pageWidth, align: 'center' });
      doc.fill(COLORS.text);
      return 95;
    }

    function checkPage(needed = 60) {
      if (y + needed > doc.page.height - 60) {
        doc.addPage();
        y = drawHeader();
      }
    }

    function sectionTitle(title) {
      checkPage(50);
      y += 8;
      doc.rect(50, y, pageWidth, 24).fill(COLORS.accent);
      doc.fill('#ffffff').fontSize(12).font('Helvetica-Bold')
        .text(title.toUpperCase(), 58, y + 6, { width: pageWidth - 16 });
      doc.fill(COLORS.text);
      y += 32;
    }

    function fieldRow(label, value, opts = {}) {
      checkPage(28);
      const val = value != null && value !== '' ? String(value) : '—';
      doc.fontSize(9).font('Helvetica-Bold').fill(COLORS.muted)
        .text(label + ':', 55, y, { continued: false });
      doc.font('Helvetica').fill(COLORS.text)
        .text(val, 200, y, { width: pageWidth - 155 });
      const textHeight = doc.heightOfString(val, { width: pageWidth - 155 });
      y += Math.max(textHeight, 14) + 4;
    }

    function fieldRowHalf(label1, val1, label2, val2) {
      checkPage(28);
      const half = pageWidth / 2;
      const v1 = val1 != null && val1 !== '' ? String(val1) : '—';
      const v2 = val2 != null && val2 !== '' ? String(val2) : '—';
      doc.fontSize(9).font('Helvetica-Bold').fill(COLORS.muted)
        .text(label1 + ':', 55, y);
      doc.font('Helvetica').fill(COLORS.text)
        .text(v1, 170, y);
      doc.fontSize(9).font('Helvetica-Bold').fill(COLORS.muted)
        .text(label2 + ':', 50 + half + 5, y);
      doc.font('Helvetica').fill(COLORS.text)
        .text(v2, 50 + half + 120, y);
      y += 18;
    }

    function bulletItem(text) {
      checkPage(22);
      doc.fontSize(9).font('Helvetica').fill(COLORS.text)
        .text('•  ' + text, 60, y, { width: pageWidth - 20 });
      const h = doc.heightOfString('•  ' + text, { width: pageWidth - 20 });
      y += Math.max(h, 14) + 2;
    }

    function separator() {
      checkPage(12);
      y += 4;
      doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor(COLORS.line).lineWidth(0.5).stroke();
      y += 8;
    }

    function signatureLine(label) {
      checkPage(50);
      y += 10;
      doc.moveTo(55, y + 20).lineTo(350, y + 20).strokeColor(COLORS.text).lineWidth(0.8).stroke();
      doc.moveTo(370, y + 20).lineTo(500, y + 20).stroke();
      doc.fontSize(8).font('Helvetica').fill(COLORS.muted)
        .text(label, 55, y + 24)
        .text('Date', 370, y + 24);
      y += 45;
    }

    // Safely get nested data
    const d = data || {};
    const child = d.childInformation || d.child || {};
    const mother = d.parentGuardianMother || d.mother || {};
    const father = d.parentGuardianFather || d.father || {};
    const emergency = d.emergencyContacts || d.emergency || {};
    const payment = d.paymentPolicy || d.payment || {};
    const medical = d.medicalEmergency || d.medical || {};
    const policies = d.policiesConsent || d.policies || {};
    const photo = d.photoMediaAuthorization || d.photoMedia || {};
    const infant = d.infantInformation || d.infant || {};
    const cacfp = d.cacfpMedicaid || d.cacfp || {};
    const transport = d.transportation || d.transport || {};
    const family = d.aboutYourFamily || d.family || {};

    // ── Page 1: Title + Child Information ──

    y = drawHeader();

    // Title banner
    doc.rect(50, y, pageWidth, 30).fill('#edf2f7');
    doc.fill(COLORS.primary).fontSize(11).font('Helvetica-Bold')
      .text('ENROLLMENT APPLICATION — Print and bring to center for signatures', 55, y + 9, { width: pageWidth - 10, align: 'center' });
    doc.fill(COLORS.text);
    y += 40;

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.fontSize(9).font('Helvetica').fill(COLORS.muted)
      .text(`Generated: ${today}`, 55, y, { width: pageWidth - 10, align: 'right' });
    y += 18;

    // ── A. Child Information ──
    sectionTitle('Child Information');
    fieldRow('First Name', child.firstName);
    fieldRow('Middle Name', child.middleName);
    fieldRow('Last Name', child.lastName);
    fieldRowHalf('Date of Birth', child.dateOfBirth, 'Gender', child.gender);
    fieldRow('Age Group', child.ageGroup || child.childAge);
    fieldRow('Address', child.address || child.streetAddress);
    fieldRowHalf('City', child.city, 'State', child.state);
    fieldRowHalf('Zip Code', child.zipCode, 'County', child.county);
    fieldRow('Lives With', child.livesWith);
    fieldRow('Preferred Start Date', child.preferredStartDate || child.startDate);
    fieldRow('Enrollment Type', child.enrollmentType);
    fieldRow('Schedule', child.schedule);
    fieldRow('Previous Childcare', child.previousChildcare);
    if (child.allergies) fieldRow('Allergies', child.allergies);
    if (child.specialNeeds) fieldRow('Special Needs', child.specialNeeds);

    // ── B. Parent/Guardian Mother ──
    sectionTitle('Parent/Guardian — Mother');
    fieldRow('Name', mother.name || `${mother.firstName || ''} ${mother.lastName || ''}`.trim());
    fieldRow('Relationship', mother.relationship);
    fieldRow('Address', mother.address || mother.streetAddress);
    fieldRowHalf('City', mother.city, 'State', mother.state);
    fieldRowHalf('Zip Code', mother.zipCode, 'County', mother.county);
    fieldRowHalf('Home Phone', mother.homePhone, 'Cell Phone', mother.cellPhone || mother.phone);
    fieldRow('Email', mother.email);
    fieldRow('Employer', mother.employer);
    fieldRow('Employer Address', mother.employerAddress);
    fieldRowHalf('Work Phone', mother.workPhone, 'Work Hours', mother.workHours);
    fieldRow('Drivers License #', mother.driversLicense);
    fieldRowHalf('DL State', mother.dlState, 'DL Expiration', mother.dlExpiration);

    // ── C. Parent/Guardian Father ──
    sectionTitle('Parent/Guardian — Father');
    fieldRow('Name', father.name || `${father.firstName || ''} ${father.lastName || ''}`.trim());
    fieldRow('Relationship', father.relationship);
    fieldRow('Address', father.address || father.streetAddress);
    fieldRowHalf('City', father.city, 'State', father.state);
    fieldRowHalf('Zip Code', father.zipCode, 'County', father.county);
    fieldRowHalf('Home Phone', father.homePhone, 'Cell Phone', father.cellPhone || father.phone);
    fieldRow('Email', father.email);
    fieldRow('Employer', father.employer);
    fieldRow('Employer Address', father.employerAddress);
    fieldRowHalf('Work Phone', father.workPhone, 'Work Hours', father.workHours);
    fieldRow('Drivers License #', father.driversLicense);
    fieldRowHalf('DL State', father.dlState, 'DL Expiration', father.dlExpiration);

    // ── D. Emergency Contacts & Authorized Pickup ──
    sectionTitle('Emergency Contacts & Authorized Pickup');
    const contacts = emergency.contacts || emergency.emergencyContacts || [];
    if (Array.isArray(contacts) && contacts.length > 0) {
      contacts.forEach((c, i) => {
        checkPage(60);
        doc.fontSize(10).font('Helvetica-Bold').fill(COLORS.accent)
          .text(`Contact #${i + 1}`, 55, y);
        y += 16;
        fieldRow('Name', c.name);
        fieldRow('Relationship', c.relationship);
        fieldRow('Phone', c.phone);
        fieldRow('Authorized for Pickup', c.authorizedPickup ? 'Yes' : 'No');
        if (i < contacts.length - 1) separator();
      });
    } else {
      // Try flat fields
      fieldRow('Contact 1 Name', emergency.contact1Name);
      fieldRow('Contact 1 Phone', emergency.contact1Phone);
      fieldRow('Contact 1 Relationship', emergency.contact1Relationship);
      separator();
      fieldRow('Contact 2 Name', emergency.contact2Name);
      fieldRow('Contact 2 Phone', emergency.contact2Phone);
      fieldRow('Contact 2 Relationship', emergency.contact2Relationship);
    }

    const authorizedPickup = emergency.authorizedPickup || emergency.authorizedPersons || [];
    if (Array.isArray(authorizedPickup) && authorizedPickup.length > 0) {
      checkPage(30);
      y += 4;
      doc.fontSize(10).font('Helvetica-Bold').fill(COLORS.accent)
        .text('Authorized Pickup Persons', 55, y);
      y += 16;
      authorizedPickup.forEach(p => {
        if (typeof p === 'string') {
          bulletItem(p);
        } else {
          fieldRow(p.name || 'Person', `${p.relationship || ''} — ${p.phone || ''}`);
        }
      });
    }

    // ── E. Payment Policy ──
    sectionTitle('Payment Policy Acknowledgments');
    const paymentAcks = payment.acknowledgments || payment.policies || [];
    if (Array.isArray(paymentAcks) && paymentAcks.length > 0) {
      paymentAcks.forEach(ack => bulletItem(typeof ack === 'string' ? ack : (ack.text || ack.policy || JSON.stringify(ack))));
    }
    // Also check for individual boolean acknowledgments
    const paymentBooleans = [
      ['tuitionAcknowledged', 'Tuition policy acknowledged'],
      ['latePaymentAcknowledged', 'Late payment policy acknowledged'],
      ['registrationFeeAcknowledged', 'Registration fee policy acknowledged'],
      ['depositAcknowledged', 'Deposit policy acknowledged'],
      ['withdrawalPolicyAcknowledged', 'Withdrawal/termination policy acknowledged'],
      ['ccmsAcknowledged', 'CCMS/subsidy policy acknowledged'],
      ['absenceAcknowledged', 'Absence policy acknowledged'],
      ['holidayAcknowledged', 'Holiday closure policy acknowledged'],
      ['allPoliciesAccepted', 'All payment policies accepted'],
    ];
    paymentBooleans.forEach(([key, label]) => {
      if (payment[key]) bulletItem(`✓ ${label}`);
    });
    if (payment.paymentMethod) fieldRow('Payment Method', payment.paymentMethod);
    if (payment.tuitionRate) fieldRow('Tuition Rate', payment.tuitionRate);

    // ── F. Medical & Emergency Information ──
    sectionTitle('Medical & Emergency Information');
    fieldRow('Physician Name', medical.physicianName || medical.doctorName);
    fieldRow('Physician Phone', medical.physicianPhone || medical.doctorPhone);
    fieldRow('Physician Address', medical.physicianAddress || medical.doctorAddress);
    fieldRow('Dentist Name', medical.dentistName);
    fieldRow('Dentist Phone', medical.dentistPhone);
    fieldRow('Preferred Hospital', medical.preferredHospital || medical.hospital);
    fieldRow('Insurance Provider', medical.insuranceProvider || medical.insurance);
    fieldRow('Policy Number', medical.policyNumber || medical.insurancePolicy);
    fieldRow('Known Allergies', medical.allergies || medical.knownAllergies);
    fieldRow('Medications', medical.medications || medical.currentMedications);
    fieldRow('Medical Conditions', medical.medicalConditions || medical.conditions);
    fieldRow('Special Dietary Needs', medical.dietaryNeeds || medical.specialDiet);
    fieldRow('Immunizations Current', medical.immunizationsCurrent ? 'Yes' : (medical.immunizationsCurrent === false ? 'No' : '—'));

    // ── G. Policies & Consent ──
    sectionTitle('Policies & Consent Forms');
    const consentItems = [
      ['liabilityWaiver', 'Liability Waiver accepted'],
      ['topicalPreparations', 'Topical Preparations consent given'],
      ['childCombination', 'Child Combination/Mixed Age Group consent given'],
      ['mediaConsent', 'Media/photo consent given'],
      ['disciplinePolicy', 'Discipline policy acknowledged'],
      ['illnessPolicy', 'Illness policy acknowledged'],
      ['fieldTripConsent', 'Field trip consent given'],
      ['waterActivities', 'Water activities consent given'],
      ['transportConsent', 'Transportation consent given'],
      ['sunscreenConsent', 'Sunscreen application consent given'],
      ['insectRepellent', 'Insect repellent consent given'],
      ['handSanitizer', 'Hand sanitizer consent given'],
      ['allConsentsGiven', 'All policies and consents accepted'],
    ];
    consentItems.forEach(([key, label]) => {
      if (policies[key]) bulletItem(`✓ ${label}`);
    });
    if (policies.additionalNotes) fieldRow('Additional Notes', policies.additionalNotes);

    // ── H. Photo/Media Authorization ──
    sectionTitle('Photo/Media Authorization');
    fieldRow('Photo Authorization', photo.authorized != null ? (photo.authorized ? 'AUTHORIZED' : 'NOT AUTHORIZED') : (photo.consent || '—'));
    if (photo.restrictions) fieldRow('Restrictions', photo.restrictions);
    if (photo.socialMedia != null) fieldRow('Social Media', photo.socialMedia ? 'Permitted' : 'Not Permitted');
    if (photo.website != null) fieldRow('Website', photo.website ? 'Permitted' : 'Not Permitted');
    if (photo.promotional != null) fieldRow('Promotional Materials', photo.promotional ? 'Permitted' : 'Not Permitted');

    // ── I. Infant Information (if applicable) ──
    const hasInfant = infant && Object.keys(infant).length > 0 && (infant.applicable || infant.feedingSchedule || infant.napSchedule || infant.formula);
    if (hasInfant) {
      sectionTitle('Infant Information');
      fieldRow('Feeding Schedule', infant.feedingSchedule);
      fieldRow('Formula/Breast Milk', infant.formula || infant.feedingType);
      fieldRow('Formula Brand', infant.formulaBrand);
      fieldRow('Nap Schedule', infant.napSchedule);
      fieldRow('Solid Foods Introduced', infant.solidFoods);
      fieldRow('Special Instructions', infant.specialInstructions);
      fieldRow('Diaper Cream', infant.diaperCream);
      fieldRow('Comfort Items', infant.comfortItems);
    }

    // ── J. CACFP/Medicaid ──
    sectionTitle('CACFP / Medicaid Information');
    fieldRow('CACFP Participation', cacfp.participates != null ? (cacfp.participates ? 'Yes' : 'No') : (cacfp.cacfpParticipation || '—'));
    fieldRow('Household Size', cacfp.householdSize);
    fieldRow('Annual Income', cacfp.annualIncome || cacfp.income);
    fieldRow('Income Frequency', cacfp.incomeFrequency);
    fieldRow('SNAP/TANF Benefits', cacfp.snapTanf != null ? (cacfp.snapTanf ? 'Yes' : 'No') : '—');
    fieldRow('Case Number', cacfp.caseNumber);
    fieldRow('Medicaid', cacfp.medicaid != null ? (cacfp.medicaid ? 'Yes' : 'No') : (cacfp.medicaidStatus || '—'));
    fieldRow('Medicaid Number', cacfp.medicaidNumber);
    fieldRow('Race/Ethnicity', cacfp.raceEthnicity || cacfp.ethnicity);

    // ── K. Transportation ──
    const hasTransport = transport && Object.keys(transport).length > 0 && (transport.needed || transport.schoolName || transport.required);
    if (hasTransport) {
      sectionTitle('Transportation Information');
      fieldRow('Transportation Needed', transport.needed ? 'Yes' : 'No');
      fieldRow('School Name', transport.schoolName);
      fieldRow('School Address', transport.schoolAddress);
      fieldRow('AM Transport', transport.amTransport || transport.morning);
      fieldRow('PM Transport', transport.pmTransport || transport.afternoon);
      fieldRow('Bus Number', transport.busNumber);
      fieldRow('Special Instructions', transport.specialInstructions);
    }

    // ── L. About Your Family ──
    sectionTitle('About Your Family');
    fieldRow('Primary Language', family.primaryLanguage || d.languagePreference);
    fieldRow('Other Languages', family.otherLanguages);
    fieldRow('Number of Siblings', family.numberOfSiblings || family.siblings);
    fieldRow('Siblings at GLAK', family.siblingsAtGLAK);
    fieldRow('How Did You Hear About Us?', family.referralSource || family.howDidYouHear);
    fieldRow('Reason for Enrollment', family.reasonForEnrollment);
    fieldRow('Special Considerations', family.specialConsiderations);
    fieldRow('Court Orders/Custody', family.custodyOrders || family.courtOrders);
    if (family.additionalInfo || d.additionalInfo) {
      fieldRow('Additional Information', family.additionalInfo || d.additionalInfo);
    }

    // ── Signature Pages ──
    doc.addPage();
    y = drawHeader();

    doc.rect(50, y, pageWidth, 30).fill('#edf2f7');
    doc.fill(COLORS.primary).fontSize(12).font('Helvetica-Bold')
      .text('SIGNATURES — Required Before Enrollment', 55, y + 8, { width: pageWidth - 10, align: 'center' });
    doc.fill(COLORS.text);
    y += 45;

    doc.fontSize(10).font('Helvetica').fill(COLORS.text)
      .text('By signing below, I acknowledge that I have read and agree to all policies and information contained in this enrollment packet. I certify that all information provided is true and accurate to the best of my knowledge.', 55, y, { width: pageWidth - 10 });
    y += 55;

    separator();

    signatureLine('Parent/Guardian — Mother');
    y += 10;
    signatureLine('Parent/Guardian — Father');
    y += 10;

    separator();
    y += 10;

    doc.fontSize(10).font('Helvetica').fill(COLORS.muted)
      .text('FOR OFFICE USE ONLY', 55, y, { width: pageWidth - 10, align: 'center' });
    y += 25;

    signatureLine('Director / Assistant Director');
    y += 10;

    fieldRow('Enrollment Date', '');
    fieldRow('Classroom Assigned', '');
    fieldRow('Rate', '');
    fieldRow('Notes', '');

    // ── Footer on every page ──
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(7).font('Helvetica').fill(COLORS.muted)
        .text(
          `${BRAND.name}  •  Enrollment Application  •  Page ${i + 1} of ${pages.count}`,
          50, doc.page.height - 35,
          { width: pageWidth, align: 'center' }
        );
    }

    doc.end();
  });
}

// ─── Enroll Endpoint ──────────────────────────────────────────────────────────

app.post('/api/enroll', async (req, res) => {
  try {
    const data = req.body;

    // Derive names for the email subject/filename
    const child = data.childInformation || data.child || {};
    const mother = data.parentGuardianMother || data.mother || {};
    const childFirst = child.firstName || child.childName || 'Child';
    const childLast = child.lastName || '';
    const childFullName = `${childFirst} ${childLast}`.trim();
    const parentName = mother.name || `${mother.firstName || ''} ${mother.lastName || ''}`.trim() || data.parentName || 'Parent';
    const parentEmail = mother.email || data.email || '';
    const filenameSafe = (childLast || childFirst || 'Enrollment').replace(/[^a-zA-Z0-9]/g, '');

    // Validate minimum fields
    if (!parentEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing parent email address',
      });
    }

    // Generate PDF
    console.log(`Generating enrollment PDF for ${childFullName}...`);
    const pdfBuffer = await generateEnrollmentPDF(data);
    console.log(`PDF generated: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

    const attachmentFilename = `GLAK_Enrollment_${filenameSafe}.pdf`;

    // Email to parent
    const parentEmailResult = await resend.emails.send({
      from: 'Genesis Learning Academy <glak@emails.brogrammersagency.com>',
      to: [parentEmail],
      subject: 'Your Genesis Learning Academy Enrollment Packet',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a202c;">
          <div style="background-color: #1a365d; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Genesis Learning Academy of Killeen</h1>
            <p style="color: #e2e8f0; margin: 5px 0 0;">4604 Westcliff Rd, Killeen, TX 76543</p>
          </div>
          <div style="padding: 30px 20px;">
            <p>Dear ${parentName},</p>
            <p>Thank you for choosing Genesis Learning Academy for ${childFullName}'s care and education!</p>
            <p>Attached you will find your <strong>Enrollment Application Packet</strong>. Please:</p>
            <ol>
              <li><strong>Print</strong> the attached PDF</li>
              <li><strong>Review</strong> all information for accuracy</li>
              <li><strong>Sign</strong> the signature pages (both parents/guardians if applicable)</li>
              <li><strong>Bring</strong> the signed packet to our center at your earliest convenience</li>
            </ol>
            <p><strong>What to bring with you:</strong></p>
            <ul>
              <li>Signed enrollment packet</li>
              <li>Child's immunization records</li>
              <li>Copy of birth certificate</li>
              <li>Photo ID of parent/guardian</li>
              <li>Court orders (if applicable)</li>
            </ul>
            <p>If you have any questions, please call us at <strong>(254) 213-5005</strong>.</p>
            <p>We look forward to welcoming ${childFirst} to our GLAK family!</p>
            <p style="margin-top: 30px;">Warm regards,<br><strong>Genesis Learning Academy of Killeen</strong></p>
          </div>
          <div style="background-color: #edf2f7; padding: 15px; text-align: center; font-size: 12px; color: #718096;">
            <p>Genesis Learning Academy of Killeen<br>4604 Westcliff Rd, Killeen, TX 76543 | (254) 213-5005</p>
          </div>
        </div>
      `,
      attachments: [{
        filename: attachmentFilename,
        content: pdfBuffer,
      }],
    });

    if (parentEmailResult.error) {
      console.error('Parent email error:', parentEmailResult.error);
    }

    // Email to staff
    const staffEmailResult = await resend.emails.send({
      from: 'Genesis Learning Academy <glak@emails.brogrammersagency.com>',
      to: ['jay@brogrammers.agency'],
      subject: `New Enrollment: ${parentName} for ${childFullName}`,
      replyTo: parentEmail,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a202c;">
          <div style="background-color: #1a365d; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">📋 New Enrollment Application</h1>
          </div>
          <div style="padding: 20px;">
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
              <tr style="background:#edf2f7;"><td style="padding:8px; font-weight:bold;">Child</td><td style="padding:8px;">${childFullName}</td></tr>
              <tr><td style="padding:8px; font-weight:bold;">DOB</td><td style="padding:8px;">${child.dateOfBirth || '—'}</td></tr>
              <tr style="background:#edf2f7;"><td style="padding:8px; font-weight:bold;">Age Group</td><td style="padding:8px;">${child.ageGroup || child.childAge || '—'}</td></tr>
              <tr><td style="padding:8px; font-weight:bold;">Parent</td><td style="padding:8px;">${parentName}</td></tr>
              <tr style="background:#edf2f7;"><td style="padding:8px; font-weight:bold;">Email</td><td style="padding:8px;"><a href="mailto:${parentEmail}">${parentEmail}</a></td></tr>
              <tr><td style="padding:8px; font-weight:bold;">Phone</td><td style="padding:8px;">${mother.cellPhone || mother.phone || data.phone || '—'}</td></tr>
              <tr style="background:#edf2f7;"><td style="padding:8px; font-weight:bold;">Start Date</td><td style="padding:8px;">${child.preferredStartDate || child.startDate || '—'}</td></tr>
              <tr><td style="padding:8px; font-weight:bold;">Enrollment Type</td><td style="padding:8px;">${child.enrollmentType || '—'}</td></tr>
            </table>
            <p>Full enrollment packet is attached as PDF. Please review and prepare for the family's visit.</p>
            <p style="color:#718096; font-size:12px;">Reply to this email to contact the parent directly at ${parentEmail}.</p>
          </div>
        </div>
      `,
      attachments: [{
        filename: attachmentFilename,
        content: pdfBuffer,
      }],
    });

    if (staffEmailResult.error) {
      console.error('Staff email error:', staffEmailResult.error);
    }

    console.log(`Enrollment emails sent for ${childFullName}`);

    res.json({
      success: true,
      message: 'Enrollment submitted successfully. Check your email for the enrollment packet.',
      emailId: parentEmailResult.data?.id,
      staffEmailId: staffEmailResult.data?.id,
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process enrollment',
      details: error.message,
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on http://0.0.0.0:${PORT}`);
});
