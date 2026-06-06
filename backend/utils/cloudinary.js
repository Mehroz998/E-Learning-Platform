import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

export const cloudinaryConfig = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  console.log(cloudinary.config());
};

// Helper function: Jo buffer ko stream bana kar cloudinary par bhejega
const uploadFromBuffer = (fileBuffer, folderName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        use_filename: true,
        unique_filename: false,
        overwrite: true,
      },
      (error, result) => {
        if (result) {
          resolve(result.secure_url);
        } else {
          reject(error);
        }
      }
    );
    stream.end(fileBuffer);
  });
};

export const uploadProfile = async (fileBuffer) => {
  try {
    return await uploadFromBuffer(fileBuffer, "profile");
  } catch (error) {
    console.error("Profile Upload Error:", error);
    throw error;
  }
};

export const uploadThumbnail = async (fileBuffer) => {
  try {
    return await uploadFromBuffer(fileBuffer, "thumbnail");
  } catch (error) {
    console.error("Thumbnail Upload Error:", error);
    throw error;
  }
};

//Upload images
// export const uploadProfile = async (imagePath) => {
//   // Use the uploaded file's name as the asset's public ID and
//   // allow overwriting the asset with new versions
//   const options = {
//     use_filename: true,
//     unique_filename: false,
//     overwrite: true,
//     folder: "profile",
//   };

//   try {
//     // Upload the image
//     const result = await cloudinary.uploader.upload(imagePath, options);
//     console.log(result);
//     return result.url;
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// };

// //Upload images
// export const uploadThumbnail = async (imagePath) => {
//   // Use the uploaded file's name as the asset's public ID and
//   // allow overwriting the asset with new versions
//   const options = {
//     use_filename: true,
//     unique_filename: false,
//     overwrite: true,
//     folder: "thumbnail",
//   };

//   try {
//     // Upload the image
//     const result = await cloudinary.uploader.upload(imagePath, options);
//     console.log(result);
//     return result.url;
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// };
