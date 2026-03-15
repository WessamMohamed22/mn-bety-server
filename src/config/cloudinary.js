import { v2 as cloudinary } from "cloudinary"
import { env } from './env.js';

cloudinary.config( {
    cloud_name : env.CLOUDINARY.CLOUD_NAME || "dykihgk5b" ,
    api_key : env.CLOUDINARY.API_KEY|| 346285657516188 ,
    api_secret : env.CLOUDINARY.API_SECRET || "zsQdXfZBweHf3mMckzFbUf8IJAk" 
} )


export default cloudinary


