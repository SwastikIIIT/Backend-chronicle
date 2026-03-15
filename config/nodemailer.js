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

export const alertEmail=async({ from, to, subject, message })=>{
    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      
      <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
        <img src="https://d2v1qjwl1c2i7l.cloudfront.net/chronicle.png" alt="The Chronicle" style="width: 100px; filter: brightness(0) invert(1);" />
      </div>

      <div style="padding: 40px 20px; text-align: center; color: #333;">
        
        <div style="background-color: #fff3cd; color: #856404; display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; margin-bottom: 20px; border: 1px solid #ffeeba;">
          ⚠️ Security Notice
        </div>
        
        <h2 style="margin-bottom: 20px; font-size: 24px; color: #d9534f;">Account Security Alert</h2>
        
        <p style="color: #444; font-size: 16px; margin-bottom: 30px; line-height: 1.6; text-align: left; background: #fdf2f2; padding: 20px; border-left: 4px solid #d9534f; border-radius: 4px;">
          ${message}
        </p>

        <p style="margin-top: 30px; color: #666; font-size: 14px; line-height: 1.5;">
          If you authorized this action, you can safely ignore this email.<br><br>
          <b>If you did not initiate this action</b> or believe your account has been compromised, please <b>change your password immediately</b> and contact our support team.
        </p>

      </div>

      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #888; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} The Chronicle. All rights reserved.</p>
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
}

export const sendPasswordEmail = async ({ from, to, subject, link }) => {
  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  const htmlBody = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
    
    <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
      <img src="https://d2v1qjwl1c2i7l.cloudfront.net/chronicle.png" alt="The Chronicle" style="width: 100px; filter: brightness(0) invert(1);" />
    </div>

    <div style="padding: 40px 20px; text-align: center; color: #333;">
      
      <div style="background-color: #fff3cd; color: #856404; display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; margin-bottom: 20px; border: 1px solid #ffeeba;">
        🔑 Password Reset Request
      </div>

      <h2 style="margin-bottom: 20px; font-size: 24px;">Reset Your Password</h2>

      <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
        We received a request to reset the password for your <b>The Chronicle</b> account.
      </p>

      <a href="${link}" 
        style="display:inline-block;background:#007bff;color:white;text-decoration:none;padding:14px 28px;font-size:16px;font-weight:bold;border-radius:6px;">
        Reset Password
      </a>

      <p style="margin-top: 30px; color: #999; font-size: 13px;">
        This link will expire in <b>10 minutes</b>.
      </p>

      <p style="margin-top: 20px; color: #666; font-size: 14px; line-height: 1.5;">
        If you did not request a password reset, you can safely ignore this email.
      </p>

    </div>

    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #888; font-size: 12px;">
      <p>&copy; ${new Date().getFullYear()} The Chronicle. All rights reserved.</p>
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
    console.error("Brevo Error:", error);
    throw error;
  }
};