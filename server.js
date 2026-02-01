import express from 'express'
import cors from 'cors'
import { connectToMongo } from './database/mongodb.js';
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import resetRoutes from './routes/resetRoutes.js'
import "dotenv/config";
import { requireAuth } from './middlewares/auth.js';

const app = express();
const port = process.env.PORT || 4000;

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

app.use(cors())
app.use(express.json());
await connectToMongo();


app.get('/', async(req, res) => {
  res.send('Hello World!')
})

app.use('/api/auth',authRoutes);
app.use('/api/auth/user', requireAuth ,userRoutes);
app.use('/api/auth/password', resetRoutes);


app.listen(port, () => {
  console.log(`App running at port ${port}`)
})
