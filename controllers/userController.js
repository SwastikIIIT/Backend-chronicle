import User from "../models/User.js";
import speakeasy from "speakeasy";
import crypto from 'crypto';
import mongoose from "mongoose";
import qrcode from "qrcode";
import { PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import { client } from "../config/s3.js";
import { processedBuffer } from "../config/sharp.js";
import { compare, hash } from "bcryptjs";
import {encrypt , decrypt } from "../config/encryption.js";
import VerifyEmail from "../models/VerifyEmail.js";
import { transporter } from "../config/nodemailer.js";

export const getUserDetail = async (req,res) => {
    try{
        // Aggregation Pipeline
        const user = await User.aggregate([
          { $match:{ _id: new mongoose.Types.ObjectId(req.user.id) } },
          { $lookup:{
              from: "loginevents",
              localField: "_id",
              foreignField: "userId",
              as:"loginHistory",
            }
          },
        ])
        if(!user || user.length===0)
            return res.status(401).json({error: 'User not found'});

        return  res.status(200).json({ user:user[0], message:"Successfully fetched user info from DB."})
    }
    catch(err)
    {
        console.error('User fetch error',err);
        return res.status(500).json({error: err.message || 'Failed to fetch user data from database'});
    }
}

export const uploadAvatar = async (req,res) =>{
   try{
       const file=req.file;

       if(!file)
         return res.status(400).json({ error: "No image file uploaded."})
       
       const fileExt = file?.mimetype.split('/')[1];
       const key=`avatars/${req.user.id}-${Date.now()}.${fileExt}`;
       const buffer = await processedBuffer(fileExt,file?.buffer);

       const command = new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: file?.mimetype,
       });
      
       await client.send(command);

       return res.status(200).json({key});
   }
   catch(err)
   {
      console.error(err);
      return res.status(500).json({error: err?.message || "Failed to generate presigned URL"});
   }
}

export const saveAvatar = async (req,res)=>{
    try{
          const { key }=req.body;
          
          if(!key)
            return res.status(400).json({error:"Key not provided."});
          
          const userId=req.user.id;

          await User.findByIdAndUpdate(userId,
            { image:`${process.env.CLOUDFRONT_DOMAIN}/${key.split('/')[1]}`},
          )

          return res.status(200).json({url:`${process.env.CLOUDFRONT_DOMAIN}/${key.split('/')[1]}`});
    }
    catch(err){
      console.error(err);
      return res.status(500).json({error:err?.message || "Failed to save image."})
    }
}

export const setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+twoFactor.secret +twoFactor.enabled");

    if (user.twoFactor?.enabled)
      return res.status(400).json({ error: "2FA already enabled" });

    // generate secret
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `The Chronicle : ${user.email}`,
      issuer: "The Chronicle"
    });
    
    user.twoFactor.secret = encrypt(secret.base32);
    await user.save();

    const qr = await qrcode.toDataURL(secret.otpauth_url);

    return res.status(200).json({ qr , secret:secret.base32 });
  }
  catch (err)
  {
    console.error("2FA setup error:", err);
    return res.status(500).json({error: err?.message || "Failed to initiate 2FA setup" });
  }
};

export const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const userId  = req.user.id;

    if (!token)
      return res.status(400).json({ error: "Verification code required" });
    

    const user = await User.findById(userId).select("+twoFactor.secret +twoFactor.enabled +twoFactor.recoveryCodes");
   
    if (!user?.twoFactor?.secret)
      return res.status(400).json({ message: "2FA setup not initiated" });

    const verified = speakeasy.totp.verify({
      secret: decrypt(user.twoFactor.secret),
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified)
      return res.status(400).json({ message: "Invalid verification code" });

    const recoveryCodes = Array.from({ length: 5 }, () => crypto.randomBytes(4).toString('hex'));
    const dbRecoveryCodes = await Promise.all(recoveryCodes.map((code)=>hash(code,12)));

    user.twoFactor.recoveryCodes = dbRecoveryCodes;
    user.twoFactor.enabled = true;
    await user.save();

    return res.status(200).json({ message: "Two-factor authentication enabled", recoveryCodes});
  }
  catch (err) {
    console.error("2FA verify error:", err);
    return res.status(500).json({ error: err?.message || "Failed to enable 2FA"});
  }
};

export const disable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+twoFactor.secret +twoFactor.enabled +twoFactor.recoveryCodes");

    if (!user.twoFactor.enabled)
      return res.status(400).json({ error: "2FA not enabled" });

    user.twoFactor.enabled = false;
    user.twoFactor.recoveryCodes = undefined;
    user.twoFactor.secret = undefined;

    await user.save();
    console.log("User:",user);
    return res.status(200).json({ message: "2FA disabled" });
  } catch(err) {
    console.log(err);
    return res.status(500).json({ error: err?.message || "Failed to disable 2FA" });
  }
};

export const sendEmailCode = async (req,res) => {
  try{
       const { email } = req.body;
       
       if(!email)
         return res.status(400).json({error: "Email is required"});
       
       // Prevent Spam
       const existingRequest = await VerifyEmail.findOne({ 
          userID: req.user.id,
          createdAt:{ $gt: new Date( Date.now()-60*1000 )}
       })

       if(existingRequest)
        return res.status(429).json({error: "Please wait 1 minute before requesting a new code."})

       // Delete previous requests
       await VerifyEmail.deleteMany({ userID: req.user.id });

       const code = crypto.randomInt(100000, 999999).toString();
       const tokenHash = await hash(code,12);
       const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

       const rec=await VerifyEmail.create({
         userID: req.user.id,
         email,
         tokenHash,
         status:"PENDING",
         expiresAt: expiryTime
       })

       await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: "Your Verification Code",
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>Verify Your Email</h2>
              <p>Use the code below to complete your verification.</p>
              <div style="background: #f4f4f4; padding: 10px 20px; font-size: 24px; letter-spacing: 5px; font-weight: bold; display: inline-block; border-radius: 5px;">
                ${code}
              </div>
              <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
            </div>
          `,
       });

       return res.status(200).json({ message: "Verification code sent successfully." });
  }
  catch(err)
  {
    console.error(err);
    return res.status(500).json({error: err?.message || "Failed to send verification code."})
  }
}

export const verifyEmailCode = async (req,res) => {
  try{
      const { email, code } = req.body;
      if (!email || !code) 
        return res.status(400).json({ error: "Email and verification code are required" });

      const record = await VerifyEmail.findOne({ userID: req.user.id,email: email}).select("+tokenHash");
      console.log("Record:",record);
      if (!record) 
        return res.status(400).json({ error: "Invalid or expired verification code." });
    
      const isValid = await compare(code, record?.tokenHash);
     
      if (!isValid) 
        return res.status(400).json({ error: "Invalid verification code." });

      const user = await User.findByIdAndUpdate(req.user.id,{ isVerified: true },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      await VerifyEmail.deleteOne({ _id: record._id })
      
      return res.status(200).json({ message: "Email verified successfully."});
  }
  catch(err)
  {
    console.error(err);
    return res.status(500).json({error:err?.message || "Failed to verify email"})
  }
}
