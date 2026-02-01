
export const getIp=async(req)=>{
     const response = await fetch('https://api.ipify.org?format=json');
     const ipAddress=await response.json();
        
     const ip=ipAddress?.ip || req.ip || req.connection.remoteAddress || req.headers["x-forwarded-for"]
        || req.socket.remoteAddress;
     return ip;
}