import { redis } from '../database/redis.js';
import { getIp } from '../utils/getIp.js'; 

export const checkLocks = async (req, res, next) => {
    try {
        const { email } = req.body;
        const ipAddress = await getIp(req);

        // 1. Check IP Blacklist
        const isIpLocked = await redis.get(`lock:ip:${ipAddress}`);
        if (isIpLocked) {
            return res.status(403).json({  message: "Your IP has been temporarily blocked due to suspicious activity."});
        }

        // 2. Check Account Lock (if email is provided)
        if (email) {
            const isAccountLocked=await redis.get(`lock:account:${email}`);
            if (isAccountLocked) {
                return res.status(403).json({message:"Account is temporarily locked for security reasons. Please try again later."})
            }
        }
        
        next();
    } catch (error) {
        console.error("Security Middleware Error:", error);
        next(); 
    }
};