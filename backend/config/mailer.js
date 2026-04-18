const sgMail = require("@sendgrid/mail");
const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");
const QRCode = require('qrcode');

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const createProfessionalPDF = (doc, details, qrDataURL) => {
  // Page Configuration
  const pageWidth = 572;
  const pageHeight = 752;
  const margin = 20;

  // --- Header with Deep Blue Background ---
  doc.fillColor("#1e3a8a").rect(margin, margin, pageWidth, 90).fill();
  
  // --- Logo Section (White Circle with Brand initials) ---
  doc.fillColor("#ffffff").circle(65, 65, 30).fill();
  doc.fillColor("#1e3a8a").fontSize(22).text("AC", 52, 55, { bold: true });

  // --- Brand Name ---
  doc.fillColor("#ffffff")
     .fontSize(22)
     .text(details.hospitalName || "Apna Clinic", 110, 48, { bold: true })
     .fontSize(9)
     .text("HEALTHCARE", 110, 72, { characterSpacing: 1.5 });
  
  // --- Header Badge (Right Side) ---
  doc.fillColor("#2563eb").rect(380, 42, 192, 45, 3).fill();
  doc.fillColor("#ffffff")
     .fontSize(7)
     .text("RECEIPT NO: " + (details._id?.toString().slice(-8).toUpperCase() || "EA5AD4F4"), 390, 50)
     .fontSize(10)
     .text("APPOINTMENT RECEIPT", 390, 64, { bold: true });

  // --- Section 0: The "Hero" Stats Bar (Token, Fee, Queue) ---
  const statsY = 125;
  // Background for the Hero section
  doc.fillColor("#f1f5f9").roundedRect(margin + 20, statsY, pageWidth - 40, 75, 8).fill();
  
  // 0.1 QR Code Area
  if (qrDataURL) {
    doc.fillColor("#ffffff").rect(margin + 30, statsY + 5, 65, 65).fill();
    doc.image(qrDataURL, margin + 31, statsY + 6, { width: 63 });
    doc.fillColor("#64748b").fontSize(7).text("SCAN TO VERIFY APPOINTMENT", margin + 20, statsY + 74, { width: 100, align: 'center' });
  }

  // 0.2 Token Number
  doc.fillColor("#64748b").fontSize(9).text("YOUR NUMBER", 145, statsY + 12);
  doc.fillColor("#1e3a8a").fontSize(42).text(details.tokenNumber || "45", 145, statsY + 24, { bold: true });

  // 0.3 OPD Fee
  const dividerX = 280;
  doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(dividerX, statsY + 10).lineTo(dividerX, statsY + 65).stroke();
  
  doc.fillColor("#64748b").fontSize(12).text("OPD FEE", dividerX + 30, statsY + 14);
  doc.fillColor("#1e3a8a").fontSize(18).text("₹ " + (details.opdCharge || details.opdFee || "300"), dividerX + 135, statsY + 14, { bold: true });

  // 0.4 Serving Status Bar (Navy Blue)
  const servingY = statsY + 38;
  doc.fillColor("#1e293b").roundedRect(dividerX + 10, servingY, (pageWidth - 40) - (dividerX - (margin + 20)) - 15, 30, 4).fill();
  
  doc.fillColor("#ffffff").fontSize(10).text("Now Serving:", dividerX + 25, servingY + 10);
  doc.fontSize(13).text(details.nowServing || "18", dividerX + 90, servingY + 8, { bold: true });
  
  doc.fillColor("#cbd5e1").fontSize(8).text("People Ahead:", dividerX + 130, servingY + 12);
  doc.fillColor("#ffffff").fontSize(10).text(details.peopleAhead || "27", dividerX + 195, servingY + 10, { bold: true });


  // --- Section 1: Patient Information ---
  let currentY = statsY + 105;
  doc.fillColor("#1e3a8a").fontSize(12).text("PATIENT INFORMATION", 50, currentY, { bold: true });
  doc.strokeColor("#cbd5e1").lineWidth(0.5).moveTo(50, currentY + 18).lineTo(542, currentY + 18).stroke();

  const drawRow = (label, value, x, y) => {
    doc.fillColor("#94a3b8").fontSize(7).text(label, x, y);
    doc.fillColor("#1e293b").fontSize(10).text(value || "N/A", x, y + 12, { bold: true });
  };

  currentY += 35;
  drawRow("PATIENT NAME", details.patientName, 60, currentY);
  drawRow("APPOINTMENT DATE", details.date, 320, currentY);
  
  currentY += 50;
  drawRow("CONTACT NUMBER", details.phone, 60, currentY);
  drawRow("APPOINTMENT TIME", details.time, 320, currentY);

  currentY += 50;
  drawRow("EMAIL ADDRESS", details.patientEmail, 60, currentY);
  drawRow("PROBLEM / SYMPTOMS", details.problem && details.problem !== "undefined" ? details.problem : "General Consultation", 320, currentY);

  if (details.opdCharge && details.opdCharge > 0) {
    currentY += 50;
    drawRow("OPD CONSULTATION FEE", `Rs. ${details.opdCharge}`, 60, currentY);
  }

  // --- Section 2: Hospital & Provider Details ---
  currentY += 65;
  doc.fillColor("#1e3a8a").fontSize(12).text("HOSPITAL & PROVIDER DETAILS", 50, currentY, { bold: true });
  doc.strokeColor("#cbd5e1").lineWidth(0.5).moveTo(50, currentY + 18).lineTo(542, currentY + 18).stroke();
  
  currentY += 30;
  doc.fillColor("#f8fafc").roundedRect(50, currentY, 492, 55, 10).fill();
  doc.fillColor("#1e3a8a").fontSize(11).text(details.hospitalName, 65, currentY + 15, { bold: true });
  
  const address = details.branchDetails ? details.branchDetails.address : (details.location || "Lucknow, Uttar Pradesh");
  doc.fillColor("#64748b").fontSize(8).text(address, 65, currentY + 30, { width: 450 });

  // --- Section 3: Support Box ---
  currentY += 80;
  doc.strokeColor("#cbd5e1").lineWidth(1).roundedRect(50, currentY, 492, 60, 5).dash(3, { space: 2 }).stroke().undash();
  doc.fillColor("#475569").fontSize(9).text("For Support & Queries:", 65, currentY + 12, { bold: true });
  
  doc.fillColor("#1e3a8a").fontSize(9)
     .text(`Email: ${details.supportEmail || "support@apnaclinic.com"}`, 65, currentY + 32)
     .text(`Contact: ${details.supportPhone || "+91 9816326950"}`, 320, currentY + 32, { bold: true });

  // --- Notes Section ---
  currentY += 85;
  doc.fillColor("#94a3b8").fontSize(7)
     .text("Notes:", 50, currentY)
     .text("1. Please arrive at least 15 minutes before your scheduled time.", 50, currentY + 10)
     .text("2. Carry a valid photo ID and previous medical records if any.", 50, currentY + 18)
     .text("3. Cancellations should be made at least 2 hours in advance.", 50, currentY + 26);

  // --- Bottom Footer Strip ---
  doc.fillColor("#2e4a9e").rect(margin, pageHeight - 35, pageWidth, 30).fill();
  doc.fillColor("#ffffff").fontSize(9)
     .text("Generated by Apna Clinic HealthCare Ecosystem - Secure Medical Records", 20, 753, { align: "center", width: 572 });
};

const twilio = require("twilio");

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsAppNotification = async (phone, message) => {
  try {
    const textMessage = message || "Notification from Apna Clinic HealthCare";

    const formattedPhone = phone.startsWith("whatsapp:") 
      ? phone 
      : `whatsapp:${phone}`;

    console.log("Sending WhatsApp to:", formattedPhone);
    console.log("Message:", textMessage);

    await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: formattedPhone,
      body: textMessage,
    });

    console.log("WhatsApp sent successfully");
  } catch (error) {
    console.error("Twilio WhatsApp Error:", error.message);
  }
};

const sendAppointmentEmail = async (patientEmail, bookingDetails, includePDF = true) => {
  try {
    let attachments = [];
    
    if (includePDF) {
      // Generate QR Code URL
      const trackingURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/track-appointment?query=${bookingDetails._id}`;
      bookingDetails.trackingURL = trackingURL;
      
      const qrDataURL = await QRCode.toDataURL(trackingURL);

      const doc = new PDFDocument({ margin: 50 });
      const stream = new PassThrough();
      doc.pipe(stream);
      createProfessionalPDF(doc, bookingDetails, qrDataURL);
      doc.end();

      const chunks = [];
      for await (const chunk of stream) { chunks.push(chunk); }
      const pdfBuffer = Buffer.concat(chunks);
      
      attachments.push({
        content: pdfBuffer.toString("base64"),
        filename: "Appointment_Summary.pdf",
        type: "application/pdf",
        disposition: "attachment",
      });
    }

    const msg = {
      to: patientEmail,
      from: process.env.SENDGRID_SENDER_EMAIL,
      subject: `Appointment Update: ${bookingDetails.status.toUpperCase()} - ${bookingDetails.hospitalName}`,
      text: bookingDetails.msg || `Hello ${bookingDetails.patientName},\n\nYour appointment at ${bookingDetails.hospitalName} status is now: ${bookingDetails.status}.\n\nThank you for using Apna Clinic HealthCare!`,
      attachments: attachments,
    };

    await sgMail.send(msg);
    console.log(`Email sent: ${bookingDetails.status} to ${patientEmail} via SendGrid (PDF: ${includePDF})`);
  } catch (error) {
    console.error("SendGrid Mailer Error:", error.response ? error.response.body : error);
  }
};


const sendHospitalApprovalEmail = async (hospitalEmail, hospitalName, status) => {
  try {
    const message = `Hello ${hospitalName},\n\nYour hospital registration status has been updated to: ${status.toUpperCase()}.\n\n${status === 'approved' ? 'You can now log in and manage your dashboard.' : 'Please contact support for more details.'}\n\nThank you,\nBookVisit Team`;

    const msg = {
      to: hospitalEmail,
      from: process.env.SENDGRID_SENDER_EMAIL,
      subject: `Hospital Status Update: ${status.toUpperCase()}`,
      text: message,
    };

    await sgMail.send(msg);
    console.log(`Email sent to hospital: ${status} to ${hospitalEmail} via SendGrid`);
  } catch (error) {
    console.error("SendGrid Hospital Mailer Error:", error.response ? error.response.body : error);
  }
};

const sendHospitalPendingEmail = async (hospitalEmail, hospitalName) => {
  try {
    const msg = {
      to: hospitalEmail,
      from: process.env.SENDGRID_SENDER_EMAIL,
      subject: `Hospital Registration: UNDER REVIEW`,
      text: `Hello ${hospitalName},\n\nYour hospital registration is currently UNDER REVIEW.\n\nOur admin team will verify your details and approve it within 24 hours.\n\nYou will receive another email once it is approved.\n\nThank you for joining BookVisit!`,
    };

    await sgMail.send(msg);
    console.log(`Pending email sent to hospital: ${hospitalName} to ${hospitalEmail} via SendGrid`);
  } catch (error) {
    console.error("SendGrid Hospital Pending Mailer Error:", error.response ? error.response.body : error);
  }
};

module.exports = { 
  sendAppointmentEmail, 
  sendWhatsAppNotification, 
  sendHospitalApprovalEmail,
  sendHospitalPendingEmail 
};
