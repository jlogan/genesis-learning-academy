# GLAK Enrollment Form — Implementation Plan

## Overview
Convert the 18-page paper enrollment packet (emailed by Natasha on 2026-03-16) into a multi-step web form at `/enroll`. On submission, generate a printable PDF of the completed enrollment packet and email it to both the parent and the GLAK staff. Parents print the PDF and bring it to the center for in-person signatures.

## Architecture

### Frontend (React + shadcn/ui)
- **Multi-step wizard form** replacing the current simple Enroll.tsx
- ~10 steps grouping the 18 pages logically
- Progress indicator, save-as-you-go (localStorage), validation per step
- Final review step before submission

### Backend (Express server.js)  
- `POST /api/enroll` — accepts form JSON, generates PDF, emails to parent + staff
- PDF generation using `@react-pdf/renderer` (pure JS, no puppeteer needed)
- Email via Resend (already configured) with PDF attachment

### Form Steps

| Step | Title | Packet Pages | Key Fields |
|------|-------|-------------|------------|
| 1 | Child Information | Page 0 | Name, DOB, sex, SSN, address, phone |
| 2 | Parent/Guardian Info | Pages 0-1 | Parent 1 & 2 full info, custody, marital status, household members |
| 3 | Emergency Contacts & Pickup | Page 1 | 2 emergency contacts, authorized pickup persons, kid code, unauthorized persons |
| 4 | Payment Policies | Pages 2-3 | 7+ acknowledgment initials, operating hours, tuition, escort policy, after-school |
| 5 | Medical & Emergency | Page 4 | Emergency consent, physician, hospital, medications, allergies, health conditions |
| 6 | Policies & Acknowledgments | Pages 5-7 | No liability insurance, age grouping, topical preparations checklist, child combination consent |
| 7 | Photo/Media Authorization | Page 8 | Photo/video consent with opt-out |
| 8 | Safe Sleep & Infant Info | Pages 10, 12-13 | Safe sleep acknowledgment, infant affidavit (formula), infant feeding plan (conditional — only if infant) |
| 9 | CACFP / Medicaid | Pages 11, 14 | Medicaid/SCHIP sharing opt-out, CACFP income eligibility |
| 10 | Transportation | Pages 15-16 | Vehicle emergency info, transportation agreement (conditional — after-school only) |
| 11 | About Your Family | Page 17 | Informal parent/child info sheet |
| 12 | Review & Submit | — | Review all data, submit |

**Note:** Page 9 (Affidavit of Religious Objection to Immunization) requires notarization and stays paper-only. We'll note this on the form.

### PDF Generation
- Generate a clean, printable PDF that mirrors the paper packet layout
- Include all form data filled in
- Leave signature lines blank (to be signed in person)
- Header with GLAK branding on each page
- "DRAFT — Signatures Required" watermark

### Email Flow
- **To Parent:** "Thank you for starting enrollment! Attached is your completed enrollment packet. Please print and bring to Genesis Learning Academy for signatures."
- **To Staff (jay@brogrammers.agency initially, later GLAK email):** "New enrollment submission from [Parent Name] for [Child Name]. See attached packet."
- Both emails include the PDF attachment

### Deployment
- Update docker-compose for production build
- Push to GitHub, deploy via existing pipeline to genesislearningacademyofkennesaw.com

## Tech Decisions
- **@react-pdf/renderer** for PDF (pure JS, renders React components to PDF)
- **Resend** for email (already in place)
- **react-hook-form + zod** for validation (already in place)
- **localStorage** for draft persistence between steps
- No database needed for V1 — email is the record system

## Excluded from V1 (Future: Enrollment Management System)
- Staff login/dashboard
- Enrollment status tracking
- Document upload (immunization records, etc.)
- E-signatures
- Database storage
