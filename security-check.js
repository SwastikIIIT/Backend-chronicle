import cron from 'node-cron';
import LoginEvent from './models/LoginEvent.js';
import User from './models/User.js';
import { alertEmail } from './config/nodemailer.js';
import { redis } from './database/redis.js';

export async function startSecurityCron(){
    cron.schedule('0 0 * * *', async () => {
        console.log('🕒 [CRON] Starting Daily Security Scan & Cleanup...');
        
        try {
            const yesterday=new Date(Date.now()-24*60*60*1000);
            
            // 1. Old Logs(30 days) cleanup
            const thirtyDaysAgo=new Date(Date.now()-30*24*60*60*1000);
            const deletedLogs=await LoginEvent.deleteMany({createdAt:{$lt:thirtyDaysAgo}});
            console.log(`[CRON] Cleaned up ${deletedLogs.deletedCount} old login events.`);


            // 2. Detect failed login attempts(INVALID_2FA/INVALID_PASSWORD)
            const suspicious2FA=await LoginEvent.aggregate([
                { $match: {  reason:{ $in: ["INVALID_2FA", "INVALID_PASSWORD"]}, success:false, createdAt: { $gte: yesterday } } },
                { $group: { _id: '$userId', failures: { $sum: 1 } } },
                { $match: { failures: { $gte: 5 } } }
            ]);

            if(suspicious2FA.length>0) {
                console.log(`[CRON] Found ${suspicious2FA.length} accounts with potential compromised passwords!`);
                for (const alert of suspicious2FA) {
                    const user=await User.findById(alert._id);
                    if (user) {
                        // Send Email
                        await alertEmail({
                            from: process.env.EMAIL_FROM,
                            to: user.email,
                            subject: "Security Alert: Account Temporarily Locked",
                            message: "We detected multiple failed 2FA attempts. Your password might be compromised. Please change it immediately."
                        }) 
                        
                        // 2. Lock the user for 24 Hours (86400 seconds) in REDIS and specify reason in DB.
                        await redis.set(`lock:account:${user.email}`,'locked',{EX: 86400});
                        user.reason='LOCKED';
                        await user.save();
                        console.log(`🔒 [CRON] Locked account in Redis: ${user.email}`);
                    }
                }
            }


            // 3. Ek hi IP se alag-alag accounts par failed passwords hona
            const suspiciousIPs=await LoginEvent.aggregate([
                { $match: { success: false, createdAt: { $gte: yesterday } } },
                { $group: { _id: '$ipAddress', uniqueAccountsTargeted: { $addToSet: '$userId' } } },
                { $project: { ipAddress: '$_id', targetCount: { $size: '$uniqueAccountsTargeted' } } },
                { $match: { targetCount: { $gte: 10 } } } 
            ]);

            if (suspiciousIPs.length > 0) {
                console.log(`🚨 [CRON] Detected ${suspiciousIPs.length} malicious IPs performing credential stuffing.`);
                for (const ip of suspiciousIPs) {
                    await redis.set(`lock:ip:${ip.ipAddress}`, 'locked', { EX: 86400 });
                    console.log(`[BLACKLIST] Blocked IP in Redis: ${ip.ipAddress}`);
                }
            }

            console.log('[CRON] Daily Security Scan Completed.');

        }
        catch(error) {
            console.error('[CRON] Error running security scan:', error);
        }
    });
};
