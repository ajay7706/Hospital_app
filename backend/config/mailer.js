const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");

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

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log("Mailer connection error:", error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

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

    const mailOptions = {
      from: `"BookVisit Support" <${process.env.EMAIL_USER}>`,
      to: patientEmail,
      subject: `Appointment Update: ${bookingDetails.status.toUpperCase()} - ${bookingDetails.hospitalName}`,
      text: `Hello ${bookingDetails.patientName},\n\nYour appointment at ${bookingDetails.hospitalName} status is now: ${bookingDetails.status}.\n\nPlease find the details in the attached professional PDF.\n\nThank you for using BookVisit!`,
      attachments: [{ filename: "Appointment_Summary.pdf", content: pdfBuffer }],
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${bookingDetails.status} PDF to ${patientEmail}`);
  } catch (error) {
    console.error("Mailer Error:", error);
  }
};

const sendWhatsAppNotification = async (phone, details) => {
  // Simulating WhatsApp send (using Twilio config from .env if available)
  console.log(`[WhatsApp Simulation] Sending to ${phone}: Your appointment at ${details.hospitalName} is COMPLETED. You can now leave a review!`);
};

const sendHospitalApprovalEmail = async (hospitalEmail, hospitalName, status) => {
  try {
    const mailOptions = {
      from: `"BookVisit Admin" <${process.env.EMAIL_USER}>`,
      to: hospitalEmail,
      subject: `Hospital Status Update: ${status.toUpperCase()}`,
      text: `Hello ${hospitalName},\n\nYour hospital registration status has been updated to: ${status.toUpperCase()}.\n\n${status === 'approved' ? 'You can now log in and manage your dashboard.' : 'Please contact support for more details.'}\n\nThank you,\nBookVisit Team`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to hospital: ${status} to ${hospitalEmail}`);
  } catch (error) {
    console.error("Hospital Mailer Error:", error);
  }
};

const sendHospitalPendingEmail = async (hospitalEmail, hospitalName) => {
  try {
    const mailOptions = {
      from: `"BookVisit Admin" <${process.env.EMAIL_USER}>`,
      to: hospitalEmail,
      subject: `Hospital Registration: UNDER REVIEW`,
      text: `Hello ${hospitalName},\n\nYour hospital registration is currently UNDER REVIEW.\n\nOur admin team will verify your details and approve it within 24 hours.\n\nYou will receive another email once it is approved.\n\nThank you for joining BookVisit!`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Pending email sent to hospital: ${hospitalName} to ${hospitalEmail}`);
  } catch (error) {
    console.error("Hospital Pending Mailer Error:", error);
  }
};

module.exports = { 
  sendAppointmentEmail, 
  sendWhatsAppNotification, 
  sendHospitalApprovalEmail,
  sendHospitalPendingEmail 
};
