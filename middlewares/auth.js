import { jwtVerify } from "jose";
import cookie from "cookie";
import User from "../models/User.js";

export const requireAuth = async (req, res, next) => {
  try{ 
    console.log('Running userAuth middleware.');
    const cookieHeader=req.headers.cookie;
    if (!cookieHeader) 
      return res.status(401).json({ error: "No cookie for authentication detected." });
    
    const cookies = cookie.parse(cookieHeader);
    // console.log('Cookie:',cookies);
    const token = cookies["backend_token"];
    // console.log('Token:',token);  
    if (!token) 
      return res.status(401).json({ error: "Authentication token missing." });
    
    const secret = new TextEncoder().encode(process.env.BACKEND_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    const userId = payload.id;

    if (!userId) 
      return res.status(401).json({ error: "Invalid User Session" });
    
    const user = await User.findOne({ _id: userId }).select("_id");
    if (!user)
      return res.status(401).json({ error: "Unauthorized : User does not exist." });

    req.user = {
        id: userId
    };
    
    next();
  }
  catch(err) {
     console.error("Auth verification failed:", err);
    return res.status(500).json({ message: err.message ||  "Internal Auth Error"});
  }
};
