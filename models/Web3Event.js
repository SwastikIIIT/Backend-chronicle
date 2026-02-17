import mongoose from "mongoose";

const Web3EventSchema = new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required: true,
            index:true
        },
        fileData:[
            {
                _id:false,
                type:{type:String, required:true},
                size:{type:Number, required:true},
                name:{type:String,required:true},
                uploadedAt:{type:Date,default:Date.now()}
            },
        ]
    },
);


//used optional chaining operator for resolving undefined user model error
const Web3Event=mongoose.models?.Web3Event || mongoose.model('Web3Event',Web3EventSchema);
export default Web3Event;