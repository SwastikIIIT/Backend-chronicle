import User from "../models/User.js";
import { pinata } from "../config/pinata.js";
import crypto from 'crypto';
import Web3Event from "../models/Web3Event.js";

export const fetchFileInfo = async(req,res)=>{
    try{
        const userId=req.user.id;
        const data=await Web3Event.findOne({userId});
        if(!data) 
            return res.status(204).json({error:'No file information found.'})
        return res.status(200).json({files:data.fileData});
    }
    catch(err)
    {
        console.error(err);
        return res.status(500).json({ error: err?.message || "Failed to fetch file information."});
    }
}

export const uploadToIPFS = async(req,res)=>{
    try
    {
        const file = req.file;
     
        if(!file)
            return res.status(404).json({ error: "No file provided."})

        const fileObject = new File(
            [req.file.buffer],
            req.file.originalname ,
            { type: req.file.mimetype}
        );
        const response = await pinata.upload.public.file(fileObject);
        const fileMetadata={
            type: req.file.mimetype,
            size: req.file.size,
            name: req.file.originalname,
        };
        const web3event= await Web3Event.findOneAndUpdate(
            {userId: req.user.id}, // find
            { $push:{fileData: fileMetadata}}, //update
            { new:true, upsert:true} //upsert
        );
        console.log("Web3Event created:", web3event);
        // const cidHash = crypto.createHash('sha256').update(response.cid).digest('hex');
       
        // await User.findByIdAndUpdate(req.user.id,{
        //      $push: { cidHashes: cidHash } , 
        // },{new: true}).select("+cidHashes");

        res.set('IPFS-CID', response.cid);

        console.log("Pinata Response:",response);
    
        return res.status(200).json({ uploadedFile:fileMetadata,message:"Uploaded to IPFS successfully!"});
    }
    catch(err)
    {
        console.error(err);
        return res.status(500).json({ error: err?.message || "Upload to IPFS failed."});
    }
}

export const deleteFile =async(req,res)=>{
    try{
        const {name,size,type,uploadedAt}=req.body;

        const data=await Web3Event.updateOne(
            {userId:req.user.id},
            {$pull:{
                fileData: {
                    name: name,
                    size: size,
                    type: type,
                    uploadedAt: new Date(uploadedAt)
                }
            }},
            {new:true}
        );
        console.log('Delete:',data);
        if(data.matchedCount==0)   return res.status(404).json({error:'User not found'})
        if(data.modifiedCount==0)   return res.status(404).json({error:'File not found'})
        return res.status(200).json({message:"File deleted successfully"});
    }
    catch(err)
    {
        console.error(err);
        return res.status(500).json({ error: err?.message || "Failed to delete file information."});
    }
}
