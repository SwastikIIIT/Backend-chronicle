import mongoose from "mongoose";

const PasskeySchema = new mongoose.Schema(
    {
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true,
            index: true 
        },
        credentialID: { 
            type: String, 
            required: true, 
            unique: true,
            index: true 
        },
        credentialPublicKey: { 
            type: Buffer, 
            required: true 
        },
        // Prevents replay attacks
        counter: { 
            type: Number, 
            required: true, 
            default: 0 
        },
        // 'singleDevice' or 'multiDevice'
        credentialDeviceType: { 
            type: String, 
            required: true 
        },
        transports: { 
            type: [String], 
            default: [] 
        }
    },
    { timestamps: true }
);

const Passkey = mongoose.models?.Passkey || mongoose.model('Passkey', PasskeySchema);
export default Passkey;