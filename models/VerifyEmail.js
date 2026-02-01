import mongoose from "mongoose";

const VerifyEmailSchema = new mongoose.Schema(
 {
    userID:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true
    },
    tokenHash:{
        type: String,
        select: false,
        required: true
    },
    expiresAt:{
        type: Date,
        required: true,
        index: {expires: 0},   // TTL index that delete document at expiry time
    }
  },
  { timestamps: true }
);

const VerifyEmail=mongoose.model?.VerifyEmail || mongoose.model("VerifyEmail",VerifyEmailSchema);

export default VerifyEmail;