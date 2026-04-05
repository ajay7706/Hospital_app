const sgMail = require("@sendgrid/mail");
const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const createProfessionalPDF = (doc, details) => {
  // Add a nice header background
  doc.rect(0, 0, 612, 100).fill("#2563eb"); // Primary blue color
  
  doc.fillColor("#ffffff")
     .fontSize(24)
     .text("BOOK VISIT - APPOINTMENT", 50, 40, { align: "left" });
  
  doc.fontSize(10)
     .text("Official Medical Receipt", 50, 70);

  // Body content
  doc.fillColor("#333333").moveDown(4);
  
  doc.fontSize(18).text("Patient Information", { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`Name: ${details.patientName}`);
  doc.text(`Email: ${details.patientEmail || "N/A"}`);
  doc.text(`Contact: ${details.phone || "N/A"}`);
  
  doc.moveDown(2);
  doc.fontSize(18).text("Hospital Details", { underline: true });
  doc.moveDown();
  doc.fontSize(14).fillColor("#2563eb").text(`${details.hospitalName}`, { bold: true });
  doc.fillColor("#333333").fontSize(12).text(`Location: ${details.location}`);
  
  doc.moveDown(2);
  doc.fontSize(18).text("Appointment Schedule", { underline: true });
  doc.moveDown();
  doc.rect(50, doc.y, 500, 60).fill("#f3f4f6");
  doc.fillColor("#1f2937")
     .text(`Date: ${details.date}`, 70, doc.y + 15)
     .text(`Time: ${details.time}`, 70, doc.y + 35);

  // Footer
  doc.fillColor("#9ca3af")
     .fontSize(10)
     .text("This is a computer-generated document. No signature required.", 0, 700, { align: "center" });
};

const twilio = require("twilio");

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsAppNotification = async (phone, message) => {
  try {
    // Ensure phone number is in correct format for WhatsApp (e.g., whatsapp:+91...)
    const formattedPhone = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
    
    await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: formattedPhone,
      body: message,
    });
    console.log(`WhatsApp sent to ${formattedPhone}`);
  } catch (error) {
    console.error("Twilio WhatsApp Error:", error);
  }
};

const sendAppointmentEmail = async (patientEmail, bookingDetails) => {
  try {
    const doc = new PDFDocument({ margin: 50 });
    const stream = new PassThrough();
    doc.pipe(stream);
    createProfessionalPDF(doc, bookingDetails);
    doc.end();

    const chunks = [];
    for await (const chunk of stream) { chunks.push(chunk); }
    const pdfBuffer = Buffer.concat(chunks);

    const msg = {
      to: patientEmail,
      from: process.env.SENDGRID_SENDER_EMAIL, // Verified sender
      subject: `Appointment Update: ${bookingDetails.status.toUpperCase()} - ${bookingDetails.hospitalName}`,
      text: `Hello ${bookingDetails.patientName},\n\nYour appointment at ${bookingDetails.hospitalName} status is now: ${bookingDetails.status}.\n\nPlease find the details in the attached professional PDF.\n\nThank you for using BookVisit!`,
      attachments: [
        {
          content: pdfBuffer.toString("base64"),
          filename: "Appointment_Summary.pdf",
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    };

    await sgMail.send(msg);
    console.log(`Email sent: ${bookingDetails.status} PDF to ${patientEmail} via SendGrid`);
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
