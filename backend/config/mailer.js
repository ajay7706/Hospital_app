const sgMail = require("@sendgrid/mail");
const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const createProfessionalPDF = (doc, details) => {
  // --- Header with Blue Background ---
  doc.rect(0, 0, 612, 100).fill("#2563eb");
  
  // --- Logo Placeholder (White Plus) ---
  doc.fillColor("#ffffff")
     .rect(50, 30, 40, 40).fill()
     .fillColor("#2563eb")
     .fontSize(30).text("+", 61, 33);

  // --- Brand Name ---
  doc.fillColor("#ffffff")
     .fontSize(22)
     .text("Apna Clinic", 100, 35, { bold: true })
     .fontSize(10)
     .text("Healthcare", 100, 60);
  
  // --- Header Badge ---
  doc.rect(400, 40, 180, 30).fill("#1e40af");
  doc.fillColor("#ffffff")
     .fontSize(10)
     .text("APPOINTMENT CONFIRMATION", 410, 50, { align: "center", width: 160 });

  // --- Section 1: Basic Information ---
  doc.fillColor("#2563eb")
     .fontSize(16)
     .text("Patient Basic Information", 50, 120, { bold: true });
  doc.moveTo(50, 140).lineTo(562, 140).stroke("#e5e7eb");

  // --- Information Box ---
  doc.roundedRect(50, 160, 512, 180, 10).stroke("#e5e7eb");
  
  const leftX = 70;
  const rightX = 300;
  let currentY = 180;

  doc.fillColor("#374151").fontSize(10).text("Patient Name:", leftX, currentY);
  doc.fillColor("#1e3a8a").fontSize(11).text(details.patientName, leftX + 80, currentY, { bold: true });
  
  currentY += 30;
  doc.fillColor("#374151").fontSize(10).text("Contact No:", leftX, currentY);
  doc.fillColor("#1e3a8a").text(details.phone || "N/A", leftX + 80, currentY);

  currentY += 30;
  doc.fillColor("#374151").fontSize(10).text("Email:", leftX, currentY);
  doc.fillColor("#1e3a8a").text(details.patientEmail || "N/A", leftX + 80, currentY);

  currentY += 30;
  doc.fillColor("#374151").fontSize(10).text("Date:", leftX, currentY);
  doc.fillColor("#1e3a8a").text(details.date, leftX + 80, currentY);

  currentY += 30;
  doc.fillColor("#374151").fontSize(10).text("Time:", leftX, currentY);
  doc.fillColor("#1e3a8a").text(details.time, leftX + 80, currentY);

  // --- Hospital Info ---
  doc.fillColor("#374151").fontSize(10).text("Hospital:", rightX, 180);
  doc.fillColor("#1e3a8a").fontSize(11).text(details.hospitalName, rightX + 60, 180, { bold: true });
  
  doc.fillColor("#374151").fontSize(10).text("Location:", rightX, 210);
  doc.fillColor("#1e3a8a").fontSize(10).text(details.location, rightX + 60, 210, { width: 180 });

  // --- Footer ---
  doc.rect(0, 750, 612, 42).fill("#1e3a8a");
  doc.fillColor("#ffffff").fontSize(10)
     .text(`Contact Us: +91 9876543210 | info@apnaclinic.com`, 0, 765, { align: "center", width: 612 });
  doc.fontSize(8).text("www.apnaclinic.com", 0, 780, { align: "center", width: 612 });
};

const twilio = require("twilio");

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsAppNotification = async (phone, message) => {
  try {
    const textMessage = message || "Notification from Apna Clinic";

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
      const doc = new PDFDocument({ margin: 50 });
      const stream = new PassThrough();
      doc.pipe(stream);
      createProfessionalPDF(doc, bookingDetails);
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
      text: bookingDetails.msg || `Hello ${bookingDetails.patientName},\n\nYour appointment at ${bookingDetails.hospitalName} status is now: ${bookingDetails.status}.\n\nThank you for using BookVisit!`,
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
