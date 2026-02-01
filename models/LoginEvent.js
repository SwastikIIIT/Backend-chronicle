import mongoose from "mongoose";

const LoginEventSchema=new mongoose.Schema(
 {
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
        required: true,
    },
    success: { type: Boolean, required: true },
    ipAddress: String, // default==undefined
    userAgent: String,
    device:{
        type: String,
        default: null
    },
    location:{
        city: String,
        country: String,
        timezone: String
    },
    provider: {
        type: String,
        enum: ["credentials", "google", "github"],
    },
    reason: {
        type: String, // INVALID_PASSWORD, INVALID_2FA, LOCKED, LOGIN_SUCCESS
    },
 },
 { timestamps: true }
);

LoginEventSchema.index({ userId:1, timestamp:-1 })

const LoginEvent = mongoose.models?.LoginEvent || mongoose.model("LoginEvent", LoginEventSchema);

export default LoginEvent;
