import sharp from "sharp";

export const processedBuffer = async(fileExt,buffer)=>{
    const processed=await sharp(buffer)
      .resize({
        width: 500,  
        height: 500, 
        fit: 'cover' 
      })
      .toFormat(fileExt, { quality: 80 }) 
      .toBuffer();

      return processed;
}