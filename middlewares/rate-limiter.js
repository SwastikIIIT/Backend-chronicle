import { redis } from "../database/redis.js";

export const rateLimiter=(seconds=60)=>{
    return async(req,res,next)=>{
        const {email}=req.body;
        const userID=req.user.id;
        if (!email) return res.status(400).json({ error: "Email is required" });
        
        const limitKey=`limit:email:${userID}:${email}`;
        const isLocked=await redis.get(limitKey);

        if(isLocked){
            const ttl = await redis.ttl(limitKey);
            return res.status(429).json({error:`Please wait ${ttl} seconds before requesting a new code.`});
        }
        
        // Lock karo
        await redis.set(limitKey, "locked", { EX: seconds });
        next();
    }
}