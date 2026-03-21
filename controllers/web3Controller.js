import { pinata } from "../config/pinata.js";
import Web3Event from "../models/Web3Event.js";

export const fetchFileInfo = async(req,res)=>{
    try{
        const userId=req.user.id;
        const data=await Web3Event.findOne({userId});
        if(!data) 
            return res.status(204).json({error:'No file information found.'});
        
        const metaDatas=data.fileData.map((item)=>{
            return {
                type:item.type,
                size:item.size,
                name:item.name,
                fileDBId:item._id,
                authTag:item.authTag,
                iv:item.iv,
                uploadedAt:item.uploadedAt
            }}
        );
        // console.log("MetaDatas:",metaDatas);
        return res.status(200).json({metaDatas});
    }
    catch(err)
    {
        console.error(err);
        return res.status(500).json({ error: err?.message || "Failed to fetch file information."});
    }
}

export const uploadToIPFS = async(req,res)=>{
    try{
        const file = req.file;
        const { iv, authTag } = req.body;

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
            authTag: authTag,
            iv: iv
        };

        const web3event= await Web3Event.findOneAndUpdate(
            {userId: req.user.id}, // find
            { $push:{fileData: fileMetadata}}, //update
            { new:true, upsert:true} //upsert
        );
        const newFile=web3event.fileData[web3event.fileData.length-1];
        console.log("Web3Event created:",newFile);

        res.set('IPFS-CID',response.cid);

        console.log("Pinata Response:",response);
    
        return res.status(200).json({uploadedFile:{...fileMetadata,fileDBId:newFile._id},message:"Uploaded to IPFS successfully!"});
    }
    catch(err)
    {
        console.error(err);
        return res.status(500).json({ error: err?.message || "Upload to IPFS failed."});
    }
}

export const deleteFile =async(req,res)=>{
    try{
        const {name,size,type,fileDBId}=req.body;

        const data=await Web3Event.updateOne(
            {userId:req.user.id},
            {$pull:{
                fileData: {
                    name: name,
                    size: size,
                    type: type,
                    _id: fileDBId
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

export const getFromIPFS=async(req,res)=>{
    try{
        console.log("--- REACHED CONTROLLER ---"); 

        const {cid}=req.body;
        if(!cid) return res.status(500).json({message:'Cid hash is mandatory.'});

        const file=await pinata.gateways.public.get(cid);
        
        console.log("File fetched from IPFS:",file);

        const blob=file.data;
        const arrayBuffer=await blob.arrayBuffer();
        const buffer=Buffer.from(arrayBuffer);

        res.setHeader('Content-Type', blob.type || 'application/octet-stream');
        res.setHeader('Content-Length', buffer.length);

        return res.status(200).send(buffer);
    }
    catch(err){
        console.log("Error in getting file from ipfs:",err);
        return res.status(500).json({error:err?.message || 'Get file from IPFS failed.'});
    }
}
