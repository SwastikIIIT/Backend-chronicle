import { compare, hash } from "bcryptjs";
import User from "../models/User.js";
import { recordLoginEvent } from "../utils/recordHistory.js";
import { getIp } from "../utils/getIp.js";

export const login = async(req,res)=>{
    try{
        const { email, password, twoFactorToken } = req.body;
        const userAgent=req.headers['user-agent'];

        if(!email || !password)
            return res.status(400).json({message:'Missing Credentials'});

        const user=await User.findOne({email}).select("+password +twoFactor.secret");
        if(!user)
            return res.status(401).json({message:"User not signedup in the application"});

        const isMatch = await compare(password,user.password);
        const ipAddress=await getIp(req);
        
        // Password wrong
        if(!isMatch)
        {
           await recordLoginEvent({
            headers: req.headers,
            userId: user._id,
            success: false,
            provider: "credentials",
            reason: "INVALID_PASSWORD",
            ipAddress,
            userAgent,
          });

           return res.status(401).json({message:"Invalid password"});
        }

        // 2FA check
        if(user.twoFactor?.enabled)
        {
            if(!twoFactorToken)
                return res.status(403).json({message:'2FA_REQUIRED'});

            const verified=speakeasy.totp.verify({
                secret: user?.twoFactor?.secret,
                encoding: "base32",
                token: twoFactorToken,
                window:1
            });

            if(!verified)
            {
                await recordLoginEvent({
                    headers: req.headers,
                    userId: user._id,
                    success: false,
                    provider: "credentials",
                    reason: "INVALID_2FA",
                    ipAddress
                });
               return res.status(401).json({ message: "Invalid 2FA code" });
            }
        }

        // Successful login
        await recordLoginEvent({
            headers: req.headers,
            userId: user._id,
            success: true,
            provider: "credentials",
            ipAddress,
            reason:"LOGIN_SUCCESS",
            userAgent,
        });
        user.lastLogin=new Date();
        await user.save();
        

        return res.status(200).json({
            userId: user?._id.toString(),
            email: user?.email,
            name: user?.username,
            image:user?.image,
            passwordLastChanged:user?.passwordLastChanged,
            hasTwoFactor: user?.twoFactor?.enabled
        })
    }
    catch(err)
    {
        console.error("Authorisation error:", err);
        return res.status(500).json({message:err.message || "Authentication failed"});
    }
}

export const signupUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({message: "Missing credentials"});
    }

    // const strength = getPasswordStrength(password);

    // Enforce minimum policy
    // if (strength === "WEAK") {
    //   return res.status(400).json({message: "Password is too weak"});
    // }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({message: "User already exists"});
    }

    const hashedPassword = await hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      passwordLastChanged: new Date(),
    });

    return res.status(200).json({ user, message: "Account created successfully"});
  } 
  catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({message: err?.message || "Failed to create account"});
  }
};

// export const testHeaders=async(req,res)=>{
//      const response = await fetch('https://api.ipify.org?format=json');
//      const ipAddress= await response.json();

//      const userAgent=req.headers["user-agent"];

//      const parser=new UAParser(userAgent);
//      const result=parser.getResult();
//      console.log('User agent:',userAgent);
//      console.log('Result info:',result);
     
//      console.log('Ip1:',req.socket.remoteAddress);
//      console.log('Ip2:',req.headers["x-forwarded-for"]);
//      console.log('Ip3:',ipAddress);
//      console.log('Ip4:',req?.ip);

//      headerTest(req.headers,req);
// }