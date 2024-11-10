import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import BasicInfoCard from './setup/BasicInfoCard';
import ScheduleCard from './setup/ScheduleCard';
import SocialMediaCard from './setup/SocialMediaCard';
import '../styles/ProfileSetup.css';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track completion status for each section
  const [progress, setProgress] = useState({
    basicInfo: false,
    schedule: false,
    socialMedia: false
  });

  // Data for each section
  const [profileData, setProfileData] = useState({
    // Basic Info
    firstName: '',
    age: '',
    gender: '',
    interestedIn: '',
    profilePhoto: '',
    
    // Schedule
    schedule: {
      monday: { available: false, timeSlots: [] },
      tuesday: { available: false, timeSlots: [] },
      wednesday: { available: false, timeSlots: [] },
      thursday: { available: false, timeSlots: [] },
      friday: { available: false, timeSlots: [] },
      saturday: { available: false, timeSlots: [] },
      sunday: { available: false, timeSlots: [] }
    },
    
    // Social Media
    socialMedia: []
  });

  const timeSlots = [
    { id: 1, label: 'Morning', time: '8:00 AM - 11:00 AM' },
    { id: 2, label: 'Lunch', time: '11:00 AM - 2:00 PM' },
    { id: 3, label: 'Afternoon', time: '2:00 PM - 5:00 PM' },
    { id: 4, label: 'Evening', time: '5:00 PM - 8:00 PM' },
    { id: 5, label: 'Night', time: '8:00 PM - 11:00 PM' }
  ];

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().setupComplete) {
          navigate('/dashboard');
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking profile status:', error);
        setError('Error loading profile. Please try again.');
      }
    };

    checkProfileStatus();
  }, [currentUser, navigate]);

  const handleNext = async () => {
    try {
      // Save current section's data
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...profileData,
        lastUpdated: new Date().toISOString()
      });

      if (currentStep === 3) {
        // All steps complete
        await updateDoc(userRef, {
          setupComplete: true
        });
        navigate('/dashboard');
      } else {
        setCurrentStep(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Error saving data. Please try again.');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const updateProfileData = (section, data) => {
    setProfileData(prev => ({
      ...prev,
      [section]: data
    }));
    
    setProgress(prev => ({
      ...prev,
      [section]: true
    }));
  };

  if (loading) {
    return <div className="setup-loading">Loading...</div>;
  }

  return (
    <div className="setup-container">
      {error && (
        <div className="setup-error" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      <div className="setup-progress">
        <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${progress.basicInfo ? 'completed' : ''}`}>
          Basic Info
        </div>
        <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${progress.schedule ? 'completed' : ''}`}>
          Schedule
        </div>
        <div className={`progress-step ${currentStep >= 3 ? 'active' : ''} ${progress.socialMedia ? 'completed' : ''}`}>
          Social Media
        </div>
        <div className={`progress-step ${Object.values(progress).every(Boolean) ? 'completed' : ''}`}>
          Ready!
        </div>
      </div>

      <div className="setup-card">
        {currentStep === 1 && (
          <BasicInfoCard
            data={profileData}
            onUpdate={(data) => updateProfileData('basicInfo', data)}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <ScheduleCard
            data={profileData.schedule}
            timeSlots={timeSlots}
            onUpdate={(data) => updateProfileData('schedule', data)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <SocialMediaCard
            data={profileData.socialMedia}
            onUpdate={(data) => updateProfileData('socialMedia', data)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileSetup;
