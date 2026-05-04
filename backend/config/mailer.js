const sgMail = require("@sendgrid/mail");
const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");
const QRCode = require('qrcode');
const { cloudinary } = require("./cloudinary");
const twilio = require("twilio");

// Validation of environment variables
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDER_EMAIL = process.env.SENDGRID_SENDER_EMAIL || process.env.SENDER_EMAIL;

if (!SENDGRID_API_KEY) {
  console.error("❌ SENDGRID_API_KEY is missing in environment variables.");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log("✅ SendGrid API Key initialized");
}

if (!SENDER_EMAIL) {
  console.error("❌ SENDER_EMAIL/SENDGRID_SENDER_EMAIL is missing in environment variables.");
}

// Twilio Setup
let twilioClient;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log("✅ Twilio initialized");
  }
} catch (error) {
  console.error("❌ Twilio Initialization Error:", error.message);
}

/**
 * Professional PDF Generation
 */
const createProfessionalPDF = (doc, details, qrDataURL) => {
  const pageWidth = 595.28; // A4 width
  const margin = 40;

  // --- Theme Colors ---
  const primaryColor = "#0f172a"; // Navy
  const secondaryColor = "#2563eb"; // Blue
  const accentColor = "#059669"; // Emerald
  const textColor = "#1e293b";
  const lightText = "#64748b";
  const bgColor = "#f8fafc";

  // --- Header Background ---
  doc.rect(0, 0, pageWidth, 120).fill(primaryColor);
  
  // --- Hospital Logo / Name ---
  // Using hospital logo if available
  if (details.hospitalLogo) {
     try {
       // Note: pdfkit might need local path or buffer for images, but often handles URLs
       // However, to be safe with Cloudinary URLs, we just use text if it fails or use a placeholder
       doc.image(details.hospitalLogo, margin, 30, { width: 60 });
     } catch (e) {
       doc.fillColor("#ffffff").circle(margin + 30, 60, 30).fill();
       doc.fillColor(primaryColor).fontSize(24).text("H", margin + 20, 50, { bold: true });
     }
  } else {
    doc.fillColor("#ffffff").circle(margin + 30, 60, 30).fill();
    doc.fillColor(primaryColor).fontSize(24).text("H", margin + 20, 50, { bold: true });
  }

  doc.fillColor("#ffffff")
     .fontSize(20)
     .text(details.hospitalName || "Hospital", margin + 75, 45, { bold: true })
     .fontSize(10)
     .text(details.branchName ? `${details.branchName} Branch` : "Main Branch", margin + 75, 75, { characterSpacing: 1 });

  // --- Header Right Stats ---
  doc.fillColor(secondaryColor).roundedRect(pageWidth - 220, 35, 180, 50, 5).fill();
  doc.fillColor("#ffffff")
     .fontSize(8).text("APPOINTMENT ID", pageWidth - 210, 45)
     .fontSize(12).text(details.customId || (details._id ? details._id.toString().slice(-8).toUpperCase() : "N/A"), pageWidth - 210, 58, { bold: true });

  // --- Body ---
  let currentY = 150;

  // Patient Card
  doc.fillColor(bgColor).roundedRect(margin, currentY, pageWidth - (margin * 2), 100, 10).fill();
  
  doc.fillColor(textColor).fontSize(14).text("Patient Information", margin + 20, currentY + 15, { bold: true });
  doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(margin + 20, currentY + 35).lineTo(pageWidth - margin - 20, currentY + 35).stroke();

  doc.fillColor(lightText).fontSize(9).text("NAME", margin + 25, currentY + 45);
  doc.fillColor(textColor).fontSize(11).text(details.patientName, margin + 25, currentY + 58, { bold: true });

  doc.fillColor(lightText).fontSize(9).text("PHONE", margin + 180, currentY + 45);
  doc.fillColor(textColor).fontSize(11).text(details.phone, margin + 180, currentY + 58, { bold: true });

  doc.fillColor(lightText).fontSize(9).text("EMAIL", margin + 330, currentY + 45);
  doc.fillColor(textColor).fontSize(11).text(details.patientEmail, margin + 330, currentY + 58, { bold: true });

  currentY += 120;

  // Appointment Details Card
  doc.fillColor(bgColor).roundedRect(margin, currentY, pageWidth - (margin * 2), 120, 10).fill();
  
  doc.fillColor(textColor).fontSize(14).text("Appointment Details", margin + 20, currentY + 15, { bold: true });
  doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(margin + 20, currentY + 35).lineTo(pageWidth - margin - 20, currentY + 35).stroke();

  // Left Column
  doc.fillColor(lightText).fontSize(9).text("DATE", margin + 25, currentY + 45);
  doc.fillColor(textColor).fontSize(11).text(details.date, margin + 25, currentY + 58, { bold: true });

  doc.fillColor(lightText).fontSize(9).text("TIME", margin + 25, currentY + 85);
  doc.fillColor(textColor).fontSize(11).text(details.time, margin + 25, currentY + 98, { bold: true });

  // Center Column (Token)
  doc.fillColor(secondaryColor).circle(margin + 240, currentY + 70, 40).fill();
  doc.fillColor("#ffffff")
     .fontSize(8).text("TOKEN", margin + 225, currentY + 55)
     .fontSize(24).text(details.tokenNumber ? details.tokenNumber.toString() : "0", margin + 225, currentY + 65, { bold: true });

  // Right Column
  doc.fillColor(lightText).fontSize(9).text("DOCTOR", margin + 330, currentY + 45);
  doc.fillColor(textColor).fontSize(11).text(details.assignedDoctorName || "To be assigned", margin + 330, currentY + 58, { bold: true });

  doc.fillColor(lightText).fontSize(9).text("CONSULTATION FEE", margin + 330, currentY + 85);
  doc.fillColor(accentColor).fontSize(14).text(`Rs. ${details.opdCharge || 0}`, margin + 330, currentY + 98, { bold: true });

  currentY += 140;

  // Location Card
  doc.fillColor(bgColor).roundedRect(margin, currentY, pageWidth - (margin * 2), 80, 10).fill();
  doc.fillColor(textColor).fontSize(14).text("Hospital Location", margin + 20, currentY + 15, { bold: true });
  doc.fillColor(lightText).fontSize(10).text(details.location || (details.branchDetails && details.branchDetails.address) || "Address not provided", margin + 20, currentY + 40, { width: 350 });

  // QR Code on right of Location
  if (qrDataURL) {
    doc.image(qrDataURL, pageWidth - margin - 80, currentY + 5, { width: 70 });
    doc.fontSize(7).fillColor(lightText).text("SCAN TO TRACK", pageWidth - margin - 80, currentY + 75, { align: 'center', width: 70 });
  }

  currentY += 100;

  // Important Instructions
  doc.fillColor(primaryColor).fontSize(11).text("Important Instructions:", margin, currentY, { bold: true });
  doc.fillColor(textColor).fontSize(9)
     .text("• Please arrive at least 15 minutes before your scheduled appointment time.", margin, currentY + 20)
     .text("• Bring a copy of this slip (digital or printed) and a valid photo ID.", margin, currentY + 35)
     .text("• If you need to cancel or reschedule, please do so at least 2 hours in advance.", margin, currentY + 50);

  // Footer
  doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(margin, 750).lineTo(pageWidth - margin, 750).stroke();
  doc.fillColor(lightText).fontSize(8)
     .text("This is an automatically generated appointment slip by Clinoza HealthCare.", margin, 765, { align: 'center' })
     .text(`For support: ${details.supportPhone || "+91 0000000000"} | ${details.supportEmail || "support@clinoza.in"}`, margin, 778, { align: 'center' });
};

/**
 * Send WhatsApp Notification via Twilio
 */
const sendWhatsAppNotification = async (phone, message) => {
  if (!twilioClient) {
    console.error("❌ Twilio client not initialized. Cannot send WhatsApp.");
    return null;
  }
  try {
    const body = typeof message === 'object' ? message.body : message;
    const mediaUrl = typeof message === 'object' ? message.mediaUrl : null;

    const formattedPhone = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone.startsWith('+') ? phone : '+91' + phone}`;

    console.log(`[WhatsApp] Attempting send to ${formattedPhone}...`);

    const payload = {
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: formattedPhone,
      body: body,
    };

    if (mediaUrl) {
      payload.mediaUrl = [mediaUrl];
    }

    const result = await twilioClient.messages.create(payload);
    console.log("✅ WhatsApp sent! SID:", result.sid);
    return result;
  } catch (error) {
    console.error("❌ Twilio WhatsApp Error:", error.message);
    return null;
  }
};

/**
 * Upload Buffer to Cloudinary (for sharing PDF via WhatsApp)
 */
const uploadBufferToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: "receipts", 
        resource_type: "raw",
        public_id: filename.replace(".pdf", "") + "-" + Date.now(),
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Send Appointment Notifications (Booking/Approval)
 */
const sendAppointmentEmail = async (patientEmail, bookingDetails, includePDF = true, sendWhatsApp = false) => {
  try {
    let attachments = [];
    let pdfUrl = null;
    let pdfBuffer = null;
    
    const trackingURL = `${process.env.FRONTEND_URL || 'https://clinoza.in'}/track-appointment/${bookingDetails.customId || bookingDetails._id}`;
    bookingDetails.trackingURL = trackingURL;

    if (includePDF) {
      try {
        const qrDataURL = await QRCode.toDataURL(trackingURL);
        const doc = new PDFDocument({ size: "A4", margin: 40 });
        const stream = new PassThrough();
        doc.pipe(stream);
        createProfessionalPDF(doc, bookingDetails, qrDataURL);
        doc.end();

        const chunks = [];
        for await (const chunk of stream) { chunks.push(chunk); }
        pdfBuffer = Buffer.concat(chunks);
        
        attachments.push({
          filename: "Appointment_Slip.pdf",
          content: pdfBuffer.toString("base64"),
          type: "application/pdf",
          disposition: "attachment",
        });

        if (sendWhatsApp && bookingDetails.phone) {
          try {
            pdfUrl = await uploadBufferToCloudinary(pdfBuffer, "Appointment_Slip.pdf");
          } catch (waError) {
            console.error("❌ Cloudinary Upload Error:", waError.message);
          }
        }
      } catch (pdfErr) {
        console.error("❌ PDF Generation Error:", pdfErr.message);
      }
    }

    // Professional Email Content
    const emailSubject = bookingDetails.status === "Confirmed" 
      ? `Confirmed: Your Appointment at ${bookingDetails.hospitalName}`
      : `Update: Appointment ${bookingDetails.status} - ${bookingDetails.hospitalName}`;

    const plainTextBody = `Dear ${bookingDetails.patientName},

Your appointment has been ${bookingDetails.status === 'Confirmed' ? 'confirmed and approved' : 'updated to ' + bookingDetails.status}.

Appointment Details:
-------------------
Hospital: ${bookingDetails.hospitalName}
Branch: ${bookingDetails.branchName || 'Main'}
Date: ${bookingDetails.date}
Time: ${bookingDetails.time}
Appointment ID: ${bookingDetails.customId || bookingDetails._id}

${includePDF ? 'Please find your official appointment slip attached to this email.' : ''}

You can track your real-time status here: ${trackingURL}

If you have any questions, please contact the hospital at ${bookingDetails.supportPhone || 'our support line'}.

Best Regards,
The ${bookingDetails.hospitalName} Team`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #2563eb;">Appointment ${bookingDetails.status === 'Confirmed' ? 'Confirmed' : 'Update'}</h2>
        <p>Dear <strong>${bookingDetails.patientName}</strong>,</p>
        <p>Your appointment at <strong>${bookingDetails.hospitalName}</strong> has been ${bookingDetails.status === 'Confirmed' ? '<span style="color: #059669; font-weight: bold;">Approved</span>' : 'updated to <strong>' + bookingDetails.status + '</strong>'}.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; font-size: 16px;">Appointment Summary</h3>
          <table style="width: 100%; font-size: 14px;">
            <tr><td style="padding: 5px 0;"><strong>Date:</strong></td><td>${bookingDetails.date}</td></tr>
            <tr><td style="padding: 5px 0;"><strong>Time:</strong></td><td>${bookingDetails.time}</td></tr>
            <tr><td style="padding: 5px 0;"><strong>ID:</strong></td><td>${bookingDetails.customId || bookingDetails._id}</td></tr>
            <tr><td style="padding: 5px 0;"><strong>Token:</strong></td><td>${bookingDetails.tokenNumber || 'Assigned at hospital'}</td></tr>
          </table>
        </div>

        <p>You can track your appointment status and queue position in real-time:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackingURL}" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Track Appointment</a>
        </div>

        <p style="font-size: 12px; color: #64748b; margin-top: 40px;">
          If you have any questions, please reach out to ${bookingDetails.hospitalName} directly at ${bookingDetails.supportPhone}.
          <br><br>
          <em>This is an automated message from Clinoza Healthcare on behalf of ${bookingDetails.hospitalName}.</em>
        </p>
      </div>
    `;

    const msg = {
      to: patientEmail,
      from: {
        email: SENDER_EMAIL,
        name: bookingDetails.hospitalName || "Clinoza HealthCare"
      },
      subject: emailSubject,
      text: plainTextBody,
      html: htmlBody,
      attachments: attachments,
    };

    if (!SENDGRID_API_KEY) {
       console.warn("⚠️ SendGrid API Key missing. Email skipped.");
       return { status: "Email Pending" };
    }

    try {
      await sgMail.send(msg);
      console.log(`✅ Email sent to ${patientEmail} via SendGrid`);
    } catch (error) {
      console.error("❌ SendGrid Email Error:", error.response ? error.response.body : error.message);
      return { status: "Email Pending" };
    }

    // WhatsApp Approval Message
    if (sendWhatsApp && bookingDetails.phone && bookingDetails.status === "Confirmed") {
      const waMessage = `🏥 *${bookingDetails.hospitalName}*

Dear *${bookingDetails.patientName}*,

Your appointment has been approved.

*Appointment Details:*
Date: ${bookingDetails.date}
Time: ${bookingDetails.time}
ID: ${bookingDetails.customId || bookingDetails._id}
Token: ${bookingDetails.tokenNumber || 'N/A'}

Track Live Status:
${trackingURL}

Thank you for choosing ${bookingDetails.hospitalName}.`;

      await sendWhatsAppNotification(bookingDetails.phone, {
        body: waMessage,
        mediaUrl: pdfUrl
      });
    }

    return { status: "Email Sent" };

  } catch (error) {
    console.error("❌ Mailer logic error:", error.message);
    return { status: "Email Pending" };
  }
};

/**
 * Immediate Booking Confirmation (WhatsApp ONLY)
 */
const sendBookingConfirmationWhatsApp = async (bookingDetails) => {
  try {
    const trackingURL = `${process.env.FRONTEND_URL || 'https://clinoza.in'}/track-appointment/${bookingDetails.customId || bookingDetails._id}`;
    
    const waMessage = `🏥 *${bookingDetails.hospitalName}*

Dear *${bookingDetails.patientName}*,

Your appointment request has been received.

*Details:*
Hospital: ${bookingDetails.hospitalName}
Date: ${bookingDetails.date}
Time: ${bookingDetails.time}
ID: ${bookingDetails.customId || bookingDetails._id}

Status: *Under Review*

Track Progress:
${trackingURL}

For assistance: ${bookingDetails.supportPhone || ''}`;

    await sendWhatsAppNotification(bookingDetails.phone, waMessage);
  } catch (error) {
    console.error("❌ Booking WhatsApp Error:", error.message);
  }
};

const sendHospitalApprovalEmail = async (hospitalEmail, hospitalName, status) => {
  try {
    const emailSubject = `Hospital Status Update: ${status.toUpperCase()}`;
    const text = `Hello ${hospitalName},\n\nYour hospital registration status has been updated to: ${status.toUpperCase()}.\n\n${status === 'approved' ? 'You can now log in and manage your dashboard.' : 'Please contact support for more details.'}\n\nThank you,\nClinoza Team`;

    const msg = {
      to: hospitalEmail,
      from: SENDER_EMAIL,
      subject: emailSubject,
      text: text,
      html: `<h3>Status Updated</h3><p>${text.replace(/\n/g, '<br>')}</p>`
    };

    if (SENDGRID_API_KEY) {
      await sgMail.send(msg);
      console.log(`✅ Approval email sent to ${hospitalEmail}`);
    }
  } catch (error) {
    console.error("❌ Hospital Approval Email Error:", error.message);
  }
};

const sendHospitalPendingEmail = async (hospitalEmail, hospitalName) => {
  try {
    const msg = {
      to: hospitalEmail,
      from: SENDER_EMAIL,
      subject: `Hospital Registration: UNDER REVIEW`,
      text: `Hello ${hospitalName},\n\nYour hospital registration is currently UNDER REVIEW.\n\nOur admin team will verify your details and approve it within 24 hours.\n\nYou will receive another email once it is approved.\n\nThank you for joining Clinoza!`,
    };
    if (SENDGRID_API_KEY) {
      await sgMail.send(msg);
    }
  } catch (error) {
    console.error("❌ Hospital Pending Email Error:", error.message);
  }
};

module.exports = { 
  sendAppointmentEmail, 
  sendWhatsAppNotification, 
  sendHospitalApprovalEmail,
  sendHospitalPendingEmail,
  sendBookingConfirmationWhatsApp
};
