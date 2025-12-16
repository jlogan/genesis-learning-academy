import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email endpoint
app.post('/api/enroll', async (req, res) => {
  try {
    const {
      parentName,
      email,
      phone,
      children,
      languagePreference,
      additionalInfo,
    } = req.body;

    // Validate required fields
    if (!parentName || !email || !phone || !children || !languagePreference) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Format children information
    const childrenInfo = children
      .map(
        (child, index) => `
Child ${index + 1}:
- Name: ${child.childName}
- Age Group: ${child.childAge}
- Preferred Start Date: ${child.preferredStartDate}
`
      )
      .join('\n');

    // Format the email content
    const emailContent = `
New Enrollment Request from Genesis Learning Academy Website

Parent/Guardian Information:
- Name: ${parentName}
- Email: ${email}
- Phone: ${phone}
- Language Preference: ${languagePreference}

${children.length > 1 ? 'Children Information:' : 'Child Information:'}
${childrenInfo}

${additionalInfo ? `Additional Information:\n${additionalInfo}` : ''}

---
This email was sent from the Genesis Learning Academy enrollment form.
`;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Genesis Learning Academy <glak@emails.brogrammersagency.com>',
      to: ['jay@brogrammers.agency'],
      subject: `New Enrollment Request from ${parentName}`,
      text: emailContent,
      replyTo: email,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send email',
        details: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Enrollment request sent successfully',
      emailId: data?.id,
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
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

