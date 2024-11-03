import React, { useEffect, useState, useCallback } from 'react';
import { auth, db, storage } from '../firebase/config';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Coffee, Calendar, User, MapPin, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PhotoCarousel from '../components/PhotoCarousel';
import DateDetails from './setup/DateDetails';
import defaultProfilePhoto from '../assets/defaultProfilePhoto.jpg';
import '../styles/App.css';
import ErrorBoundary from '../components/ErrorBoundary';

const Dashboard = () => {
  const { setupComplete, currentUser } = useAuth();
  const navigate = useNavigate();
  
  // View and UI States
  const [activeView, setActiveView] = useState('discover');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // User and Profile States
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({
    firstName: 'User',
    phoneNumber: '',
    age: '25',
    photos: [],
    schedule: '',
    profilePhoto: '',
    gender: '',
    interestedIn: '',
    bio: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  
  // Discovery and Interaction States
  const [profiles, setProfiles] = useState([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [confirmModal, setConfirmModal] = useState({ 
    visible: false, 
    userId: null, 
    index: null 
  });
  
  // Date Details State
  const [dateDetails, setDateDetails] = useState(null);

  // Generate random distance for demo purposes
  const getRandomDistance = () => Math.floor(Math.random() * 11 + 1);

  // Check setup completion on mount
  useEffect(() => {
    if (setupComplete === false) {
      navigate('/setup');
    }
  }, [setupComplete, navigate]);

  // Fetch potential matches
  const fetchProfiles = useCallback(async () => {
    try {
      const profilesRef = collection(db, 'users');
      const profilesQuery = query(
        profilesRef, 
        where('setupComplete', '==', true),
        limit(10)
      );
      const snapshot = await getDocs(profilesQuery);
      
      const profileList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          distance: getRandomDistance()
        }))
        .filter(profile => profile.id !== currentUser?.uid);

      setProfiles(profileList);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setError('Failed to load profiles. Please refresh.');
    }
  }, [currentUser]);

  // Fetch user data
  
  const fetchUserData = useCallback(async () => {
    // Only proceed if currentUser is defined
    if (!currentUser) return;
  
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
  
      if (!userDoc.exists()) {
        // Redirect if user profile is not found in Firestore
        console.warn('User profile not found, redirecting to login...');
        navigate('/login');
        return;
      }
  
      // Extract user data from document
      const userData = userDoc.data();
  
      // Set user state and profile data
      setUser({ id: currentUser.uid, ...userData });
      setProfileData({
        firstName: userData.firstName || 'User',
        phoneNumber: userData.phoneNumber,
        age: userData.age || '25',
        schedule: userData.schedule || '',
        profilePhoto: userData.profilePhoto || defaultProfilePhoto,
        photos: userData.photos || [userData.profilePhoto || defaultProfilePhoto],
        gender: userData.gender || '',
        interestedIn: userData.interestedIn || '',
        bio: userData.bio || ''
      });
  
      // Fetch date details if available
      const dateDocRef = doc(db, 'dates', currentUser.uid);
      const dateDoc = await getDoc(dateDocRef);
      if (dateDoc.exists()) {
        setDateDetails(dateDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data.');
    } finally {
      // Loading is complete regardless of success or failure
      setLoading(false);
    }
  }, [currentUser, navigate]);

  // Auth state observer
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && currentUser) {
        fetchUserData();
        fetchProfiles();
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate, fetchUserData, fetchProfiles, currentUser]);

  // Profile Update Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/') && file.size <= 5000000) {
      setPhotoFile(file);
      setError(null);
    } else {
      setError('Please select a valid image file under 5MB.');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUpdateSuccess(false);

    try {
      if (!user?.id) throw new Error('User not authenticated');

      const updates = {
        ...profileData,
        lastUpdated: serverTimestamp()
      };

      if (photoFile) {
        const photoRef = ref(storage, `profilePhotos/${user.id}`);
        await uploadBytes(photoRef, photoFile);
        const photoURL = await getDownloadURL(photoRef);
        
        updates.profilePhoto = photoURL;
        updates.photos = [photoURL, ...(profileData.photos || []).slice(0, 2)];
      }

      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, updates);

      setProfileData(prev => ({ ...prev, ...updates }));
      setUpdateSuccess(true);
      setFeedbackMessage('Profile updated successfully!');
      setPhotoFile(null);

      await fetchUserData();
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setFeedbackMessage('');
        setUpdateSuccess(false);
      }, 3000);
    }
  };

  // Coffee Interaction Handlers
  const handleConfirmCoffee = async () => {
    const { userId, index } = confirmModal;
    closeConfirmModal();

    try {
      if (!user?.phoneNumber) throw new Error('User not authenticated');

      const targetUserDoc = await getDoc(doc(db, 'users', userId));
      
      if (!targetUserDoc.exists()) {
        setError('User not found');
        return;
      }

      const targetUserData = targetUserDoc.data();
      const coffeeAdded = targetUserData.coffeeAdded || [];

      if (coffeeAdded.includes(user.phoneNumber)) {
        setFeedbackMessage('You have already sent coffee to this user.');
        return;
      }

      // Update target user's coffee list
      await updateDoc(doc(db, 'users', userId), {
        coffeeAdded: [...coffeeAdded, user.phoneNumber]
      });

      // Record interaction
      await addDoc(collection(db, 'coffeeInteractions'), {
        sender: user.phoneNumber,
        receiver: targetUserData.phoneNumber,
        timestamp: serverTimestamp()
      });

      setFeedbackMessage('Coffee sent successfully!');
      
      // Move to next profile
      setTimeout(() => setCurrentProfileIndex(prev => prev + 1), 1500);
    } catch (error) {
      console.error('Error sending coffee:', error);
      setError('Failed to send coffee. Please try again.');
    } finally {
      setTimeout(() => setFeedbackMessage(''), 3000);
    }
  };

  const openConfirmModal = (userId, index) => {
    setConfirmModal({ visible: true, userId, index });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ visible: false, userId: null, index: null });
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to log out. Please try again.');
    }
  };

  // View Rendering Functions
  const renderDiscoveryView = () => {
    if (profiles.length === 0) {
      return <div className="no-profiles">No more profiles to show</div>;
    }

    const currentProfile = profiles[currentProfileIndex];
    if (!currentProfile) {
      return <div className="no-profiles">That's all for now!</div>;
    }

    return (
      <div className="discovery-container">
        <div className="profile-card">
          <PhotoCarousel 
            photos={currentProfile.photos || [currentProfile.profilePhoto || defaultProfilePhoto]} 
            altText={`${currentProfile.firstName}'s profile`}
          />
          
          <div className="profile-info-overlay">
            <div className="profile-name-age">
              {currentProfile.firstName}, {currentProfile.age}
            </div>
            <div className="profile-distance">
              <MapPin className="w-4 h-4" />
              <span>{currentProfile.distance} miles away</span>
            </div>
          </div>

          <div className="profile-bio">
            <p>{currentProfile.bio || "No bio available"}</p>
          </div>

          <div className="profile-actions">
            <button 
              onClick={() => setCurrentProfileIndex(prev => prev + 1)}
              className="action-button pass-button"
            >
              <X className="w-5 h-5" />
              <span>Pass</span>
            </button>
            <button 
              onClick={() => openConfirmModal(currentProfile.id, currentProfileIndex)}
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

  const renderProfileView = () => (
    <div className="profile-view">
      <PhotoCarousel 
        photos={profileData.photos} 
        altText="Your profile"
      />
      <div className="profile-info">
        <h2>{profileData.firstName}</h2>
        <p>Age: {profileData.age}</p>
        <p>Gender: {profileData.gender}</p>
        <p>Interested In: {profileData.interestedIn}</p>
        
        <form onSubmit={handleProfileUpdate} className="profile-form">
          <div className="form-group">
            <label>Add Photos</label>
            <input 
              type="file" 
              onChange={handleFileChange} 
              accept="image/*"
            />
            <small>Maximum file size: 5MB</small>
          </div>
          
          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={profileData.bio}
              onChange={handleInputChange}
              placeholder="Tell others about yourself..."
              maxLength={500}
            />
          </div>
          
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );

  // Main Render
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* App Header */}
      <div className="app-header">
        <h1 className="app-title">onion.coffee</h1>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="error-message" onClick={() => setError(null)}>
          {error}
        </div>
      )}
      
      {(updateSuccess || feedbackMessage) && (
        <div className="feedback-message">
          {feedbackMessage}
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {activeView === 'discover' && renderDiscoveryView()}
        {activeView === 'dates' && <DateDetails dateDetails={dateDetails} />}
        {activeView === 'profile' && renderProfileView()}
      </div>

      {/* Coffee Confirmation Modal */}
      {confirmModal.visible && (
        <div className="confirm-modal">
          <div className="confirm-content">
            <h3>Send coffee to this person?</h3>
            <div className="confirm-buttons">
              <button onClick={handleConfirmCoffee} className="btn btn-primary">
                Yes, Send Coffee ☕
              </button>
              <button onClick={closeConfirmModal} className="btn btn-secondary">
                No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="bottom-navigation">
        <button 
          onClick={() => setActiveView('discover')} 
          className={`nav-item ${activeView === 'discover' ? 'active' : ''}`}
        >
          <Coffee className="nav-icon" />
          <span>Discover</span>
        </button>
        <button 
          onClick={() => setActiveView('dates')} 
          className={`nav-item ${activeView === 'dates' ? 'active' : ''}`}
        >
          <Calendar className="nav-icon" />
          <span>Dates</span>
        </button>
        <button 
          onClick={() => setActiveView('profile')} 
          className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
        >
          <User className="nav-icon" />
          <span>Profile</span>
        </button>
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout} 
        className="logout-button"
        aria-label="Logout"
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;