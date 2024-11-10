import React, { useState } from 'react';
import { MapPin, Coffee, X } from 'lucide-react';
import PhotoCarousel from '../components/PhotoCarousel';
import { storage } from '../firebase/config'; // Importing storage from Firebase config
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase Storage utilities
import '../styles/ProfilePage.css';

const ProfilePage = ({ profile }) => {
  const { name, age, photos, distance, bio } = profile;
  const [file, setFile] = useState(null);  // File selected for upload
  const [loading, setLoading] = useState(false); // Loading state for upload
  const [uploadedPhotoURL, setUploadedPhotoURL] = useState(null); // URL of uploaded photo

  // Handle file input change (when a user selects a file to upload)
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // Handle photo upload to Firebase Storage
  const handleUpload = async () => {
    if (!file) {
      console.error('No file selected');
      return;
    }

    setLoading(true);

    try {
      const fileRef = ref(storage, `profilePhotos/${file.name}`); // Firebase reference
      await uploadBytes(fileRef, file); // Upload file to Firebase Storage

      // Get the download URL of the uploaded file
      const downloadURL = await getDownloadURL(fileRef);
      setUploadedPhotoURL(downloadURL); // Update the uploaded photo URL state
      console.log('File uploaded successfully:', downloadURL);
    } catch (error) {
      console.error('File upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeel = () => {
    // Implementation for sending coffee will go here
    console.log('Peel/Coffee action triggered');
  };

  const handlePass = () => {
    // Implementation for pass action will go here
    console.log('Pass action triggered');
  };

  return (
    <div className="profile-page-container">
      <div className="profile-card">
        {/* Photo Carousel or Profile Image */}
        <PhotoCarousel 
          photos={photos || []} 
          altText={`${name}'s profile`}
        />

        {/* Display uploaded profile photo if available */}
        {uploadedPhotoURL && (
          <div className="uploaded-photo-container">
            <img 
              src={uploadedPhotoURL} 
              alt="Uploaded Profile"
              className="uploaded-photo"
            />
          </div>
        )}

        {/* File Upload Section */}
        <div className="file-upload-section">
          <input 
            type="file" 
            onChange={handleFileChange} 
            disabled={loading} 
            className="file-upload-input"
          />
          <button 
            onClick={handleUpload} 
            disabled={loading} 
            className="upload-button"
          >
            {loading ? 'Uploading...' : 'Upload New Photo'}
          </button>
        </div>

        {/* User Info Overlay */}
        <div className="profile-info-overlay">
          <div className="profile-name-age">{name}, {age}</div>
          <div className="profile-distance">
            <MapPin className="w-4 h-4" />
            <span>{distance} miles away</span>
          </div>
        </div>

        {/* Bio Section */}
        <div className="profile-bio">
          <p>{bio}</p>
        </div>

        {/* Action Buttons */}
        <div className="profile-actions">
          <button 
            onClick={handlePass}
            className="action-button pass-button"
          >
            <X className="w-5 h-5" />
            <span>Pass</span>
          </button>
          <button 
            onClick={handlePeel}
            className="action-button peel-button"
          >
            <Coffee className="w-5 h-5" />
            <span>Peel</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
