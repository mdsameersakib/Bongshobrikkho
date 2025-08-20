// frontend/src/hooks/useCloudinaryUpload.js
import { useState } from 'react';
import axios from 'axios';

// This is the correct, client-side only approach without Firebase Functions.
const useCloudinaryUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const upload = async (file) => {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    // **IMPORTANT**: You must create an upload preset with this exact name in your Cloudinary settings.
    formData.append('upload_preset', 'bongshobrikkho_uploads'); 

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/dubgfhavq/auto/upload`, // Your Cloud Name
        formData
      );

      setUploading(false);
      return response.data.secure_url; // Returns the URL of the uploaded image
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      setError("Image upload failed. Please try again.");
      setUploading(false);
      return null;
    }
  };

  return { upload, uploading, error };
};

export default useCloudinaryUpload;