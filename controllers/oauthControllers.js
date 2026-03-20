import User from "../models/User.js";
import { getIp } from "../utils/getIp.js";
import { recordLoginEvent } from "../utils/recordHistory.js";

export const googleOAuthLogin=async(req,res)=>{
    try{
       const { email, name, image, providerId, provider } = req.body;
       const userAgent=req.headers['x-chronicle-ua'];
       const ipAddress=req.headers['x-chronicle-client-ip']

       if(!email || !providerId) 
            return res.status(400).json({ error: "Missing Oauth profile data" });

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
                if (req.body.provider === 'github') user.providers.github = { id: providerId };
                else if (req.body.provider === 'google') user.providers.google = { id: providerId };
                user.isVerified = true; 
            }
            user.image=image;
            user.name=name;
            user.lastLogin = new Date();
            await user.save();
       }
        
       await recordLoginEvent({
            headers: req.headers,
            userId: user._id,
            success: true,
            provider: provider, // "google","github"
            reason: "LOGIN_SUCCESS",
            userAgent,
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