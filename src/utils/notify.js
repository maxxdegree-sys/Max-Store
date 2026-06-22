// Email + notification utilities for the complaint system.
//
// This file is designed so you can SWAP the implementation later without
// changing any caller. There are 3 modes:
//
//   1. DEMO (default) — opens a pre-filled mailto: link in the customer's
//      mail client so they have a copy of the ticket, plus logs to console.
//      Works with zero setup.
//
//   2. EmailJS — uncomment the EmailJS block and add your EmailJS template
//      IDs in .env.local (no backend needed, free tier 200 emails/month).
//      Docs: https://www.emailjs.com/
//
//   3. Firebase Cloud Functions / Server — replace sendTicketEmail() with
//      a fetch() to your own /api/send-ticket endpoint.

import { BUSINESS } from './format';

const ADMIN_EMAIL = BUSINESS.email;

function buildCustomerBody(ticket) {
  return `Hi ${ticket.name},

Thank you for contacting Maxx. Your complaint has been received.

Ticket ID: ${ticket.id}
Subject:   ${ticket.subject}
Status:    ${ticket.status}
Date:      ${ticket.date}

You can track your ticket anytime at:
https://alrafiq.pk/track-ticket?id=${ticket.id}

Our team will respond by email within 24 hours.
For urgent issues, write to ${BUSINESS.email}

- Maxx Support`;
}

function buildAdminBody(ticket) {
  return `NEW COMPLAINT TICKET
=====================

ID:       ${ticket.id}
Date:     ${ticket.date}
Priority: ${ticket.priority}
Kind:     ${ticket.kind}

Customer: ${ticket.name}
Email:    ${ticket.email || '(none)'}
Phone:    ${ticket.phone || '(none)'}
City:     ${ticket.city || '(none)'}
Order:    ${ticket.orderId || '(not provided)'}
Product:  ${ticket.productId || '(not provided)'}

Subject:  ${ticket.subject}

Message:
${ticket.message}

Open in admin:
https://alrafiq.pk/admin/complaints`;
}

// Open mailto: link (works without any backend; gives the customer a record)
function mailto(to, subject, body) {
  const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  // Use a temporary anchor so popup blockers don't kill the link
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Public API — call this when a ticket is created.
// Returns nothing; failures are logged but never block the UI.
export function notifyNewTicket(ticket) {
  // (1) Console log (always)
  console.info('[Maxx] new complaint', ticket);

  // (2) Customer mailto (only if they provided email)
  if (ticket.email) {
    const subj = `Maxx Support - Ticket ${ticket.id} received`;
    try { mailto(ticket.email, subj, buildCustomerBody(ticket)); } catch (e) { console.warn(e); }
  }

  // (3) Admin mailto (always — wakes default mail client)
  try {
    mailto(ADMIN_EMAIL, `[NEW TICKET ${ticket.id}] ${ticket.subject}`, buildAdminBody(ticket));
  } catch (e) { console.warn(e); }

  // ====== TO ENABLE REAL AUTO-EMAIL (no manual click needed) ======
  // Uncomment after adding emailjs-com to package.json:
  //
  // import emailjs from 'emailjs-com';
  // emailjs.send(
  //   import.meta.env.VITE_EMAILJS_SERVICE_ID,
  //   import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  //   {
  //     to_email:    ticket.email || ADMIN_EMAIL,
  //     cc_email:    ADMIN_EMAIL,
  //     ticket_id:   ticket.id,
  //     subject:     ticket.subject,
  //     message:     ticket.message,
  //     customer:    ticket.name,
  //     tracking_url:`https://alrafiq.pk/track-ticket?id=${ticket.id}`
  //   },
  //   import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  // ).catch((e) => console.warn('[emailjs] send failed:', e));
}

// Notify a customer when admin replies to their ticket
export function notifyTicketReply(ticket, replyText) {
  console.info('[Maxx] reply to', ticket.id);
  if (!ticket.email) return;
  const subj = `Maxx Support - Update on ticket ${ticket.id}`;
  const body = `Hi ${ticket.name},

We have replied to your support ticket ${ticket.id}:

"${replyText}"

View the full thread:
https://alrafiq.pk/track-ticket?id=${ticket.id}

- Maxx Support`;
  try { mailto(ticket.email, subj, body); } catch (e) { console.warn(e); }
}

// ============ BULK EMAIL (campaigns) ============
// Demo mode: opens the default mail client with all recipients in BCC so the
// owner can review and hit send. For true automated bulk send (no client),
// wire EmailJS or a backend /api/send-bulk endpoint where indicated below.
export function sendBulkEmail({ recipients = [], subject = '', body = '' }) {
  const clean = [...new Set(recipients.map((e) => String(e).trim()).filter((e) => e.includes('@')))];
  if (!clean.length) return { ok: false, count: 0, reason: 'no valid recipients' };

  // mailto has a practical length limit (~1800 chars). Chunk BCCs into batches.
  const BATCH = 40;
  for (let i = 0; i < clean.length; i += BATCH) {
    const bcc = clean.slice(i, i + BATCH).join(',');
    const url = `mailto:${ADMIN_EMAIL}?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  // ====== REAL AUTOMATED BULK SEND (no manual click) ======
  // import emailjs from 'emailjs-com';
  // clean.forEach((to) => emailjs.send(SERVICE, TEMPLATE, { to_email: to, subject, message: body }, PUBLIC_KEY));
  // ── or POST to your own backend ──
  // fetch('/api/send-bulk', { method:'POST', headers:{'Content-Type':'application/json'},
  //   body: JSON.stringify({ recipients: clean, subject, body }) });

  return { ok: true, count: clean.length };
}
