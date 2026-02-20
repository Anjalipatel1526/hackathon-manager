import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Sends a confirmation email to the candidate or team leader
 */
export const sendConfirmationEmail = async (to, subject, message) => {
    const mailOptions = {
        from: `"HR Team" <${process.env.SMTP_USER}>`,
        to: to,
        subject: subject,
        text: message,
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>HR Candidate System</h2>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <p>Best Regards,<br>HR Team</p>
          </div>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (err) {
        console.error('Error sending email:', err);
        // Don't throw to avoid breaking the core flow, but log it
    }
};

/**
 * Phase 1 Email
 */
export const sendPhase1Email = async (email, name, isTeam = false) => {
    const subject = `Project Description Received - ${name}`;
    const message = isTeam
        ? `Hello ${name} Team Leader,\n\nYour team's project description has been received successfully. The HR team will review it and contact you soon.`
        : `Hello ${name},\n\nYour project description has been received successfully. The HR team will review it and contact you soon.`;

    await sendConfirmationEmail(email, subject, message);
};

/**
 * Phase 2 Email
 */
export const sendPhase2Email = async (email, name, isTeam = false) => {
    const subject = `Final Project Received - ${name}`;
    const message = isTeam
        ? `Hello ${name} Team Leader,\n\nYour team's final project submission has been successfully received and is now under review.`
        : `Hello ${name},\n\nYour final project submission has been successfully received and is now under review.`;

    await sendConfirmationEmail(email, subject, message);
};
