import PasswordReset from "../models/PasswordReset.js";
import User from "../models/User.js";
import crypto from "crypto";
import { compare, hash } from "bcryptjs";
import { sendEmail } from "../config/nodemailer.js";

// Client -> Email -> token,usedId in db -> Link with token and id.
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User doesn't exist" });

    // Prevent Spam
    const existingRequest = await PasswordReset.findOne({
      userID: user._id,
      createdAt: { $gt: new Date(Date.now() - 5 * 1000) },
    });

    if (existingRequest)
      return res.status(400).json({
        error: "Please wait 5 minutes before requesting another link.",
      });

    // Delete earliers passwordReset logs
    await PasswordReset.deleteMany({ userId: user._id });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = await hash(resetToken, 10);

    await PasswordReset.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&id=${user._id}`;

    await sendEmail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h1>Password Reset Request</h1>
          <p>You requested a password reset for your account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p style="margin-top: 20px;">This link will expire in 1 hour.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    return res.status(200).json({ message: "Reset link sent successfully" });
  } catch (err) {
    console.error("Error:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Failed to send reset link" });
  }
};

// Client -> pass,token -> validate token+id -> grant change
export const passwordChange = async (req, res) => {
  try {
    const { token, newPassword, userId } = req.body;

    if (!userId || !token || !newPassword)
      return res.status(400).json({ error: "Missing required fields" });

    const resetRecord = await PasswordReset.findOne({ userId }).select(
      "+tokenHash",
    );

    if (!resetRecord)
      return res
        .status(400)
        .json({ error: "Invalid or expired password reset link" });

    const isValid = await compare(token, resetRecord.tokenHash);

    if (!isValid) return res.status(400).json({ error: "Invalid token" });

    const hashedPassword = await hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    await PasswordReset.deleteOne({ _id: resetRecord._id });

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Password Reset Error:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Failed to send reset link" });
  }
};
