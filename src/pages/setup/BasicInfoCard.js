import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

const BasicInfoCard = ({ data, onUpdate, onNext }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [formData, setFormData] = useState({
    firstName: data.firstName || '',
    age: data.age || '',
    gender: data.gender || '',
    interestedIn: data.interestedIn || '',
    profilePhoto: data.profilePhoto || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size <= 5000000) { // 5MB limit
          setPhotoFile(file);
          setError(null);
        } else {
          setError('Image file is too large. Please choose an image under 5MB.');
        }
      } else {
        setError('Please select a valid image file.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let photoURL = formData.profilePhoto;

      if (photoFile) {
        const photoRef = ref(storage, `profilePhotos/${currentUser.uid}`);
        await uploadBytes(photoRef, photoFile);
        photoURL = await getDownloadURL(photoRef);
      }

      const updatedData = {
        ...formData,
        profilePhoto: photoURL
      };

      onUpdate(updatedData);
      onNext();
    } catch (error) {
      console.error('Error saving basic info:', error);
      setError('Failed to save information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-card-content">
      <h2>Basic Information</h2>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="Enter your first name"
            required
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label>Age</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            placeholder="Enter your age"
            required
            min="18"
            max="100"
          />
        </div>

        <div className="form-group">
          <label>Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Interested In</label>
          <select
            name="interestedIn"
            value={formData.interestedIn}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Preference</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Both">Both</option>
          </select>
        </div>

        <div className="form-group">
          <label>Profile Photo</label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
          />
          <small>Maximum file size: 5MB</small>
          {formData.profilePhoto && (
            <img
              src={formData.profilePhoto}
              alt="Profile Preview"
              className="profile-preview"
            />
          )}
        </div>

        <div className="btn-container">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BasicInfoCard;