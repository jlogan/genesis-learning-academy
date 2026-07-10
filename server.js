import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';
import mysql from 'mysql2/promise';
import path from 'path';
import crypto from 'crypto';
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
app.use(express.urlencoded({ extended: false }));

// Initialize Resend lazily so local PDF preview/imports can run without email credentials.
let resend;
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set; email endpoints cannot send until configured.');
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}


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

function getPublicSiteUrl(req) {
  return String(process.env.PUBLIC_SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

function validateTwilioRequest(req) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN is not set; rejecting Twilio webhook.');
    return false;
  }

  const signature = req.get('X-Twilio-Signature') || '';
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const params = req.body || {};
  let data = url;
  Object.keys(params).sort().forEach((key) => {
    data += key + params[key];
  });

  const expected = crypto.createHmac('sha1', authToken).update(data, 'utf8').digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function buildTwiml(body) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>${body}</Response>`;
}

const INBOUND_SMS_AUTO_REPLY =
  "Thanks for texting Genesis Learning Academy. We don't actively respond to messages sent to this number but you can call us for more information.";

function buildInboundSmsReplyTwiml() {
  return buildTwiml(`<Message>${escapeHtml(INBOUND_SMS_AUTO_REPLY)}</Message>`);
}

function buildInboundCallTwiml({ forwardTo, baseUrl }) {
  const statusUrl = `${baseUrl}/api/twilio/voice/status`;
  const recordingStatusUrl = `${baseUrl}/api/twilio/voice/status?kind=recording`;
  return buildTwiml(`
  <Dial answerOnBridge="true" record="record-from-answer-dual" recordingStatusCallback="${escapeHtml(recordingStatusUrl)}" recordingStatusCallbackEvent="completed" action="${escapeHtml(statusUrl)}" method="POST">
    <Number>${escapeHtml(forwardTo)}</Number>
  </Dial>`);
}

function twilioXml(res, body) {
  return res.status(200).type('text/xml').send(body);
}

function toNullableNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function getAnsweredFromDialStatus(status, durationSeconds) {
  if (!status) return null;
  if (status === 'completed' && (durationSeconds || 0) > 0) return 1;
  if (['busy', 'failed', 'no-answer', 'canceled'].includes(status)) return 0;
  return null;
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inbound_calls (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      twilio_call_sid VARCHAR(64) NOT NULL,
      parent_call_sid VARCHAR(64) NULL,
      from_number VARCHAR(32) NULL,
      to_number VARCHAR(32) NULL,
      forwarded_to VARCHAR(32) NULL,
      call_status VARCHAR(50) NULL,
      dial_call_status VARCHAR(50) NULL,
      duration_seconds INT UNSIGNED NULL,
      recording_url VARCHAR(1000) NULL,
      recording_sid VARCHAR(64) NULL,
      recording_duration_seconds INT UNSIGNED NULL,
      answered TINYINT(1) NULL,
      raw_payload JSON NULL,
      UNIQUE KEY uk_inbound_calls_call_sid (twilio_call_sid),
      INDEX idx_inbound_calls_created_at (created_at),
      INDEX idx_inbound_calls_from_number (from_number),
      INDEX idx_inbound_calls_answered (answered)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inbound_sms (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      twilio_message_sid VARCHAR(64) NOT NULL,
      from_number VARCHAR(32) NULL,
      to_number VARCHAR(32) NULL,
      body TEXT NULL,
      num_media INT UNSIGNED NOT NULL DEFAULT 0,
      staff_email_id VARCHAR(255) NULL,
      notification_status VARCHAR(50) NOT NULL DEFAULT 'pending',
      raw_payload JSON NULL,
      UNIQUE KEY uk_inbound_sms_message_sid (twilio_message_sid),
      INDEX idx_inbound_sms_created_at (created_at),
      INDEX idx_inbound_sms_from_number (from_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

async function upsertInboundCall({
  twilioCallSid,
  parentCallSid,
  fromNumber,
  toNumber,
  forwardedTo,
  callStatus,
  dialCallStatus,
  durationSeconds,
  recordingUrl,
  recordingSid,
  recordingDurationSeconds,
  answered,
  rawPayload,
}) {
  const pool = getDbPool();
  if (!pool || !twilioCallSid) return null;

  await pool.execute(
    `INSERT INTO inbound_calls
      (twilio_call_sid, parent_call_sid, from_number, to_number, forwarded_to, call_status, dial_call_status,
       duration_seconds, recording_url, recording_sid, recording_duration_seconds, answered, raw_payload)
     VALUES
      (:twilioCallSid, :parentCallSid, :fromNumber, :toNumber, :forwardedTo, :callStatus, :dialCallStatus,
       :durationSeconds, :recordingUrl, :recordingSid, :recordingDurationSeconds, :answered, CAST(:rawPayload AS JSON))
     ON DUPLICATE KEY UPDATE
       parent_call_sid = COALESCE(VALUES(parent_call_sid), parent_call_sid),
       from_number = COALESCE(VALUES(from_number), from_number),
       to_number = COALESCE(VALUES(to_number), to_number),
       forwarded_to = COALESCE(VALUES(forwarded_to), forwarded_to),
       call_status = COALESCE(VALUES(call_status), call_status),
       dial_call_status = COALESCE(VALUES(dial_call_status), dial_call_status),
       duration_seconds = COALESCE(VALUES(duration_seconds), duration_seconds),
       recording_url = COALESCE(VALUES(recording_url), recording_url),
       recording_sid = COALESCE(VALUES(recording_sid), recording_sid),
       recording_duration_seconds = COALESCE(VALUES(recording_duration_seconds), recording_duration_seconds),
       answered = COALESCE(VALUES(answered), answered),
       raw_payload = COALESCE(VALUES(raw_payload), raw_payload)`,
    {
      twilioCallSid,
      parentCallSid: parentCallSid || null,
      fromNumber: fromNumber || null,
      toNumber: toNumber || null,
      forwardedTo: forwardedTo || null,
      callStatus: callStatus || null,
      dialCallStatus: dialCallStatus || null,
      durationSeconds: durationSeconds ?? null,
      recordingUrl: recordingUrl || null,
      recordingSid: recordingSid || null,
      recordingDurationSeconds: recordingDurationSeconds ?? null,
      answered: answered ?? null,
      rawPayload: rawPayload ? JSON.stringify(rawPayload) : null,
    }
  );

  const [rows] = await pool.execute(
    `SELECT id FROM inbound_calls WHERE twilio_call_sid = :twilioCallSid LIMIT 1`,
    { twilioCallSid }
  );
  return rows[0]?.id || null;
}

async function saveInboundSms({ twilioMessageSid, fromNumber, toNumber, body, numMedia, rawPayload }) {
  const pool = getDbPool();
  if (!pool || !twilioMessageSid) return null;

  await pool.execute(
    `INSERT INTO inbound_sms
      (twilio_message_sid, from_number, to_number, body, num_media, raw_payload)
     VALUES
      (:twilioMessageSid, :fromNumber, :toNumber, :body, :numMedia, CAST(:rawPayload AS JSON))
     ON DUPLICATE KEY UPDATE
       from_number = COALESCE(VALUES(from_number), from_number),
       to_number = COALESCE(VALUES(to_number), to_number),
       body = COALESCE(VALUES(body), body),
       num_media = COALESCE(VALUES(num_media), num_media),
       raw_payload = COALESCE(VALUES(raw_payload), raw_payload)`,
    {
      twilioMessageSid,
      fromNumber: fromNumber || null,
      toNumber: toNumber || null,
      body: body || null,
      numMedia: numMedia ?? 0,
      rawPayload: rawPayload ? JSON.stringify(rawPayload) : null,
    }
  );

  const [rows] = await pool.execute(
    `SELECT id, notification_status FROM inbound_sms WHERE twilio_message_sid = :twilioMessageSid LIMIT 1`,
    { twilioMessageSid }
  );
  const smsId = rows[0]?.id;
  if (!smsId) return null;

  await pool.execute(
    `INSERT INTO lead_events (event_type, source, source_id, lead_phone, metadata)
     SELECT 'inbound_sms', 'twilio', :sourceId, :phone, CAST(:metadata AS JSON)
     WHERE NOT EXISTS (
       SELECT 1 FROM lead_events
       WHERE event_type = 'inbound_sms'
         AND source = 'twilio'
         AND source_id = :sourceId
     )`,
    {
      sourceId: smsId,
      phone: fromNumber || null,
      metadata: JSON.stringify({
        twilioMessageSid,
        fromNumber: fromNumber || null,
        toNumber: toNumber || null,
        body: body || null,
        numMedia: numMedia ?? 0,
      }),
    }
  );

  return { id: smsId, notificationStatus: rows[0].notification_status };
}

async function updateInboundSmsNotificationStatus(id, { staffEmailId, status }) {
  const pool = getDbPool();
  if (!pool || !id) return;
  await pool.execute(
    `UPDATE inbound_sms
     SET staff_email_id = :staffEmailId, notification_status = :status
     WHERE id = :id`,
    { id, staffEmailId: staffEmailId || null, status }
  );
}

async function maybeInsertInboundCallLeadEvent(callId) {
  const pool = getDbPool();
  if (!pool || !callId) return;

  await pool.execute(
    `INSERT INTO lead_events (event_type, source, source_id, lead_phone, metadata)
     SELECT 'inbound_phone_call', 'twilio', id, from_number,
       JSON_OBJECT(
         'twilioCallSid', twilio_call_sid,
         'fromNumber', from_number,
         'toNumber', to_number,
         'forwardedTo', forwarded_to,
         'answered', answered,
         'dialCallStatus', dial_call_status,
         'durationSeconds', duration_seconds,
         'recordingUrl', recording_url,
         'recordingSid', recording_sid
       )
     FROM inbound_calls
     WHERE id = :callId
       AND dial_call_status IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM lead_events
         WHERE event_type = 'inbound_phone_call'
           AND source = 'twilio'
           AND source_id = inbound_calls.id
       )`,
    { callId }
  );
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
  phone: '678-293-4937',
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

    const MARGIN = 50;
    const CONTENT_WIDTH = doc.page.width - MARGIN * 2;
    const LABEL_GAP = 12;
    const ROW_MIN_HEIGHT = 16;
    const ROW_PADDING = 6;
    const LABEL_WIDTH = 140;
    const VALUE_X = MARGIN + LABEL_WIDTH + LABEL_GAP;
    const VALUE_WIDTH = MARGIN + CONTENT_WIDTH - VALUE_X;
    const HALF_COL_GAP = 14;
    const HALF_COL_WIDTH = (CONTENT_WIDTH - HALF_COL_GAP) / 2;
    const HALF_COL1_X = MARGIN;
    const HALF_COL2_X = MARGIN + HALF_COL_WIDTH + HALF_COL_GAP;
    const HALF_LABEL_WIDTH = 108;
    const PDF_EMPTY = '-';
    const PDF_BULLET = '- ';
    const PDF_CHECK = '[x] ';
    const SECTION_TITLE_HEIGHT = 44;
    const SUBHEADING_HEIGHT = 18;
    const SEPARATOR_HEIGHT = 14;

    function halfColumnLayout(colX) {
      const valueX = colX + HALF_LABEL_WIDTH + LABEL_GAP;
      return {
        labelX: colX,
        labelWidth: HALF_LABEL_WIDTH,
        valueX,
        valueWidth: colX + HALF_COL_WIDTH - valueX,
      };
    }

    let y;

    function pageBottom() {
      return doc.page.height - MARGIN;
    }

    function formatValue(value) {
      return value != null && value !== '' ? String(value) : PDF_EMPTY;
    }

    function pdfJoin(parts, separator = ' - ') {
      return parts.map((part) => formatValue(part)).join(separator);
    }

    function drawHeader() {
      doc.rect(0, 0, doc.page.width, 80).fill(COLORS.primary);
      doc.fill('#ffffff')
        .fontSize(18).font('Helvetica-Bold')
        .text(BRAND.name, MARGIN, 20, { width: CONTENT_WIDTH, align: 'center' });
      doc.fontSize(9).font('Helvetica')
        .text(`${BRAND.address}  |  ${BRAND.phone}`, MARGIN, 45, { width: CONTENT_WIDTH, align: 'center' });
      doc.fill(COLORS.text);
      return 95;
    }

    function ensureSpace(needed) {
      if (y + needed > pageBottom()) {
        doc.addPage();
        y = drawHeader();
      }
    }

    function measureFieldRow(label, value) {
      const val = formatValue(value);
      doc.fontSize(9).font('Helvetica-Bold');
      const labelH = doc.heightOfString(`${label}:`, { width: LABEL_WIDTH });
      doc.font('Helvetica');
      const valueH = doc.heightOfString(val, { width: VALUE_WIDTH });
      return Math.max(labelH, valueH, ROW_MIN_HEIGHT) + ROW_PADDING;
    }

    function drawFieldRow(label, value) {
      const val = formatValue(value);
      const rowH = measureFieldRow(label, value);
      doc.fontSize(9).font('Helvetica-Bold').fill(COLORS.muted)
        .text(`${label}:`, MARGIN, y, { width: LABEL_WIDTH });
      doc.font('Helvetica').fill(COLORS.text)
        .text(val, VALUE_X, y, { width: VALUE_WIDTH });
      y += rowH;
    }

    function measureHalfColumn(label, value, colX) {
      const val = formatValue(value);
      const { labelWidth, valueWidth } = halfColumnLayout(colX);
      doc.fontSize(9).font('Helvetica-Bold');
      const labelH = doc.heightOfString(`${label}:`, { width: labelWidth });
      doc.font('Helvetica');
      const valueH = doc.heightOfString(val, { width: valueWidth });
      return Math.max(labelH, valueH, ROW_MIN_HEIGHT);
    }

    function drawHalfColumn(label, value, colX) {
      const val = formatValue(value);
      const { labelX, labelWidth, valueX, valueWidth } = halfColumnLayout(colX);
      doc.fontSize(9).font('Helvetica-Bold').fill(COLORS.muted)
        .text(`${label}:`, labelX, y, { width: labelWidth });
      doc.font('Helvetica').fill(COLORS.text)
        .text(val, valueX, y, { width: valueWidth });
    }

    function measureFieldRowHalf(label1, val1, label2, val2) {
      const leftH = measureHalfColumn(label1, val1, HALF_COL1_X);
      const rightH = measureHalfColumn(label2, val2, HALF_COL2_X);
      return Math.max(leftH, rightH) + ROW_PADDING;
    }

    function drawFieldRowHalf(label1, val1, label2, val2) {
      const rowH = measureFieldRowHalf(label1, val1, label2, val2);
      drawHalfColumn(label1, val1, HALF_COL1_X);
      drawHalfColumn(label2, val2, HALF_COL2_X);
      y += rowH;
    }

    function formatBulletText(text) {
      if (text.startsWith('[x] ') || text.startsWith('- ')) return text;
      return `${PDF_BULLET}${text}`;
    }

    function measureBullet(text) {
      const line = formatBulletText(text);
      doc.fontSize(9).font('Helvetica');
      const h = doc.heightOfString(line, { width: CONTENT_WIDTH - 10 });
      return Math.max(h, ROW_MIN_HEIGHT) + ROW_PADDING;
    }

    function drawBullet(text) {
      const rowH = measureBullet(text);
      doc.fontSize(9).font('Helvetica').fill(COLORS.text)
        .text(formatBulletText(text), MARGIN + 10, y, { width: CONTENT_WIDTH - 10 });
      y += rowH;
    }

    function measureRows(rows) {
      let height = 0;
      for (const row of rows) {
        switch (row.type) {
          case 'field':
            height += measureFieldRow(row.label, row.value);
            break;
          case 'half':
            height += measureFieldRowHalf(row.label1, row.val1, row.label2, row.val2);
            break;
          case 'bullet':
            height += measureBullet(row.text);
            break;
          case 'subheading':
            height += SUBHEADING_HEIGHT;
            break;
          case 'separator':
            height += SEPARATOR_HEIGHT;
            break;
          default:
            break;
        }
      }
      return height;
    }

    function drawRows(rows) {
      for (const row of rows) {
        switch (row.type) {
          case 'field':
            drawFieldRow(row.label, row.value);
            break;
          case 'half':
            drawFieldRowHalf(row.label1, row.val1, row.label2, row.val2);
            break;
          case 'bullet':
            drawBullet(row.text);
            break;
          case 'subheading':
            doc.fontSize(10).font('Helvetica-Bold').fill(COLORS.accent)
              .text(row.text, MARGIN, y);
            y += SUBHEADING_HEIGHT;
            break;
          case 'separator':
            y += 4;
            doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_WIDTH, y).strokeColor(COLORS.line).lineWidth(0.5).stroke();
            y += 8;
            break;
          default:
            break;
        }
      }
    }

    function drawSectionTitle(title) {
      y += 10;
      doc.rect(MARGIN, y, CONTENT_WIDTH, 24).fill(COLORS.accent);
      doc.fill('#ffffff').fontSize(12).font('Helvetica-Bold')
        .text(title.toUpperCase(), MARGIN + 8, y + 6, { width: CONTENT_WIDTH - 16 });
      doc.fill(COLORS.text);
      y += 34;
    }

    function renderSection(title, rows) {
      if (!rows || rows.length === 0) return;
      const bodyHeight = measureRows(rows);
      ensureSpace(SECTION_TITLE_HEIGHT + bodyHeight);
      drawSectionTitle(title);
      drawRows(rows);
    }

    function fieldRow(label, value) {
      const rowH = measureFieldRow(label, value);
      ensureSpace(rowH);
      drawFieldRow(label, value);
    }

    function fieldRowHalf(label1, val1, label2, val2) {
      const rowH = measureFieldRowHalf(label1, val1, label2, val2);
      ensureSpace(rowH);
      drawFieldRowHalf(label1, val1, label2, val2);
    }

    function separator() {
      ensureSpace(SEPARATOR_HEIGHT);
      y += 4;
      doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_WIDTH, y).strokeColor(COLORS.line).lineWidth(0.5).stroke();
      y += 8;
    }

    function signatureLine(label) {
      ensureSpace(50);
      y += 10;
      doc.moveTo(MARGIN + 5, y + 20).lineTo(350, y + 20).strokeColor(COLORS.text).lineWidth(0.8).stroke();
      doc.moveTo(370, y + 20).lineTo(500, y + 20).stroke();
      doc.fontSize(8).font('Helvetica').fill(COLORS.muted)
        .text(label, MARGIN + 5, y + 24)
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
    doc.rect(MARGIN, y, CONTENT_WIDTH, 30).fill('#edf2f7');
    doc.fill(COLORS.primary).fontSize(11).font('Helvetica-Bold')
      .text('ENROLLMENT APPLICATION - Print and bring to center for signatures', MARGIN + 5, y + 9, { width: CONTENT_WIDTH - 10, align: 'center' });
    doc.fill(COLORS.text);
    y += 40;

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.fontSize(9).font('Helvetica').fill(COLORS.muted)
      .text(`Generated: ${today}`, MARGIN, y, { width: CONTENT_WIDTH - 10, align: 'right' });
    y += 18;

    renderSection('Child Information', [
      { type: 'field', label: 'Full Name', value: child.childFullName },
      { type: 'half', label1: 'Birth Date', val1: child.childBirthDate, label2: 'Sex', val2: child.childSex },
      { type: 'field', label: 'Nick Name', value: child.childNickName },
      { type: 'field', label: 'Home Address', value: child.childHomeAddress },
      { type: 'half', label1: 'City', val1: child.childCity, label2: 'State', val2: child.childState },
      { type: 'field', label: 'Zip Code', value: child.childZipCode },
      { type: 'field', label: 'Home Phone', value: child.childHomePhone },
    ]);

    renderSection('1st Parent/Guardian', [
      { type: 'field', label: 'Full Name', value: parent1.fullName },
      { type: 'field', label: 'Birth Date', value: parent1.birthDate },
      { type: 'field', label: 'Home Address', value: parent1.homeAddress },
      { type: 'half', label1: 'City', val1: parent1.city, label2: 'State', val2: parent1.state },
      { type: 'field', label: 'Zip Code', value: parent1.zipCode },
      { type: 'half', label1: 'Home Phone', val1: parent1.homePhone, label2: 'Cell Phone', val2: parent1.cellPhone },
      { type: 'field', label: 'Email', value: parent1.email },
      { type: 'field', label: 'Occupation', value: parent1.occupation },
      { type: 'field', label: 'Employer', value: parent1.employerName },
      { type: 'field', label: 'Employer Address', value: parent1.employerAddress },
      { type: 'half', label1: 'Work Phone', val1: parent1.workPhone, label2: 'Work Hours', val2: parent1.workHours },
    ]);

    const hasParent2 = parent2.fullName || parent2.cellPhone || parent2.email;
    if (hasParent2) {
      renderSection('2nd Parent/Guardian', [
        { type: 'field', label: 'Full Name', value: parent2.fullName },
        { type: 'field', label: 'Birth Date', value: parent2.birthDate },
        { type: 'field', label: 'Home Address', value: parent2.homeAddress },
        { type: 'half', label1: 'City', val1: parent2.city, label2: 'State', val2: parent2.state },
        { type: 'field', label: 'Zip Code', value: parent2.zipCode },
        { type: 'half', label1: 'Home Phone', val1: parent2.homePhone, label2: 'Cell Phone', val2: parent2.cellPhone },
        { type: 'field', label: 'Email', value: parent2.email },
        { type: 'field', label: 'Occupation', value: parent2.occupation },
        { type: 'field', label: 'Employer', value: parent2.employerName },
        { type: 'field', label: 'Employer Address', value: parent2.employerAddress },
        { type: 'half', label1: 'Work Phone', val1: parent2.workPhone, label2: 'Work Hours', val2: parent2.workHours },
      ]);
    }

    const members = guardian.otherHouseholdMembers || [];
    const filledMembers = members.filter(m => m && m.name);
    const custodyRows = [
      { type: 'field', label: 'Legal Custody Parent', value: guardian.legalCustodyParent },
      { type: 'field', label: 'Parental Status', value: guardian.parentalStatus },
    ];
    if (filledMembers.length > 0) {
      custodyRows.push({ type: 'subheading', text: 'Other Household Members' });
      filledMembers.forEach(m => {
        custodyRows.push({
          type: 'field',
          label: m.name,
          value: `Age: ${formatValue(m.age)}, Relationship: ${formatValue(m.relationship)}`,
        });
      });
    }
    renderSection('Custody & Household', custodyRows);

    const ec1 = emergency.emergencyContact1 || {};
    const ec2 = emergency.emergencyContact2 || {};
    renderSection('Emergency Contact #1', [
      { type: 'field', label: 'Name', value: ec1.name },
      { type: 'half', label1: 'Home/Cell', val1: ec1.homeCell, label2: 'Work Phone', val2: ec1.workPhone },
      { type: 'field', label: 'Relationship', value: ec1.relationship },
      { type: 'field', label: 'Address', value: ec1.address },
      { type: 'field', label: 'City/State/Zip', value: ec1.cityStateZip },
    ]);

    if (ec2.name) {
      renderSection('Emergency Contact #2', [
        { type: 'field', label: 'Name', value: ec2.name },
        { type: 'half', label1: 'Home/Cell', val1: ec2.homeCell, label2: 'Work Phone', val2: ec2.workPhone },
        { type: 'field', label: 'Relationship', value: ec2.relationship },
        { type: 'field', label: 'Address', value: ec2.address },
        { type: 'field', label: 'City/State/Zip', value: ec2.cityStateZip },
      ]);
    }

    const ap1 = emergency.authorizedPickup1 || {};
    const ap2 = emergency.authorizedPickup2 || {};
    if (ap1.name || ap2.name) {
      const authorizedRows = [];
      if (ap1.name) {
        authorizedRows.push({ type: 'field', label: ap1.name, value: pdfJoin([ap1.relationship, ap1.homeCell]) });
        if (ap1.address) authorizedRows.push({ type: 'field', label: 'Address', value: ap1.address });
      }
      if (ap2.name) {
        authorizedRows.push({ type: 'field', label: ap2.name, value: pdfJoin([ap2.relationship, ap2.homeCell]) });
        if (ap2.address) authorizedRows.push({ type: 'field', label: 'Address', value: ap2.address });
      }
      renderSection('Authorized Pickup Persons', authorizedRows);
    }

    const up1 = emergency.unauthorizedPickup1 || {};
    const up2 = emergency.unauthorizedPickup2 || {};
    if (up1.name || up2.name) {
      const unauthorizedRows = [];
      if (up1.name) unauthorizedRows.push({ type: 'field', label: up1.name, value: up1.comment });
      if (up2.name) unauthorizedRows.push({ type: 'field', label: up2.name, value: up2.comment });
      renderSection('NOT Authorized for Pickup', unauthorizedRows);
    }

    renderSection('Secret Pickup Word', [
      { type: 'field', label: 'Kid Code', value: emergency.kidCode },
    ]);

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
    const paymentRows = paymentAcks
      .filter(([key]) => payment[key])
      .map(([, label]) => ({ type: 'bullet', text: `${PDF_CHECK}${label}` }));
    if (payment.isAfterSchool) paymentRows.push({ type: 'field', label: 'After School Program', value: 'Yes' });
    renderSection('Payment Policy Acknowledgments', paymentRows);

    const medicalRows = [
      { type: 'field', label: 'Physician Name', value: medical.physicianName },
      { type: 'field', label: 'Physician Phone', value: medical.physicianPhone },
      { type: 'field', label: 'Preferred Hospital', value: medical.preferredHospital },
      { type: 'field', label: 'Hospital Phone', value: medical.hospitalPhone },
      { type: 'field', label: 'Blood Type', value: medical.bloodType },
      { type: 'field', label: 'Regular Medications', value: medical.regularMedications },
      { type: 'field', label: 'Medical Allergies', value: medical.medicalAllergies },
      { type: 'field', label: 'Food Allergies', value: medical.foodAllergies },
      { type: 'field', label: 'Other Allergies', value: medical.otherAllergies },
      { type: 'field', label: 'Special Health Conditions', value: medical.specialHealthConditions },
    ];
    if (medical.ackEmergencyMedicalCare) medicalRows.push({ type: 'bullet', text: `${PDF_CHECK}Emergency medical care authorized` });
    renderSection('Medical & Emergency Information', medicalRows);

    const topicals = [
      ['topicalBabyWipes', 'Baby Wipes'], ['topicalBandAids', 'Band-Aids'],
      ['topicalNeosporin', 'Neosporin'], ['topicalBactine', 'Bactine'],
      ['topicalSunscreen', 'Sunscreen'], ['topicalInsectRepellent', 'Insect Repellent'],
      ['topicalNonRxOintment', 'Non-Rx Ointment'], ['topicalBabyPowder', 'Baby Powder'],
      ['topicalOther', 'Other'],
    ];
    const approvedTopicals = topicals.filter(([key]) => policies[key]).map(([, label]) => label);
    const policyRows = [];
    if (policies.ackNoLiabilityInsurance) policyRows.push({ type: 'bullet', text: `${PDF_CHECK}No liability insurance policy acknowledged` });
    if (policies.ackChildCombination) policyRows.push({ type: 'bullet', text: `${PDF_CHECK}Child combination/mixed age group policy acknowledged` });
    if (approvedTopicals.length > 0) {
      policyRows.push({ type: 'field', label: 'Topical Preparations Authorized', value: approvedTopicals.join(', ') });
    }
    if (policies.topicalOtherSpecify) policyRows.push({ type: 'field', label: 'Other Topical', value: policies.topicalOtherSpecify });
    renderSection('Policies & Consent Forms', policyRows);

    renderSection('Photo/Media Authorization', [
      { type: 'field', label: 'Photo Authorization', value: photo.photoAuthorization },
    ]);

    const hasInfant = infant && (infant.ackSafeSleep || infant.takesBottle || infant.formulaType);
    if (hasInfant) {
      const foodTypes = [
        ['foodStrained', 'Strained'], ['foodBaby', 'Baby Food'], ['foodFormula', 'Formula'],
        ['foodWholeMilk', 'Whole Milk'], ['foodTable', 'Table Food'], ['foodOther', 'Other'],
      ];
      const selectedFoods = foodTypes.filter(([key]) => infant[key]).map(([, label]) => label);
      const infantRows = [];
      if (infant.ackSafeSleep) infantRows.push({ type: 'bullet', text: `${PDF_CHECK}Safe sleep policy acknowledged` });
      infantRows.push(
        { type: 'field', label: 'Takes Bottle', value: infant.takesBottle },
        { type: 'field', label: 'Bottle Warmed', value: infant.bottleWarmed },
        { type: 'field', label: 'Holds Own Bottle', value: infant.holdsOwnBottle },
        { type: 'field', label: 'Feeds Self', value: infant.feedsSelf },
      );
      if (selectedFoods.length > 0) infantRows.push({ type: 'field', label: 'Food Types', value: selectedFoods.join(', ') });
      if (infant.foodOtherSpecify) infantRows.push({ type: 'field', label: 'Other Food', value: infant.foodOtherSpecify });
      infantRows.push(
        { type: 'field', label: 'Formula Type', value: infant.formulaType },
        { type: 'field', label: 'Formula Amount', value: infant.formulaAmount },
        { type: 'field', label: 'Formula Schedule', value: infant.formulaSchedule },
        { type: 'field', label: 'Formula Option', value: infant.formulaOption },
        { type: 'field', label: 'Pacifier Use', value: infant.pacifierUse },
        { type: 'field', label: 'Pacifier When', value: infant.pacifierWhen },
      );
      if (infant.devRollOver || infant.devSitAlone || infant.devCrawl || infant.devWalk) {
        infantRows.push({
          type: 'half',
          label1: 'Roll Over',
          val1: infant.devRollOver,
          label2: 'Sit Alone',
          val2: infant.devSitAlone,
        });
        infantRows.push({
          type: 'half',
          label1: 'Crawl',
          val1: infant.devCrawl,
          label2: 'Walk',
          val2: infant.devWalk,
        });
      }
      infantRows.push(
        { type: 'field', label: 'Food Likes', value: infant.foodLikes },
        { type: 'field', label: 'Food Dislikes', value: infant.foodDislikes },
        { type: 'field', label: 'Food Allergies', value: infant.foodAllergiesInfant },
        { type: 'field', label: 'Solid Foods Instructions', value: infant.solidFoodsInstructions },
      );
      renderSection('Infant Information', infantRows);
    }

    const categories = [
      ['catHeadStart', 'Head Start'], ['catFosterChild', 'Foster Child'],
      ['catMigrant', 'Migrant'], ['catRunaway', 'Runaway'], ['catHomeless', 'Homeless'],
    ];
    const selectedCats = categories.filter(([key]) => cacfp[key]).map(([, label]) => label);
    const races = [
      ['raceAmericanIndian', 'American Indian/Alaska Native'], ['raceAsian', 'Asian'],
      ['raceBlack', 'Black/African American'], ['raceHawaiian', 'Native Hawaiian/Pacific Islander'],
      ['raceWhite', 'White'],
    ];
    const selectedRaces = races.filter(([key]) => cacfp[key]).map(([, label]) => label);
    const meals = [
      ['mealBreakfast', 'Breakfast'], ['mealAMSnack', 'AM Snack'], ['mealLunch', 'Lunch'],
      ['mealPMSnack', 'PM Snack'], ['mealSupper', 'Supper'], ['mealEveningSnack', 'Evening Snack'],
    ];
    const selectedMeals = meals.filter(([key]) => cacfp[key]).map(([, label]) => label);
    const days = [
      ['dayMon', 'Mon'], ['dayTue', 'Tue'], ['dayWed', 'Wed'],
      ['dayThu', 'Thu'], ['dayFri', 'Fri'], ['daySat', 'Sat'],
    ];
    const selectedDays = days.filter(([key]) => cacfp[key]).map(([, label]) => label);
    const cacfpRows = [];
    if (cacfp.optOutMedicaidSharing) cacfpRows.push({ type: 'bullet', text: 'Opted out of Medicaid sharing' });
    cacfpRows.push({ type: 'field', label: 'SNAP/TANF Case #', value: cacfp.snapTanfCase });
    if (selectedCats.length > 0) cacfpRows.push({ type: 'field', label: 'Categories', value: selectedCats.join(', ') });
    cacfpRows.push(
      { type: 'field', label: 'Household Income', value: cacfp.householdIncome },
      { type: 'field', label: 'Household Size', value: cacfp.householdSize },
      { type: 'field', label: 'Hispanic/Latino', value: cacfp.ethnicHispanic },
    );
    if (selectedRaces.length > 0) cacfpRows.push({ type: 'field', label: 'Race', value: selectedRaces.join(', ') });
    if (selectedMeals.length > 0) cacfpRows.push({ type: 'field', label: 'Meals', value: selectedMeals.join(', ') });
    if (selectedDays.length > 0) cacfpRows.push({ type: 'field', label: 'Days of Attendance', value: selectedDays.join(', ') });
    cacfpRows.push({ type: 'field', label: 'Hours of Attendance', value: cacfp.hoursOfAttendance });
    renderSection('CACFP / Medicaid Information', cacfpRows);

    const hasTransport = transport && (transport.transFatherName || transport.transMotherName || transport.transPickupLocation);
    if (hasTransport) {
      const transDays = [
        ['transDayMon', 'Mon'], ['transDayTue', 'Tue'], ['transDayWed', 'Wed'],
        ['transDayThu', 'Thu'], ['transDayFri', 'Fri'],
      ];
      const selectedTransDays = transDays.filter(([key]) => transport[key]).map(([, label]) => label);
      const transportRows = [
        { type: 'half', label1: 'Father Name', val1: transport.transFatherName, label2: 'Father Phone', val2: transport.transFatherPhone },
        { type: 'half', label1: 'Mother Name', val1: transport.transMotherName, label2: 'Mother Phone', val2: transport.transMotherPhone },
        { type: 'half', label1: 'Emergency Contact', val1: transport.transEmergencyContact, label2: 'Emergency Phone', val2: transport.transEmergencyPhone },
        { type: 'half', label1: 'Doctor Name', val1: transport.transDoctorName, label2: 'Doctor Phone', val2: transport.transDoctorPhone },
        { type: 'field', label: 'Pickup Location', value: transport.transPickupLocation },
        { type: 'field', label: 'Delivery Location', value: transport.transDeliveryLocation },
        { type: 'half', label1: 'Pickup Time', val1: transport.transPickupTime, label2: 'Delivery Time', val2: transport.transDeliveryTime },
      ];
      if (selectedTransDays.length > 0) transportRows.push({ type: 'field', label: 'Transportation Days', value: selectedTransDays.join(', ') });
      transportRows.push({ type: 'field', label: 'Authorized Person', value: transport.transAuthorizedPerson });
      renderSection('Transportation Information', transportRows);
    }

    renderSection('About Your Family', [
      { type: 'field', label: 'Family Members', value: family.familyMembers },
      { type: 'field', label: 'Birthday', value: family.familyBirthday },
      { type: 'field', label: 'Activities', value: family.familyActivities },
    ]);
    renderSection('About Your Family - Additional', [
      { type: 'field', label: 'Strengths', value: family.familyStrengths },
      { type: 'field', label: 'Areas to Work On', value: family.familyWorkOn },
      { type: 'field', label: 'Medical Needs', value: family.familyMedicalNeeds },
      { type: 'field', label: 'Other Information', value: family.familyOtherInfo },
    ]);

    // ── Signature Pages ──
    doc.addPage();
    y = drawHeader();

    doc.rect(MARGIN, y, CONTENT_WIDTH, 30).fill('#edf2f7');
    doc.fill(COLORS.primary).fontSize(12).font('Helvetica-Bold')
      .text('SIGNATURES - Required Before Enrollment', MARGIN + 5, y + 8, { width: CONTENT_WIDTH - 10, align: 'center' });
    doc.fill(COLORS.text);
    y += 45;

    doc.fontSize(10).font('Helvetica').fill(COLORS.text)
      .text('By signing below, I acknowledge that I have read and agree to all policies and information contained in this enrollment packet. I certify that all information provided is true and accurate to the best of my knowledge.', MARGIN, y, { width: CONTENT_WIDTH - 10 });
    y += 55;

    separator();

    signatureLine('1st Parent/Guardian');
    y += 10;
    signatureLine('2nd Parent/Guardian');
    y += 10;

    separator();
    y += 10;

    doc.fontSize(10).font('Helvetica').fill(COLORS.muted)
      .text('FOR OFFICE USE ONLY', MARGIN, y, { width: CONTENT_WIDTH - 10, align: 'center' });
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
            <p>If you have any questions, please call us at <strong>678-293-4937</strong>.</p>
            <p>We look forward to welcoming ${childFullName} to our GLAK family!</p>
            <p style="margin-top: 30px;">Warm regards,<br><strong>Genesis Learning Academy of Kennesaw</strong></p>
          </div>
          <div style="background-color: #edf2f7; padding: 15px; text-align: center; font-size: 12px; color: #718096;">
            <p>Genesis Learning Academy of Kennesaw<br>2098 Carruth St NW, Kennesaw, GA 30144 | 678-293-4937</p>
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
      getResend().emails.send(parentEmailPayload),
      getResend().emails.send(staffEmailPayload),
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

// ─── Twilio Voice Marketing Call Endpoints ───────────────────────────────────

app.post('/api/twilio/voice/inbound', async (req, res) => {
  if (!validateTwilioRequest(req)) {
    return res.status(403).send('Forbidden');
  }

  const forwardTo = String(process.env.TWILIO_FORWARD_TO_NUMBER || '').trim();
  if (!forwardTo) {
    console.error('TWILIO_FORWARD_TO_NUMBER is not set; cannot forward inbound Twilio call.');
    return twilioXml(res, buildTwiml('<Say voice="alice">We are unable to connect your call right now. Please try again later.</Say>'));
  }

  const { CallSid, From, To, CallStatus } = req.body || {};
  const expectedMarketingNumber = String(process.env.TWILIO_MARKETING_NUMBER || '').trim();
  if (expectedMarketingNumber && To !== expectedMarketingNumber) {
    console.warn(`Rejected Twilio call for unexpected number: ${To}`);
    return twilioXml(res, buildTwiml('<Hangup/>'));
  }

  try {
    await upsertInboundCall({
      twilioCallSid: CallSid,
      fromNumber: From,
      toNumber: To,
      forwardedTo: forwardTo,
      callStatus: CallStatus || 'ringing',
      rawPayload: req.body,
    });
  } catch (dbError) {
    console.error('Failed to save inbound Twilio call; forwarding call anyway:', dbError);
  }

  return twilioXml(res, buildInboundCallTwiml({ forwardTo, baseUrl: getPublicSiteUrl(req) }));
});

app.post('/api/twilio/voice/status', async (req, res) => {
  if (!validateTwilioRequest(req)) {
    return res.status(403).send('Forbidden');
  }

  const body = req.body || {};
  const isRecordingCallback = req.query.kind === 'recording';
  const parentCallSid = body.ParentCallSid || null;
  const twilioCallSid = parentCallSid || body.CallSid;
  const durationSeconds = toNullableNumber(body.DialCallDuration || body.CallDuration);
  const recordingDurationSeconds = toNullableNumber(body.RecordingDuration);
  const dialCallStatus = body.DialCallStatus || null;
  const answered = getAnsweredFromDialStatus(dialCallStatus, durationSeconds);

  try {
    const callId = await upsertInboundCall({
      twilioCallSid,
      parentCallSid,
      fromNumber: body.From,
      toNumber: body.To,
      callStatus: body.CallStatus,
      dialCallStatus: isRecordingCallback ? null : dialCallStatus,
      durationSeconds: isRecordingCallback ? null : durationSeconds,
      answered: isRecordingCallback ? null : answered,
      recordingUrl: isRecordingCallback ? body.RecordingUrl : null,
      recordingSid: isRecordingCallback ? body.RecordingSid : null,
      recordingDurationSeconds: isRecordingCallback ? recordingDurationSeconds : null,
      rawPayload: body,
    });

    if (!isRecordingCallback) {
      await maybeInsertInboundCallLeadEvent(callId);
    }
  } catch (dbError) {
    console.error('Failed to save Twilio call status:', dbError);
  }

  return res.status(200).send('OK');
});

// ─── Twilio Inbound SMS Endpoint ─────────────────────────────────────────────

app.post('/api/twilio/sms/inbound', async (req, res) => {
  if (!validateTwilioRequest(req)) {
    return res.status(403).send('Forbidden');
  }

  const body = req.body || {};
  const { MessageSid, From, To, Body, NumMedia } = body;
  const expectedMarketingNumber = String(process.env.TWILIO_MARKETING_NUMBER || '').trim();
  if (expectedMarketingNumber && To !== expectedMarketingNumber) {
    console.warn(`Rejected Twilio SMS for unexpected number: ${To}`);
    return twilioXml(res, buildTwiml('<Message/>'));
  }

  let smsRecord = null;
  try {
    smsRecord = await saveInboundSms({
      twilioMessageSid: MessageSid,
      fromNumber: From,
      toNumber: To,
      body: Body,
      numMedia: toNullableNumber(NumMedia) ?? 0,
      rawPayload: body,
    });
  } catch (dbError) {
    console.error('Failed to save inbound Twilio SMS; returning auto-reply anyway:', dbError);
  }

  const smsId = smsRecord?.id || null;
  const shouldNotifyStaff = smsRecord?.notificationStatus !== 'sent';

  if (shouldNotifyStaff) {
    try {
      const safeFrom = escapeHtml(From || 'Unknown');
      const safeTo = escapeHtml(To || '—');
      const safeBody = escapeHtml(Body || '(empty)').replace(/\n/g, '<br>');
      const staffEmailResult = await getResend().emails.send({
        from: 'Genesis Learning Academy <glak@emails.brogrammersagency.com>',
        to: [STAFF_EMAIL],
        subject: `New inbound SMS from ${From || 'unknown number'}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1a202c;">
          <div style="background-color: #1a365d; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">New Inbound SMS</h1>
          </div>
          <div style="padding: 22px;">
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
              <tr style="background:#edf2f7;"><td style="padding:8px; font-weight:bold;">From</td><td style="padding:8px;">${safeFrom}</td></tr>
              <tr><td style="padding:8px; font-weight:bold;">To</td><td style="padding:8px;">${safeTo}</td></tr>
              <tr style="background:#edf2f7;"><td style="padding:8px; font-weight:bold;">Message SID</td><td style="padding:8px;">${escapeHtml(MessageSid || '—')}</td></tr>
              <tr><td style="padding:8px; font-weight:bold;">Media attachments</td><td style="padding:8px;">${escapeHtml(String(NumMedia || '0'))}</td></tr>
            </table>
            <h2 style="font-size:16px; color:#1a365d;">Message</h2>
            <p style="line-height:1.6;">${safeBody}</p>
            <p style="color:#718096; font-size:12px; margin-top:24px;">An automatic SMS reply was sent to the sender. Staff can follow up by calling ${safeFrom}.</p>
          </div>
        </div>
      `,
      });

      if (staffEmailResult.error) {
        console.error('Inbound SMS staff email error:', staffEmailResult.error);
        await updateInboundSmsNotificationStatus(smsId, {
          staffEmailId: staffEmailResult.data?.id,
          status: 'staff_email_error',
        });
      } else {
        await updateInboundSmsNotificationStatus(smsId, {
          staffEmailId: staffEmailResult.data?.id,
          status: 'sent',
        });
      }
    } catch (emailError) {
      console.error('Failed to send inbound SMS staff notification; returning auto-reply anyway:', emailError);
      await updateInboundSmsNotificationStatus(smsId, {
        staffEmailId: null,
        status: 'staff_email_error',
      });
    }
  }

  return twilioXml(res, buildInboundSmsReplyTwiml());
});

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

    const staffEmailResult = await getResend().emails.send({
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

    const autoReplyEmailResult = await getResend().emails.send({
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
            <p>If you would like to speak with us sooner, please call <strong>678-293-4937</strong>.</p>
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

export { generateEnrollmentPDF };

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
  startServer().catch((error) => {
    console.error('Lead database initialization failed:', error);
    process.exit(1);
  });
}
