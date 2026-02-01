import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        username:{
            type: String,
            required:[true,"Username is required"],
            trim:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            index:true,   // mongodb indexes this field.Faster search by email
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
            trim:true
        },
        password:{
            type:String,
            select:false,  // field omitted in find result
            minlength:[6,"Password must be atleast 6 characters long"]
        },
        isVerified:{ type:Boolean, default:false },
        // embedded data or document
        twoFactor: {
            enabled: { type: Boolean, default: false },
            secret: { type: String, select: false },
            recoveryCodes: { type: Array, select: false },
        },
        providers: {
            google: { id: String },
            github: { id: String },
        },
        image: { type: String, default: null},

        lastLogin: { type:Date, default: null },
        passwordLastChanged: { type:Date, default: null },
        
        lockUntil: { type:Date, default:null },
    },
    {timestamps: true}
);


//used optional chaining operator for resolving undefined user model error
const User=mongoose.models?.User || mongoose.model('User',UserSchema);
export default User;