import User from "../models/User.js";
import { getIp } from "../utils/getIp.js";
import { recordLoginEvent } from "../utils/recordHistory.js";

export const googleOAuthLogin=async(req,res)=>{
    try{
       const { email, name, image, providerId, provider } = req.body;
    //    const userAgent=req.headers['user-agent'];

       if(!email || !providerId) 
            return res.status(400).json({ error: "Missing Google profile data" });

       const ipAddress=await getIp(req);
       let user=await User.findOne({ email }).select("+twoFactor.enabled");
       if(!user){
         user=await User.create({
                email:email,
                username: name,
                isVerified: true, 
                image,
                providers: { [provider]: { id: providerId } },
                lastLogin: new Date(),
             });
       }    
       else{
         // Merge the account
         if (!user.providers?.[provider]?.id) {
                user.providers = {
                    ...user.providers,
                    [provider]: { id: providerId }
                };
                user.isVerified = true; 
            }
            user.lastLogin = new Date();
            await user.save();
       }
        
       await recordLoginEvent({
            headers: req.headers,
            userId: user._id,
            success: true,
            provider: provider, // "google"
            reason: "LOGIN_SUCCESS",
            ipAddress,
        });
      
        return res.status(200).json({
            userId: user._id.toString(),
            email: user.email,
            name: user.username,
            image: user.image,
            hasTwoFactor: false
        });
    }
    catch(err)
    {
        console.error("Google OAuth error:", err);
        return res.status(500).json({error:err.message || "Google authentication failed"});
    }
}