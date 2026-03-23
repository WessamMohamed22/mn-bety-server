import { v2 as cloudinary } from "cloudinary"
import { env } from './env.js';

cloudinary.config( {
    cloud_name : env.CLOUDINARY.CLOUD_NAME || "CcCp79zaVtHdI55fo" ,
    api_key : env.CLOUDINARY.API_KEY|| 267846924461653 ,
    api_secret : env.CLOUDINARY.API_SECRET || "CcCp79zaVtHdI55fo" 
} )


export default cloudinary


