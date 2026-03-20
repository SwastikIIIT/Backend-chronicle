import express from 'express'
import cors from 'cors'
import { connectToMongo, disconnectFromMongo } from './database/mongodb.js';
import authRoutes from './routes/authRoutes.js'
import oauthRoutes from './routes/oauthRoutes.js'
import userRoutes from './routes/userRoutes.js'
import resetRoutes from './routes/resetRoutes.js'
import web3Routes from './routes/web3Routes.js'
import "dotenv/config";
import { requireAuth } from "./middlewares/auth.js";
import { closeRedis, initRedis } from "./database/redis.js";
import { startSecurityCron } from './security-check.js';

const app = express();
const port = process.env.PORT || 4000;

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

app.use(cors())
app.use(express.json());
await connectToMongo();
await initRedis();
// Run silently in background.
startSecurityCron();


app.get('/', async(req, res) => {
  res.send('Hello World!')
})

app.use('/api/auth',authRoutes);
app.use('/api/auth/user', requireAuth ,userRoutes);
app.use('/api/auth/password', resetRoutes);
app.use('/api/web3', requireAuth ,web3Routes);
app.use('/api/oauth',oauthRoutes);

app.listen(port, () => {
  console.log(`App running at port ${port}`)
})

app.get('/health',(req,res)=>{
    console.log("Server is up and running");
    res.status(200).send('Server Awake');
})

app.get('/test',(req,res)=>{
  console.log('Req headers:',req.headers);
  // console.log("Request:",req);

  const cfIP=req.headers['cf-connecting-ip'];
  console.log("CfIp:",cfIP);
  if(cfIP) return cfIP;

  const farwardedFor=req.headers['x-forwarded-for'];
  console.log("X-Farwared-for:",farwardedFor);
  if(farwardedFor)
  {
    const ips=farwardedFor.split(',').map(ip=>ip.trim());
    return ips[0];
  }

  const realIp=req.headers['x-real-ip'];
  console.log("Real Ip:",realIp);
  if(realIp) return realIp;
  console.log("Req Ip:",req.ip);
  console.log("Req remote Ip:",req.connection.remoteAddress);
  return req.ip;

})

// Graceful shutdown
process.on("SIGINT", async () => {
  await closeRedis();
  await disconnectFromMongo();
  console.log("Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeRedis();
  await disconnectFromMongo();
  console.log("Shutting down gracefully...");
  process.exit(0);
});