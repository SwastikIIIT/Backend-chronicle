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
    device:{
        type: String,
        default: null
    },
    location:{
        region: String,
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

LoginEventSchema.index({ userId:1, createdAt:-1 })

const LoginEvent = mongoose.models?.LoginEvent || mongoose.model("LoginEvent", LoginEventSchema);

export default LoginEvent;
