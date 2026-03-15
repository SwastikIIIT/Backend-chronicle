import mongoose from "mongoose";
import "dotenv/config";
let isConnect=false;

export const connectToMongo=async()=>{
    mongoose.set('strictQuery',true);

    if(isConnect===true)
    {
        console.log("Already Connected to MongoDB");
        return;
    }
    else{
        try
        {
            await mongoose.connect(process.env.MONGO_URI,{dbName:'TestDB'});
            console.log('Successfully connected to mongoDB');
            isConnect=true;
        }
        catch(error)
        {
             console.log("Mongo DB Connection Error",error);
             throw new Error(error.message || 'Failed to connect to MongoDB')
        }
    }
}

export const disconnectFromMongo = async () => {
    if (isConnect) {
        try {
            await mongoose.disconnect();
            isConnect = false;
            console.log('MongoDB connection closed.');
        } catch (error) {
            console.log("Error closing MongoDB connection", error);
        }
    }
}