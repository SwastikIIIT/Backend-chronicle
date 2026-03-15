import User from "../models/User.js";
import crypto from "crypto";
import { compare, hash } from "bcryptjs";
import { sendPasswordEmail } from "../config/nodemailer.js";
import { redis } from "../database/redis.js";

// Client -> Email -> token,usedId in db -> Link with token and id.
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User doesn't exist" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = await hash(resetToken, 10);

    const redisKey=`verify:password:${email}`;
    await redis.set(redisKey,JSON.stringify({email:email,token:tokenHash}),{EX:600});

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

    await sendPasswordEmail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Password Reset Request",
      link:resetLink
    });

    return res.status(200).json({ message: "Reset link sent successfully" });
  } catch (err) {
    console.error("Error:", err);
    await redis.del(`limit:${req.body.email}`);
    return res.status(500).json({ error: err?.message || "Failed to send reset link" });
  }
};

// Client -> pass,token -> validate token+id -> grant change
export const passwordChange = async (req, res) => {
  try {
    const { token, newPassword, email } = req.body;

    if (!email || !token || !newPassword)
      return res.status(400).json({ error: "Missing required fields" });

    const passwordRequest=await redis.get(`verify:password:${email}`);
    if (!passwordRequest)
      return res.status(400).json({ error: "Invalid or expired password reset link" });

    const {email:cachedEmail,token:cachedToken}=JSON.parse(passwordRequest);
    if (cachedEmail !== email) 
      return res.status(400).json({ error: "Invalid Request" });

    const isValid = await compare(token, cachedToken);

    if (!isValid) return res.status(400).json({ error: "Invalid token" });

    const hashedPassword = await hash(newPassword, 10);
    await User.findOneAndUpdate({email:cachedEmail}, {password:hashedPassword});
    
    // Remove all the locks
    await Promise.all([
      redis.del(`verify:password:${email}`),
      redis.del(`limit:email:${email}`)
    ]);

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Password Reset Error:", err);
    return res.status(500).json({ error: err?.message || "Failed to send reset link" });
  }
};
