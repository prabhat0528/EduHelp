require("dotenv").config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
      let resource_type = 'auto';
      if (file.mimetype.startsWith("video/")) {
          resource_type = 'video';
      } else if (file.mimetype.startsWith("image/")) {
          resource_type = 'image';
      }

      return {
          folder: 'eduhelp_resource',
          resource_type: resource_type,
          allowedFormats: ["mp4", "avi", "mov", "wmv", "jpg", "jpeg", "png"],
      };
  },
});


  module.exports={cloudinary,storage};
   