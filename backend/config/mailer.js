const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");
const QRCode = require('qrcode');
const { cloudinary } = require("./cloudinary");
const twilio = require("twilio");

// Twilio Setup
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Nodemailer Setup with enhanced configuration for Cloud environments (Render/Vercel)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // MUST be an App Password for Gmail
  },
  tls: {
    // Force IPv4 to prevent ENETUNREACH on IPv6-only cloud networks
    // This is a common fix for Render/Vercel SMTP issues
    rejectUnauthorized: false
  },
  // Connection timeout settings
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 5000,
  socketTimeout: 15000,
  family: 4 // Force IPv4
});

// Transporter Verification
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mailer Connection Error:", error.message);
    console.log("👉 Check if EMAIL_USER/EMAIL_PASS are correct and using an App Password.");
  } else {
    console.log("✅ Mailer is ready to send messages");
  }
});

/**
 * Improved Professional PDF Generation
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

  // --- Background ---
  doc.rect(0, 0, pageWidth, 120).fill(primaryColor);
  
  // --- Hospital Logo / Name ---
  // If logo exists, we could use doc.image(details.logoUrl, ...)
  // For now, let's create a professional text-based logo
  doc.fillColor("#ffffff")
     .circle(margin + 30, 60, 30).fill();
  
  doc.fillColor(primaryColor)
     .fontSize(24)
     .text("H", margin + 20, 50, { bold: true });

  doc.fillColor("#ffffff")
     .fontSize(24)
     .text(details.hospitalName || "Hospital", margin + 75, 45, { bold: true })
     .fontSize(10)
     .text(details.branchName ? `${details.branchName} Branch` : "Main Branch", margin + 75, 75, { characterSpacing: 1 });

  // --- Header Right Stats ---
  doc.fillColor(secondaryColor).roundedRect(pageWidth - 220, 35, 180, 50, 5).fill();
  doc.fillColor("#ffffff")
     .fontSize(8).text("APPOINTMENT ID", pageWidth - 210, 45)
     .fontSize(12).text(details.customId || details._id.toString().slice(-8).toUpperCase(), pageWidth - 210, 58, { bold: true });

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
     .fontSize(24).text(details.tokenNumber.toString(), margin + 225, currentY + 65, { bold: true });

  // Right Column
  doc.fillColor(lightText).fontSize(9).text("DOCTOR", margin + 330, currentY + 45);
  doc.fillColor(textColor).fontSize(11).text(details.assignedDoctorName || "To be assigned", margin + 330, currentY + 58, { bold: true });

  doc.fillColor(lightText).fontSize(9).text("CONSULTATION FEE", margin + 330, currentY + 85);
  doc.fillColor(accentColor).fontSize(14).text(`Rs. ${details.opdCharge || 0}`, margin + 330, currentY + 98, { bold: true });

  currentY += 140;

  // Location Card
  doc.fillColor(bgColor).roundedRect(margin, currentY, pageWidth - (margin * 2), 80, 10).fill();
  doc.fillColor(textColor).fontSize(14).text("Hospital Location", margin + 20, currentY + 15, { bold: true });
  doc.fillColor(lightText).fontSize(10).text(details.location || details.branchDetails?.address || "Address not provided", margin + 20, currentY + 40, { width: 350 });

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
  try {
    const body = typeof message === 'object' ? message.body : message;
    const mediaUrl = typeof message === 'object' ? message.mediaUrl : null;

    const formattedPhone = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone.startsWith('+') ? phone : '+91' + phone}`;

    console.log(`Sending WhatsApp to ${formattedPhone}...`);

    const payload = {
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: formattedPhone,
      body: body,
    };

    if (mediaUrl) {
      payload.mediaUrl = [mediaUrl];
    }

    const result = await twilioClient.messages.create(payload);
    console.log("WhatsApp sent! SID:", result.sid);
    return result;
  } catch (error) {
    console.error("Twilio WhatsApp Error:", error.message);
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
        content: pdfBuffer,
      });

      if (sendWhatsApp && bookingDetails.phone) {
        try {
          pdfUrl = await uploadBufferToCloudinary(pdfBuffer, "Appointment_Slip.pdf");
        } catch (waError) {
          console.error("Cloudinary Upload Error:", waError.message);
        }
      }
    }

    // Email Content
    const emailSubject = bookingDetails.status === "Confirmed" 
      ? `Appointment Approved - ${bookingDetails.hospitalName}`
      : `Appointment Update - ${bookingDetails.hospitalName}`;

    const emailBody = `Dear ${bookingDetails.patientName},

Your appointment has been ${bookingDetails.status === 'Confirmed' ? 'approved' : 'updated'}.

${includePDF ? 'Please find your appointment slip attached.' : ''}

Hospital: ${bookingDetails.hospitalName}
Branch: ${bookingDetails.branchName || 'Main'}
Date: ${bookingDetails.date}
Time: ${bookingDetails.time}
Appointment ID: ${bookingDetails.customId || bookingDetails._id}

Track Appointment: ${trackingURL}

Regards,
${bookingDetails.hospitalName}`;

    const mailOptions = {
      from: `"Clinoza HealthCare" <${process.env.EMAIL_USER}>`,
      to: patientEmail,
      subject: emailSubject,
      text: emailBody,
      attachments: attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${patientEmail}`);

    // WhatsApp Approval Message
    if (sendWhatsApp && bookingDetails.phone && bookingDetails.status === "Confirmed") {
      const waMessage = `🏥 *${bookingDetails.hospitalName}*

Dear *${bookingDetails.patientName}*,

Your appointment has been approved.

*Appointment Details:*
Hospital: ${bookingDetails.hospitalName}
Branch: ${bookingDetails.branchName || 'Main'}
Date: ${bookingDetails.date}
Time: ${bookingDetails.time}
Appointment ID: ${bookingDetails.customId || bookingDetails._id}

Please carry your appointment slip.

Track Appointment:
${trackingURL}

Thank you.`;

      await sendWhatsAppNotification(bookingDetails.phone, {
        body: waMessage,
        mediaUrl: pdfUrl
      });
    }

  } catch (error) {
    console.error("Mailer Error:", error);
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

Your appointment request has been successfully received.

*Appointment Details:*
Hospital: ${bookingDetails.hospitalName}
Branch: ${bookingDetails.branchName || 'Main'}
Date: ${bookingDetails.date}
Time: ${bookingDetails.time}
Appointment ID: ${bookingDetails.customId || bookingDetails._id}

Your appointment is currently under review.

Track Appointment:
${trackingURL}

For assistance:
📞 ${bookingDetails.supportPhone || '+91 0000000000'}

Thank you for choosing ${bookingDetails.hospitalName}`;

    await sendWhatsAppNotification(bookingDetails.phone, waMessage);
  } catch (error) {
    console.error("Booking WhatsApp Error:", error);
  }
};

const sendHospitalApprovalEmail = async (hospitalEmail, hospitalName, status) => {
  try {
    const mailOptions = {
      from: `"Clinoza Team" <${process.env.EMAIL_USER}>`,
      to: hospitalEmail,
      subject: `Hospital Status Update: ${status.toUpperCase()}`,
      text: `Hello ${hospitalName},\n\nYour hospital registration status has been updated to: ${status.toUpperCase()}.\n\n${status === 'approved' ? 'You can now log in and manage your dashboard.' : 'Please contact support for more details.'}\n\nThank you,\nClinoza Team`,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Hospital Approval Email Error:", error);
  }
};

const sendHospitalPendingEmail = async (hospitalEmail, hospitalName) => {
  try {
    const mailOptions = {
      from: `"Clinoza Team" <${process.env.EMAIL_USER}>`,
      to: hospitalEmail,
      subject: `Hospital Registration: UNDER REVIEW`,
      text: `Hello ${hospitalName},\n\nYour hospital registration is currently UNDER REVIEW.\n\nOur admin team will verify your details and approve it within 24 hours.\n\nYou will receive another email once it is approved.\n\nThank you for joining Clinoza!`,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Hospital Pending Email Error:", error);
  }
};

module.exports = { 
  sendAppointmentEmail, 
  sendWhatsAppNotification, 
  sendHospitalApprovalEmail,
  sendHospitalPendingEmail,
  sendBookingConfirmationWhatsApp
};
