// import nodemailer from 'nodemailer';

// export const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT, 
//   secure: true, 
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD
//   }
// });

import * as Brevo from '@getbrevo/brevo';

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

export const sendEmail = async ({ from, to, subject, code }) => {
  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
        <img src="https://d2v1qjwl1c2i7l.cloudfront.net/chronicle.png" alt="The Chronicle" style="width: 100px; filter: brightness(0) invert(1);" />
      </div>
      <div style="padding: 40px 20px; text-align: center; color: #333;">
        <h2 style="margin-bottom: 20px; font-size: 24px;">Verify Your Email</h2>
        <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
          Welcome to <b>The Chronicle</b>. Use the verification code below to secure your account.
        </p>
        <div style="background: #f8f9fa; border: 2px dashed #007bff; padding: 20px; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #007bff; display: inline-block; border-radius: 8px;">
          ${code}
        </div>
        <p style="margin-top: 30px; color: #999; font-size: 13px;">
          This code is valid for <b>10 minutes</b>. If you didn't request this, please ignore this email.
        </p>
      </div>
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #888; font-size: 12px;">
        <p>&copy; 2026 The Chronicle. All rights reserved.</p>
      </div>
    </div>
  `;

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlBody;
  sendSmtpEmail.sender = { name: "The Chronicle", email: from };
  sendSmtpEmail.to = [{ email: to }];

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return data;
  } catch (error) {
    console.error('Brevo Error:', error);
    throw error;
  }
};