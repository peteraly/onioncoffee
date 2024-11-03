import React from 'react';
import { MapPin, Coffee, X } from 'lucide-react';
import PhotoCarousel from '../components/PhotoCarousel';
import '../styles/ProfilePage.css';

const ProfilePage = ({ profile }) => {
  const { name, age, photos, distance, bio } = profile;
  
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
        <PhotoCarousel 
          photos={photos || []} 
          altText={`${name}'s profile`}
        />
        
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