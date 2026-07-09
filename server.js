import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const STAFF_EMAIL = process.env.STAFF_EMAIL || 'jay@brogrammers.agency';
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Resend
if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set; email endpoints will fail until configured.');
}
const resend = new Resend(process.env.RESEND_API_KEY);


const dbConfig = process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD
  ? {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: 5,
      namedPlaceholders: true,
      timezone: 'Z',
    }
  : null;

let dbPool;
function getDbPool() {
  if (!dbConfig) return null;
  if (!dbPool) dbPool = mysql.createPool(dbConfig);
  return dbPool;
}

function getRequestMeta(req) {
  const forwardedFor = String(req.headers['x-forwarded-for'] || '');
  return {
    ipAddress: forwardedFor.split(',')[0].trim() || req.ip || req.socket?.remoteAddress || null,
    userAgent: String(req.headers['user-agent'] || '').slice(0, 500) || null,
    referrer: String(req.headers.referer || req.headers.referrer || '').slice(0, 1000) || null,
  };
}

async function ensureLeadTables() {
  const pool = getDbPool();
  if (!pool) {
    console.warn('Database env vars are not set; lead persistence is disabled.');
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      parent_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(100) NULL,
      child_age VARCHAR(100) NULL,
      interest VARCHAR(255) NULL,
      message TEXT NULL,
      ip_address VARCHAR(100) NULL,
      user_agent VARCHAR(500) NULL,
      referrer VARCHAR(1000) NULL,
      staff_email_id VARCHAR(255) NULL,
      auto_reply_email_id VARCHAR(255) NULL,
      email_status VARCHAR(50) NOT NULL DEFAULT 'pending',
      raw_payload JSON NULL,
      INDEX idx_contact_created_at (created_at),
      INDEX idx_contact_email (email),
      INDEX idx_contact_phone (phone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS enrollment_submissions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      parent_name VARCHAR(255) NULL,
      parent_email VARCHAR(255) NOT NULL,
      parent_phone VARCHAR(100) NULL,
      child_full_name VARCHAR(255) NULL,
      child_birth_date VARCHAR(100) NULL,
      child_age VARCHAR(100) NULL,
      preferred_start_date VARCHAR(100) NULL,
      enrollment_type VARCHAR(255) NULL,
      ip_address VARCHAR(100) NULL,
      user_agent VARCHAR(500) NULL,
      referrer VARCHAR(1000) NULL,
      parent_email_id VARCHAR(255) NULL,
      staff_email_id VARCHAR(255) NULL,
      email_status VARCHAR(50) NOT NULL DEFAULT 'pending',
      pdf_size_bytes INT UNSIGNED NULL,
      raw_payload JSON NULL,
      INDEX idx_enrollment_created_at (created_at),
      INDEX idx_enrollment_parent_email (parent_email),
      INDEX idx_enrollment_parent_phone (parent_phone),
      INDEX idx_enrollment_child (child_full_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lead_events (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      event_type VARCHAR(100) NOT NULL,
      source VARCHAR(100) NOT NULL,
      source_id BIGINT UNSIGNED NULL,
      lead_email VARCHAR(255) NULL,
      lead_phone VARCHAR(100) NULL,
      lead_name VARCHAR(255) NULL,
      metadata JSON NULL,
      INDEX idx_events_created_at (created_at),
      INDEX idx_events_type (event_type),
      INDEX idx_events_email (lead_email),
      INDEX idx_events_phone (lead_phone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

async function saveContactSubmission({ data, meta }) {
  const pool = getDbPool();
  if (!pool) return null;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO contact_submissions
        (parent_name, email, phone, child_age, interest, message, ip_address, user_agent, referrer, raw_payload)
       VALUES (:parentName, :email, :phone, :childAge, :interest, :message, :ipAddress, :userAgent, :referrer, CAST(:rawPayload AS JSON))`,
      {
        parentName: data.parentName,
        email: data.email,
        phone: data.phone || null,
        childAge: data.childAge || null,
        interest: data.interest || null,
        message: data.message || null,
        ...meta,
        rawPayload: JSON.stringify(data),
      }
    );
    await connection.execute(
      `INSERT INTO lead_events (event_type, source, source_id, lead_email, lead_phone, lead_name, metadata)
       VALUES ('contact_form_submission', 'contact_form', :sourceId, :email, :phone, :leadName, CAST(:metadata AS JSON))`,
      {
        sourceId: result.insertId,
        email: data.email,
        phone: data.phone || null,
        leadName: data.parentName,
        metadata: JSON.stringify({ interest: data.interest, childAge: data.childAge }),
      }
    );
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateContactEmailStatus(id, { staffEmailId, autoReplyEmailId, status }) {
  const pool = getDbPool();
  if (!pool || !id) return;
  await pool.execute(
    `UPDATE contact_submissions
     SET staff_email_id = :staffEmailId, auto_reply_email_id = :autoReplyEmailId, email_status = :status
     WHERE id = :id`,
    { id, staffEmailId: staffEmailId || null, autoReplyEmailId: autoReplyEmailId || null, status }
  );
}

async function saveEnrollmentSubmission({ data, meta, derived, pdfSizeBytes }) {
  const pool = getDbPool();
  if (!pool) return null;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO enrollment_submissions
        (parent_name, parent_email, parent_phone, child_full_name, child_birth_date, child_age,
         preferred_start_date, enrollment_type, ip_address, user_agent, referrer, pdf_size_bytes, raw_payload)
       VALUES (:parentName, :parentEmail, :parentPhone, :childFullName, :childBirthDate, :childAge,
         :preferredStartDate, :enrollmentType, :ipAddress, :userAgent, :referrer, :pdfSizeBytes, CAST(:rawPayload AS JSON))`,
      {
        parentName: derived.parentName || null,
        parentEmail: derived.parentEmail,
        parentPhone: derived.parentPhone || null,
        childFullName: derived.childFullName || null,
        childBirthDate: derived.childBirthDate || null,
        childAge: derived.childAge || null,
        preferredStartDate: derived.preferredStartDate || null,
        enrollmentType: derived.enrollmentType || null,
        ...meta,
        pdfSizeBytes,
        rawPayload: JSON.stringify(data),
      }
    );
    await connection.execute(
      `INSERT INTO lead_events (event_type, source, source_id, lead_email, lead_phone, lead_name, metadata)
       VALUES ('enrollment_form_submission', 'enrollment_form', :sourceId, :email, :phone, :leadName, CAST(:metadata AS JSON))`,
      {
        sourceId: result.insertId,
        email: derived.parentEmail,
        phone: derived.parentPhone || null,
        leadName: derived.parentName || null,
        metadata: JSON.stringify({ childFullName: derived.childFullName, enrollmentType: derived.enrollmentType }),
      }
    );
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateEnrollmentEmailStatus(id, { parentEmailId, staffEmailId, status }) {
  const pool = getDbPool();
  if (!pool || !id) return;
  await pool.execute(
    `UPDATE enrollment_submissions
     SET parent_email_id = :parentEmailId, staff_email_id = :staffEmailId, email_status = :status
     WHERE id = :id`,
    { id, parentEmailId: parentEmailId || null, staffEmailId: staffEmailId || null, status }
  );
}

// ─── PDF Generation ───────────────────────────────────────────────────────────

const BRAND = {
  name: 'Genesis Learning Academy of Kennesaw',
  address: '2098 Carruth St NW, Kennesaw, GA 30144',
  phone: '(770) 672-4255',
};

const COLORS = {
  primary: '#1a365d',    // dark navy
  accent: '#2b6cb0',     // medium blue
  text: '#1a202c',
  muted: '#4a5568',
  line: '#cbd5e0',
};

const PDF_GENERATION_TIMEOUT_MS = 30_000;

function generateEnrollmentPDF(data) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`PDF generation timed out after ${PDF_GENERATION_TIMEOUT_MS}ms`));
    }, PDF_GENERATION_TIMEOUT_MS);

    const finish = (error, buffer) => {
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve(buffer);
    };

    try {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => finish(null, Buffer.concat(chunks)));
      doc.on('error', (error) => finish(error));

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

    // Safely get nested data — field names match frontend schema (src/types/enrollment.ts)
    const d = data || {};
    const child = d.childInfo || {};
    const parent1 = (d.parentGuardian && d.parentGuardian.parent1) || {};
    const parent2 = (d.parentGuardian && d.parentGuardian.parent2) || {};
    const guardian = d.parentGuardian || {};
    const emergency = d.emergencyContacts || {};
    const payment = d.paymentPolicies || {};
    const medical = d.medicalInfo || {};
    const policies = d.policiesConsent || {};
    const photo = d.photoMedia || {};
    const infant = d.infantInfo || {};
    const cacfp = d.cacfp || {};
    const transport = d.transportation || {};
    const family = d.aboutFamily || {};

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
    fieldRow('Full Name', child.childFullName);
    fieldRowHalf('Birth Date', child.childBirthDate, 'Sex', child.childSex);
    fieldRow('Nick Name', child.childNickName);
    fieldRow('Home Address', child.childHomeAddress);
    fieldRowHalf('City', child.childCity, 'State', child.childState);
    fieldRow('Zip Code', child.childZipCode);
    fieldRow('Home Phone', child.childHomePhone);

    // ── B. Parent/Guardian #1 ──
    sectionTitle('1st Parent/Guardian');
    fieldRow('Full Name', parent1.fullName);
    fieldRow('Birth Date', parent1.birthDate);
    fieldRow('Home Address', parent1.homeAddress);
    fieldRowHalf('City', parent1.city, 'State', parent1.state);
    fieldRow('Zip Code', parent1.zipCode);
    fieldRowHalf('Home Phone', parent1.homePhone, 'Cell Phone', parent1.cellPhone);
    fieldRow('Email', parent1.email);
    fieldRow('Occupation', parent1.occupation);
    fieldRow('Employer', parent1.employerName);
    fieldRow('Employer Address', parent1.employerAddress);
    fieldRowHalf('Work Phone', parent1.workPhone, 'Work Hours', parent1.workHours);

    // ── C. Parent/Guardian #2 ──
    const hasParent2 = parent2.fullName || parent2.cellPhone || parent2.email;
    if (hasParent2) {
      sectionTitle('2nd Parent/Guardian');
      fieldRow('Full Name', parent2.fullName);
      fieldRow('Birth Date', parent2.birthDate);
      fieldRow('Home Address', parent2.homeAddress);
      fieldRowHalf('City', parent2.city, 'State', parent2.state);
      fieldRow('Zip Code', parent2.zipCode);
      fieldRowHalf('Home Phone', parent2.homePhone, 'Cell Phone', parent2.cellPhone);
      fieldRow('Email', parent2.email);
      fieldRow('Occupation', parent2.occupation);
      fieldRow('Employer', parent2.employerName);
      fieldRow('Employer Address', parent2.employerAddress);
      fieldRowHalf('Work Phone', parent2.workPhone, 'Work Hours', parent2.workHours);
    }
    fieldRow('Legal Custody Parent', guardian.legalCustodyParent);
    fieldRow('Parental Status', guardian.parentalStatus);
    // Household members
    const members = guardian.otherHouseholdMembers || [];
    const filledMembers = members.filter(m => m && m.name);
    if (filledMembers.length > 0) {
      checkPage(30);
      doc.fontSize(10).font('Helvetica-Bold').fill(COLORS.accent)
        .text('Other Household Members', 55, y);
      y += 16;
      filledMembers.forEach(m => {
        fieldRow(m.name, `Age: ${m.age || '—'}, Relationship: ${m.relationship || '—'}`);
      });
    }

    // ── D. Emergency Contacts & Authorized Pickup ──
    sectionTitle('Emergency Contacts & Authorized Pickup');
    const ec1 = emergency.emergencyContact1 || {};
    const ec2 = emergency.emergencyContact2 || {};
    checkPage(60);
    doc.fontSize(10).font('Helvetica-Bold').fill(COLORS.accent)
      .text('Emergency Contact #1', 55, y);
    y += 16;
    fieldRow('Name', ec1.name);
    fieldRowHalf('Home/Cell', ec1.homeCell, 'Work Phone', ec1.workPhone);
    fieldRow('Relationship', ec1.relationship);
    fieldRow('Address', ec1.address);
    fieldRow('City/State/Zip', ec1.cityStateZip);
    separator();
    if (ec2.name) {
      doc.fontSize(10).font('Helvetica-Bold').fill(COLORS.accent)
        .text('Emergency Contact #2', 55, y);
      y += 16;
      fieldRow('Name', ec2.name);
      fieldRowHalf('Home/Cell', ec2.homeCell, 'Work Phone', ec2.workPhone);
      fieldRow('Relationship', ec2.relationship);
      fieldRow('Address', ec2.address);
      fieldRow('City/State/Zip', ec2.cityStateZip);
      separator();
    }
    fieldRow('Kid Code (Secret Pickup Word)', emergency.kidCode);

    // Authorized Pickup
    const ap1 = emergency.authorizedPickup1 || {};
    const ap2 = emergency.authorizedPickup2 || {};
    if (ap1.name || ap2.name) {
      checkPage(30);
      doc.fontSize(10).font('Helvetica-Bold').fill(COLORS.accent)
        .text('Authorized Pickup Persons', 55, y);
      y += 16;
      if (ap1.name) {
        fieldRow(ap1.name, `${ap1.relationship || '—'} — ${ap1.homeCell || '—'}`);
        if (ap1.address) fieldRow('Address', ap1.address);
      }
      if (ap2.name) {
        fieldRow(ap2.name, `${ap2.relationship || '—'} — ${ap2.homeCell || '—'}`);
        if (ap2.address) fieldRow('Address', ap2.address);
      }
    }

    // Unauthorized Pickup
    const up1 = emergency.unauthorizedPickup1 || {};
    const up2 = emergency.unauthorizedPickup2 || {};
    if (up1.name || up2.name) {
      checkPage(30);
      doc.fontSize(10).font('Helvetica-Bold').fill(COLORS.accent)
        .text('NOT Authorized for Pickup', 55, y);
      y += 16;
      if (up1.name) fieldRow(up1.name, up1.comment);
      if (up2.name) fieldRow(up2.name, up2.comment);
    }

    // ── E. Payment Policy ──
    sectionTitle('Payment Policy Acknowledgments');
    const paymentAcks = [
      ['ackHoursOvertime', 'Hours & overtime policy acknowledged'],
      ['ackPaymentDeadline', 'Payment deadline policy acknowledged'],
      ['ackRegistrationFee', 'Registration fee policy acknowledged'],
      ['ackVacationPolicy', 'Vacation policy acknowledged'],
      ['ackNoAbsenceDiscounts', 'No absence discounts policy acknowledged'],
      ['ackDisenrollmentNotice', 'Disenrollment notice policy acknowledged'],
      ['ackAgeGrouping', 'Age grouping policy acknowledged'],
      ['ackEscortPolicy', 'Escort policy acknowledged'],
      ['ackTransportationFee', 'Transportation fee acknowledged'],
      ['ackDayServicePayment', 'Day service payment acknowledged'],
    ];
    paymentAcks.forEach(([key, label]) => {
      if (payment[key]) bulletItem(`✓ ${label}`);
    });
    if (payment.isAfterSchool) fieldRow('After School Program', 'Yes');

    // ── F. Medical & Emergency Information ──
    sectionTitle('Medical & Emergency Information');
    fieldRow('Physician Name', medical.physicianName);
    fieldRow('Physician Phone', medical.physicianPhone);
    fieldRow('Preferred Hospital', medical.preferredHospital);
    fieldRow('Hospital Phone', medical.hospitalPhone);
    fieldRow('Blood Type', medical.bloodType);
    fieldRow('Regular Medications', medical.regularMedications);
    fieldRow('Medical Allergies', medical.medicalAllergies);
    fieldRow('Food Allergies', medical.foodAllergies);
    fieldRow('Other Allergies', medical.otherAllergies);
    fieldRow('Special Health Conditions', medical.specialHealthConditions);
    if (medical.ackEmergencyMedicalCare) bulletItem('✓ Emergency medical care authorized');

    // ── G. Policies & Consent ──
    sectionTitle('Policies & Consent Forms');
    if (policies.ackNoLiabilityInsurance) bulletItem('✓ No liability insurance policy acknowledged');
    if (policies.ackChildCombination) bulletItem('✓ Child combination/mixed age group policy acknowledged');
    // Topical preparations
    const topicals = [
      ['topicalBabyWipes', 'Baby Wipes'], ['topicalBandAids', 'Band-Aids'],
      ['topicalNeosporin', 'Neosporin'], ['topicalBactine', 'Bactine'],
      ['topicalSunscreen', 'Sunscreen'], ['topicalInsectRepellent', 'Insect Repellent'],
      ['topicalNonRxOintment', 'Non-Rx Ointment'], ['topicalBabyPowder', 'Baby Powder'],
      ['topicalOther', 'Other'],
    ];
    const approvedTopicals = topicals.filter(([key]) => policies[key]).map(([, label]) => label);
    if (approvedTopicals.length > 0) {
      fieldRow('Topical Preparations Authorized', approvedTopicals.join(', '));
    }
    if (policies.topicalOtherSpecify) fieldRow('Other Topical', policies.topicalOtherSpecify);

    // ── H. Photo/Media Authorization ──
    sectionTitle('Photo/Media Authorization');
    fieldRow('Photo Authorization', photo.photoAuthorization);

    // ── I. Infant Information (if applicable) ──
    const hasInfant = infant && (infant.ackSafeSleep || infant.takesBottle || infant.formulaType);
    if (hasInfant) {
      sectionTitle('Infant Information');
      if (infant.ackSafeSleep) bulletItem('✓ Safe sleep policy acknowledged');
      fieldRow('Takes Bottle', infant.takesBottle);
      fieldRow('Bottle Warmed', infant.bottleWarmed);
      fieldRow('Holds Own Bottle', infant.holdsOwnBottle);
      fieldRow('Feeds Self', infant.feedsSelf);
      // Food types
      const foodTypes = [
        ['foodStrained', 'Strained'], ['foodBaby', 'Baby Food'], ['foodFormula', 'Formula'],
        ['foodWholeMilk', 'Whole Milk'], ['foodTable', 'Table Food'], ['foodOther', 'Other'],
      ];
      const selectedFoods = foodTypes.filter(([key]) => infant[key]).map(([, label]) => label);
      if (selectedFoods.length > 0) fieldRow('Food Types', selectedFoods.join(', '));
      if (infant.foodOtherSpecify) fieldRow('Other Food', infant.foodOtherSpecify);
      fieldRow('Formula Type', infant.formulaType);
      fieldRow('Formula Amount', infant.formulaAmount);
      fieldRow('Formula Schedule', infant.formulaSchedule);
      fieldRow('Formula Option', infant.formulaOption);
      fieldRow('Pacifier Use', infant.pacifierUse);
      fieldRow('Pacifier When', infant.pacifierWhen);
      // Developmental milestones
      if (infant.devRollOver || infant.devSitAlone || infant.devCrawl || infant.devWalk) {
        fieldRowHalf('Roll Over', infant.devRollOver, 'Sit Alone', infant.devSitAlone);
        fieldRowHalf('Crawl', infant.devCrawl, 'Walk', infant.devWalk);
      }
      fieldRow('Food Likes', infant.foodLikes);
      fieldRow('Food Dislikes', infant.foodDislikes);
      fieldRow('Food Allergies', infant.foodAllergiesInfant);
      fieldRow('Solid Foods Instructions', infant.solidFoodsInstructions);
    }

    // ── J. CACFP/Medicaid ──
    sectionTitle('CACFP / Medicaid Information');
    if (cacfp.optOutMedicaidSharing) bulletItem('Opted out of Medicaid sharing');
    fieldRow('SNAP/TANF Case #', cacfp.snapTanfCase);
    // Categories
    const categories = [
      ['catHeadStart', 'Head Start'], ['catFosterChild', 'Foster Child'],
      ['catMigrant', 'Migrant'], ['catRunaway', 'Runaway'], ['catHomeless', 'Homeless'],
    ];
    const selectedCats = categories.filter(([key]) => cacfp[key]).map(([, label]) => label);
    if (selectedCats.length > 0) fieldRow('Categories', selectedCats.join(', '));
    fieldRow('Household Income', cacfp.householdIncome);
    fieldRow('Household Size', cacfp.householdSize);
    fieldRow('Hispanic/Latino', cacfp.ethnicHispanic);
    // Race
    const races = [
      ['raceAmericanIndian', 'American Indian/Alaska Native'], ['raceAsian', 'Asian'],
      ['raceBlack', 'Black/African American'], ['raceHawaiian', 'Native Hawaiian/Pacific Islander'],
      ['raceWhite', 'White'],
    ];
    const selectedRaces = races.filter(([key]) => cacfp[key]).map(([, label]) => label);
    if (selectedRaces.length > 0) fieldRow('Race', selectedRaces.join(', '));
    // Meals
    const meals = [
      ['mealBreakfast', 'Breakfast'], ['mealAMSnack', 'AM Snack'], ['mealLunch', 'Lunch'],
      ['mealPMSnack', 'PM Snack'], ['mealSupper', 'Supper'], ['mealEveningSnack', 'Evening Snack'],
    ];
    const selectedMeals = meals.filter(([key]) => cacfp[key]).map(([, label]) => label);
    if (selectedMeals.length > 0) fieldRow('Meals', selectedMeals.join(', '));
    // Days
    const days = [
      ['dayMon', 'Mon'], ['dayTue', 'Tue'], ['dayWed', 'Wed'],
      ['dayThu', 'Thu'], ['dayFri', 'Fri'], ['daySat', 'Sat'],
    ];
    const selectedDays = days.filter(([key]) => cacfp[key]).map(([, label]) => label);
    if (selectedDays.length > 0) fieldRow('Days of Attendance', selectedDays.join(', '));
    fieldRow('Hours of Attendance', cacfp.hoursOfAttendance);

    // ── K. Transportation ──
    const hasTransport = transport && (transport.transFatherName || transport.transMotherName || transport.transPickupLocation);
    if (hasTransport) {
      sectionTitle('Transportation Information');
      fieldRowHalf('Father Name', transport.transFatherName, 'Father Phone', transport.transFatherPhone);
      fieldRowHalf('Mother Name', transport.transMotherName, 'Mother Phone', transport.transMotherPhone);
      fieldRowHalf('Emergency Contact', transport.transEmergencyContact, 'Emergency Phone', transport.transEmergencyPhone);
      fieldRowHalf('Doctor Name', transport.transDoctorName, 'Doctor Phone', transport.transDoctorPhone);
      fieldRow('Pickup Location', transport.transPickupLocation);
      fieldRow('Delivery Location', transport.transDeliveryLocation);
      fieldRowHalf('Pickup Time', transport.transPickupTime, 'Delivery Time', transport.transDeliveryTime);
      const transDays = [
        ['transDayMon', 'Mon'], ['transDayTue', 'Tue'], ['transDayWed', 'Wed'],
        ['transDayThu', 'Thu'], ['transDayFri', 'Fri'],
      ];
      const selectedTransDays = transDays.filter(([key]) => transport[key]).map(([, label]) => label);
      if (selectedTransDays.length > 0) fieldRow('Transportation Days', selectedTransDays.join(', '));
      fieldRow('Authorized Person', transport.transAuthorizedPerson);
    }

    // ── L. About Your Family ──
    sectionTitle('About Your Family');
    fieldRow('Family Members', family.familyMembers);
    fieldRow('Birthday', family.familyBirthday);
    fieldRow('Activities', family.familyActivities);
    fieldRow('Strengths', family.familyStrengths);
    fieldRow('Areas to Work On', family.familyWorkOn);
    fieldRow('Medical Needs', family.familyMedicalNeeds);
    fieldRow('Other Information', family.familyOtherInfo);

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

    signatureLine('1st Parent/Guardian');
    y += 10;
    signatureLine('2nd Parent/Guardian');
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

    doc.end();
    } catch (error) {
      finish(error);
    }
  }).catch((error) => {
    console.error('PDF generation failed:', error);
    throw error;
  });
}

// ─── Enroll Endpoint ──────────────────────────────────────────────────────────

app.post('/api/enroll', async (req, res) => {
  try {
    const data = req.body;

    // Derive names for the email subject/filename
    // Frontend sends: data.childInfo.childFullName, data.parentGuardian.parent1.{fullName,email}
    const child = data.childInfo || data.childInformation || data.child || {};
    const parent1 = (data.parentGuardian && data.parentGuardian.parent1) || {};
    const mother = data.parentGuardianMother || data.mother || {};
    const childFullName = child.childFullName || `${child.firstName || child.childName || 'Child'} ${child.lastName || ''}`.trim();
    const parentName = parent1.fullName || mother.name || `${mother.firstName || ''} ${mother.lastName || ''}`.trim() || data.parentName || 'Parent';
    const parentEmail = parent1.email || mother.email || data.email || '';
    const filenameSafe = (childFullName || 'Enrollment').replace(/[^a-zA-Z0-9]/g, '');

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

    const meta = getRequestMeta(req);
    const parentPhone = parent1.cellPhone || parent1.homePhone || '';
    const derivedSubmission = {
      parentName,
      parentEmail,
      parentPhone,
      childFullName,
      childBirthDate: child.childBirthDate || '',
      childAge: child.childAge || '',
      preferredStartDate: child.preferredStartDate || child.startDate || '',
      enrollmentType: child.enrollmentType || '',
    };
    let enrollmentSubmissionId = null;
    try {
      enrollmentSubmissionId = await saveEnrollmentSubmission({
        data,
        meta,
        derived: derivedSubmission,
        pdfSizeBytes: pdfBuffer.length,
      });
    } catch (dbError) {
      console.error('Failed to save enrollment submission:', dbError);
      return res.status(500).json({ success: false, error: 'Failed to save enrollment request' });
    }

    const attachmentFilename = `GLAK_Enrollment_${filenameSafe}.pdf`;

    const parentEmailPayload = {
      from: 'Genesis Learning Academy <glak@emails.brogrammersagency.com>',
      to: [parentEmail],
      subject: 'Your Genesis Learning Academy Enrollment Packet',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a202c;">
          <div style="background-color: #1a365d; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Genesis Learning Academy of Kennesaw</h1>
            <p style="color: #e2e8f0; margin: 5px 0 0;">2098 Carruth St NW, Kennesaw, GA 30144</p>
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
            <p>If you have any questions, please call us at <strong>(770) 672-4255</strong>.</p>
            <p>We look forward to welcoming ${childFullName} to our GLAK family!</p>
            <p style="margin-top: 30px;">Warm regards,<br><strong>Genesis Learning Academy of Kennesaw</strong></p>
          </div>
          <div style="background-color: #edf2f7; padding: 15px; text-align: center; font-size: 12px; color: #718096;">
            <p>Genesis Learning Academy of Kennesaw<br>2098 Carruth St NW, Kennesaw, GA 30144 | (770) 672-4255</p>
          </div>
        </div>
      `,
      attachments: [{
        filename: attachmentFilename,
        content: pdfBuffer,
      }],
    };

    const staffEmailPayload = {
      from: 'Genesis Learning Academy <glak@emails.brogrammersagency.com>',
      to: [STAFF_EMAIL],
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
              <tr><td style="padding:8px; font-weight:bold;">DOB</td><td style="padding:8px;">${child.childBirthDate || '—'}</td></tr>
              <tr style="background:#edf2f7;"><td style="padding:8px; font-weight:bold;">Sex</td><td style="padding:8px;">${child.childSex || '—'}</td></tr>
              <tr><td style="padding:8px; font-weight:bold;">Parent</td><td style="padding:8px;">${parentName}</td></tr>
              <tr style="background:#edf2f7;"><td style="padding:8px; font-weight:bold;">Email</td><td style="padding:8px;"><a href="mailto:${parentEmail}">${parentEmail}</a></td></tr>
              <tr><td style="padding:8px; font-weight:bold;">Phone</td><td style="padding:8px;">${parent1.cellPhone || parent1.homePhone || '—'}</td></tr>
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
    };

    const [parentEmailResult, staffEmailResult] = await Promise.all([
      resend.emails.send(parentEmailPayload),
      resend.emails.send(staffEmailPayload),
    ]);

    if (parentEmailResult.error) {
      console.error('Parent email error:', parentEmailResult.error);
    }
    if (staffEmailResult.error) {
      console.error('Staff email error:', staffEmailResult.error);
    }

    await updateEnrollmentEmailStatus(enrollmentSubmissionId, {
      parentEmailId: parentEmailResult.data?.id,
      staffEmailId: staffEmailResult.data?.id,
      status: parentEmailResult.error || staffEmailResult.error ? 'partial_error' : 'sent',
    });

    console.log(`Enrollment emails sent for ${childFullName}`);

    res.json({
      success: true,
      message: 'Enrollment submitted successfully. Check your email for the enrollment packet.',
      emailId: parentEmailResult.data?.id,
      staffEmailId: staffEmailResult.data?.id,
      submissionId: enrollmentSubmissionId,
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


function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── Contact / Visit Request Endpoint ─────────────────────────────────────────

app.post('/api/contact', async (req, res) => {
  try {
    const data = req.body || {};
    const parentName = String(data.parentName || '').trim();
    const email = String(data.email || '').trim();
    const phone = String(data.phone || '').trim();
    const childAge = String(data.childAge || '').trim();
    const interest = String(data.interest || '').trim();
    const message = String(data.message || '').trim();

    if (!parentName || !email || !interest || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please include your name, email, reason for reaching out, and message.',
      });
    }

    const meta = getRequestMeta(req);
    let contactSubmissionId = null;
    try {
      contactSubmissionId = await saveContactSubmission({
        data: { parentName, email, phone, childAge, interest, message },
        meta,
      });
    } catch (dbError) {
      console.error('Failed to save contact submission:', dbError);
      return res.status(500).json({ success: false, error: 'Failed to save contact request' });
    }

    const safe = {
      parentName: escapeHtml(parentName),
      email: escapeHtml(email),
      phone: escapeHtml(phone || '—'),
      childAge: escapeHtml(childAge || '—'),
      interest: escapeHtml(interest),
      message: escapeHtml(message).replace(/\n/g, '<br>'),
    };

    const staffEmailResult = await resend.emails.send({
      from: 'Genesis Learning Academy <glak@emails.brogrammersagency.com>',
      to: [STAFF_EMAIL],
      subject: `New Genesis inquiry: ${interest} — ${parentName}`,
      replyTo: email,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1a202c;">
          <div style="background-color: #1a365d; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">New Genesis Learning Academy Inquiry</h1>
          </div>
          <div style="padding: 22px;">
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
              <tr style="background:#edf2f7;"><td style="padding:8px; font-weight:bold;">Parent/Guardian</td><td style="padding:8px;">${safe.parentName}</td></tr>
              <tr><td style="padding:8px; font-weight:bold;">Email</td><td style="padding:8px;"><a href="mailto:${safe.email}">${safe.email}</a></td></tr>
              <tr style="background:#edf2f7;"><td style="padding:8px; font-weight:bold;">Phone</td><td style="padding:8px;">${safe.phone}</td></tr>
              <tr><td style="padding:8px; font-weight:bold;">Child Age / Program</td><td style="padding:8px;">${safe.childAge}</td></tr>
              <tr style="background:#edf2f7;"><td style="padding:8px; font-weight:bold;">Interest</td><td style="padding:8px;">${safe.interest}</td></tr>
            </table>
            <h2 style="font-size:16px; color:#1a365d;">Message</h2>
            <p style="line-height:1.6;">${safe.message}</p>
            <p style="color:#718096; font-size:12px; margin-top:24px;">Reply to this email to contact the parent directly at ${safe.email}.</p>
          </div>
        </div>
      `,
    });

    if (staffEmailResult.error) {
      console.error('Contact email error:', staffEmailResult.error);
      await updateContactEmailStatus(contactSubmissionId, {
        staffEmailId: staffEmailResult.data?.id,
        autoReplyEmailId: null,
        status: 'staff_email_error',
      });
      return res.status(500).json({ success: false, error: 'Failed to send contact request' });
    }

    const autoReplyEmailResult = await resend.emails.send({
      from: 'Genesis Learning Academy <glak@emails.brogrammersagency.com>',
      to: [email],
      subject: 'We received your Genesis Learning Academy message',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a202c;">
          <div style="background-color: #1a365d; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Genesis Learning Academy of Kennesaw</h1>
          </div>
          <div style="padding: 30px 20px;">
            <p>Dear ${safe.parentName},</p>
            <p>Thank you for reaching out to Genesis Learning Academy. We received your message and will follow up with you shortly.</p>
            <p>If you would like to speak with us sooner, please call <strong>(770) 672-4255</strong>.</p>
            <p>Warm regards,<br><strong>Genesis Learning Academy of Kennesaw</strong></p>
          </div>
        </div>
      `,
    });

    await updateContactEmailStatus(contactSubmissionId, {
      staffEmailId: staffEmailResult.data?.id,
      autoReplyEmailId: autoReplyEmailResult.data?.id,
      status: staffEmailResult.error || autoReplyEmailResult.error ? 'partial_error' : 'sent',
    });

    res.json({ success: true, message: 'Contact request submitted successfully.', submissionId: contactSubmissionId });
  } catch (error) {
    console.error('Contact request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process contact request',
      details: error.message,
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  if (!dbConfig) {
    return res.json({ status: 'ok', database: 'disabled' });
  }

  try {
    await getDbPool().query('SELECT 1');
    return res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check database error:', error);
    return res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

// Serve built frontend when running as the production app server (optional fallback).
if (isProduction) {
  const staticDir = process.env.STATIC_DIR || __dirname;
  app.use(express.static(staticDir, { index: false }));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

async function startServer() {
  await ensureLeadTables();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API server running on http://0.0.0.0:${PORT}`);
    console.log(`Staff notification email: ${STAFF_EMAIL}`);
    console.log(`Lead database: ${dbConfig ? `${dbConfig.database}@${dbConfig.host}` : 'disabled'}`);
  });
}

startServer().catch((error) => {
  console.error('Lead database initialization failed:', error);
  process.exit(1);
});
