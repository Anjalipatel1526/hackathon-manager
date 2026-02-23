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
export const sendPhase1Email = async (email, name, registrationId, isTeam = false) => {
    const subject = `Project Description Received - ${name}`;
    const message = isTeam
        ? `Hello ${name} Team Leader,\n\nYour team's phase 1 registration is completed. Please wait for phase 2. Your code is ${registrationId}.`
        : `Hello ${name},\n\nYour phase 1 registration is completed. Please wait for phase 2. Your code is ${registrationId}.`;

    await sendConfirmationEmail(email, subject, message);
};

/**
 * Phase 2 Broadcast Email
 */
export const sendPhase2BroadcastEmail = async (email, name, isTeam = false) => {
    const subject = `Phase 2 Registration Open - ${name}`;
    const message = `Registration is now open for Phase 2.\n\nPlease submit your project through the GitHub link and upload your README file.`;

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

/**
 * Status Update Email (Approved/Rejected)
 */
export const sendStatusUpdateEmail = async (email, name, status, remarks = '') => {
    const subject = `Application Status Update - ${status}`;
    const statusColor = status === 'Approved' ? '#10b981' : '#f43f5e';
    const statusText = status === 'Approved' ? 'Congratulation! Your application has been Approved.' : 'We regret to inform you that your application has been Rejected.';

    const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; rounded: 12px; overflow: hidden;">
            <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Codekar Hackathon</h1>
            </div>
            <div style="padding: 30px; background-color: #ffffff;">
                <h2 style="color: #1e293b; margin-top: 0;">Hello ${name},</h2>
                <p style="font-size: 16px; color: #475569;">${statusText}</p>
                
                <div style="margin: 25px 0; padding: 20px; background-color: #f8fafc; border-left: 4px solid ${statusColor}; border-radius: 4px;">
                    <p style="margin: 0; font-weight: bold; color: ${statusColor}; text-transform: uppercase; font-size: 14px; letter-spacing: 0.05em;">Current Status</p>
                    <p style="margin: 5px 0 0 0; font-size: 18px; color: #1e293b; font-weight: bold;">${status}</p>
                </div>

                ${remarks ? `
                <div style="margin-bottom: 25px;">
                    <p style="margin: 0 0 8px 0; font-weight: bold; color: #64748b; font-size: 14px; text-transform: uppercase;">HR Remarks:</p>
                    <div style="padding: 15px; background-color: #f1f5f9; border-radius: 8px; color: #334155; font-style: italic;">
                        "${remarks}"
                    </div>
                </div>
                ` : ''}

                <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2026 Codekar Hackathon HR Team. All rights reserved.</p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: `"Codekar HR Team" <${process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        html: htmlContent,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Status update email (${status}) sent to ${email}`);
    } catch (err) {
        console.error('Error sending status update email:', err);
    }
};
