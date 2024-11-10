// React and Routing
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Firebase
import { db, storage } from '../firebase/config';
import { getAuth } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc, 
  serverTimestamp, 
  limit 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Context and Components
import { useAuth } from '../contexts/AuthContext';
import PhotoCarousel from '../components/PhotoCarousel';
import DateDetails from './setup/DateDetails';
import ErrorBoundary from '../components/ErrorBoundary';

// Icons
import { Coffee, Calendar, User, MapPin, X } from 'lucide-react';

// Assets and Styles
import defaultProfilePhoto from '../assets/defaultProfilePhoto.jpg';
import '../styles/Dashboard.css';

// Constants
const VIEWS = {
  DISCOVER: 'discover',
  DATES: 'dates',
  PROFILE: 'profile'
};

// Core State Management Hook
const useDashboardState = () => {
  const { setupComplete, currentUser } = useAuth();
  const navigate = useNavigate();
  
  // View and UI States
  const [activeView, setActiveView] = useState(VIEWS.DISCOVER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

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
    userId: null 
  });

  // Date Details State
  const [dateDetails, setDateDetails] = useState(null);

  const state = useMemo(() => ({
    activeView,
    setActiveView,
    loading,
    setLoading,
    error,
    setError,
    feedbackMessage,
    setFeedbackMessage,
    updateSuccess,
    setUpdateSuccess,
    actionInProgress,
    setActionInProgress,
    user,
    setUser,
    profileData,
    setProfileData,
    photoFile,
    setPhotoFile,
    profiles,
    setProfiles,
    currentProfileIndex,
    setCurrentProfileIndex,
    confirmModal,
    setConfirmModal,
    dateDetails,
    setDateDetails
  }), [
    activeView, loading, error, feedbackMessage, updateSuccess,
    actionInProgress, user, profileData, photoFile, profiles,
    currentProfileIndex, confirmModal, dateDetails
  ]);

  return {
    auth: { setupComplete, currentUser, navigate },
    state
  };
};

// Data Management Functions
const DataManagement = {
  fetchUserData: async (user, setters, navigate) => {
    const { setUser, setProfileData, setDateDetails, setLoading, setError } = setters;

    if (!user?.uid) {
      navigate('/login');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        navigate('/setup');
        return;
      }

      const userData = userDoc.data();
      setUser({ id: user.uid, ...userData });
      setProfileData({
        firstName: userData.firstName || 'User',
        phoneNumber: userData.phoneNumber || '',
        age: userData.age || '25',
        schedule: userData.schedule || '',
        profilePhoto: userData.profilePhoto || defaultProfilePhoto,
        photos: userData.photos || [userData.profilePhoto || defaultProfilePhoto],
        gender: userData.gender || '',
        interestedIn: userData.interestedIn || '',
        bio: userData.bio || ''
      });

      const dateDocRef = doc(db, 'dates', user.uid);
      const dateDoc = await getDoc(dateDocRef);
      if (dateDoc.exists()) {
        setDateDetails(dateDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data.');
    } finally {
      setLoading(false);
    }
  },

  fetchProfiles: async (user, setters) => {
    const { setProfiles, setError, setLoading } = setters;
    setLoading(true);
    
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
          distance: Math.floor(Math.random() * 10) + 1
        }))
        .filter(profile => profile.id !== user?.uid);

      setProfiles(profileList);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setError('Failed to load profiles.');
    } finally {
      setLoading(false);
    }
  }
};

// View Components
const DiscoveryView = React.memo(({ profiles, currentIndex, handlers }) => {
  const currentProfile = profiles[currentIndex];
  
  if (!currentProfile) {
    return <div className="no-more-profiles">No more profiles to show</div>;
  }

  return (
    <div className="discovery-view">
      <div className="profile-card">
        <PhotoCarousel 
          photos={currentProfile.photos || []} 
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
            onClick={handlers.handleNextProfile}
            className="action-button pass-button"
          >
            <X className="w-5 h-5" />
            <span>Pass</span>
          </button>
          <button 
            onClick={() => handlers.handleCoffeeModal.open(currentProfile.id)}
            className="action-button peel-button"
          >
            <Coffee className="w-5 h-5" />
            <span>Send Coffee</span>
          </button>
        </div>
      </div>
    </div>
  );
});

const ProfileView = React.memo(({ profileData, loading, handlers }) => (
  <div className="profile-view">
    <div className="current-profile">
      <PhotoCarousel 
        photos={profileData.photos} 
        altText="Your profile photos"
      />
      <div className="profile-details">
        <h2>{profileData.firstName}</h2>
        <p>Age: {profileData.age}</p>
        <p>Gender: {profileData.gender || 'Not specified'}</p>
        <p>Interested In: {profileData.interestedIn || 'Not specified'}</p>
      </div>
    </div>
    
    <form onSubmit={handlers.handleProfileUpdate} className="profile-form">
      <div className="form-group">
        <label>Profile Photo</label>
        <input 
          type="file" 
          onChange={handlers.handleFileChange} 
          accept="image/*"
        />
        <small>Maximum file size: 5MB</small>
      </div>
      
      <div className="form-group">
        <label>Bio</label>
        <textarea
          name="bio"
          value={profileData.bio}
          onChange={handlers.handleInputChange}
          placeholder="Tell others about yourself..."
          maxLength={500}
        />
        <small>{(profileData.bio || '').length}/500 characters</small>
      </div>
      
      <button 
        type="submit" 
        className="update-button"
        disabled={loading}
      >
        {loading ? 'Updating...' : 'Update Profile'}
      </button>
    </form>
  </div>
));

// Main Dashboard Component
const Dashboard = () => {
  const { auth, state } = useDashboardState();
  const navigate = useNavigate();
  
  // Authentication and data fetching effect
  useEffect(() => {
    const authInstance = getAuth();
    let isMounted = true;

    const fetchData = async (user) => {
      if (!isMounted) return;

      try {
        state.setLoading(true);

        await Promise.all([
          DataManagement.fetchUserData(user, {
            setUser: state.setUser,
            setProfileData: state.setProfileData,
            setDateDetails: state.setDateDetails,
            setLoading: state.setLoading,
            setError: state.setError
          }, navigate),
          DataManagement.fetchProfiles(user, {
            setProfiles: state.setProfiles,
            setError: state.setError,
            setLoading: state.setLoading
          })
        ]);
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching initial data:', error);
          state.setError('Failed to load data');
        }
      } finally {
        if (isMounted) {
          state.setLoading(false);
        }
      }
    };

    const unsubscribe = authInstance.onAuthStateChanged((user) => {
      if (user) {
        if (!auth.setupComplete) {
          console.log('User setup incomplete, redirecting to setup-profile');
          navigate('/setup-profile');
        } else {
          fetchData(user);
        }
      } else {
        navigate('/login');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigate, state, auth.setupComplete]);

  // Event handler bindings with memoization
  const handlers = useMemo(() => ({
    handleInputChange: (e) => {
      const { name, value } = e.target;
      state.setProfileData(prev => ({ ...prev, [name]: value?.trim() }));
    },
    
    handleFileChange: (e) => {
      const file = e.target?.files?.[0];
      if (!file) {
        state.setError('Please select a file');
        return;
      }

      if (!file.type.startsWith('image/')) {
        state.setError('Please select an image file');
        return;
      }

      if (file.size > 5000000) {
        state.setError('File size must be under 5MB');
        return;
      }

      state.setPhotoFile(file);
      state.setError(null);
    },
    
    handleProfileUpdate: async (e) => {
      e.preventDefault();
      if (state.actionInProgress) return;

      try {
        state.setActionInProgress(true);
        const updates = {
          ...state.profileData,
          lastUpdated: serverTimestamp()
        };

        if (state.photoFile) {
          const photoRef = ref(storage, `profilePhotos/${state.user.id}`);
          await uploadBytes(photoRef, state.photoFile);
          const photoURL = await getDownloadURL(photoRef);
          
          updates.profilePhoto = photoURL;
          updates.photos = [photoURL, ...(state.profileData.photos || []).slice(0, 2)];
        }

        await updateDoc(doc(db, 'users', state.user.id), updates);
        state.setProfileData(prev => ({ ...prev, ...updates }));
        state.setUpdateSuccess(true);
        state.setFeedbackMessage('Profile updated successfully!');
        state.setPhotoFile(null);
      } catch (error) {
        console.error('Profile update error:', error);
        state.setError('Failed to update profile: ' + error.message);
      } finally {
        state.setActionInProgress(false);
      }
    },

    handleConfirmCoffee: async () => {
      if (!state.confirmModal.userId || state.actionInProgress) return;

      try {
        state.setActionInProgress(true);
        state.setConfirmModal({ visible: false, userId: null });

        const targetUserDoc = await getDoc(doc(db, 'users', state.confirmModal.userId));
        if (!targetUserDoc.exists()) {
          throw new Error('User not found');
        }

        const targetUserData = targetUserDoc.data();
        const coffeeAdded = targetUserData.coffeeAdded || [];

        if (coffeeAdded.includes(state.user.phoneNumber)) {
          state.setFeedbackMessage('You have already sent coffee to this user.');
          return;
        }

        await updateDoc(doc(db, 'users', state.confirmModal.userId), {
          coffeeAdded: [...coffeeAdded, state.user.phoneNumber],
          lastInteraction: serverTimestamp()
        });

        state.setFeedbackMessage('Coffee sent successfully!');
        setTimeout(() => {
          state.setCurrentProfileIndex(prev => prev + 1);
        }, 1500);
      } catch (error) {
        console.error('Error sending coffee:', error);
        state.setError('Failed to send coffee: ' + error.message);
      } finally {
        state.setActionInProgress(false);
      }
    },

    handleCoffeeModal: {
      open: (userId) => state.setConfirmModal({ visible: true, userId }),
      close: () => state.setConfirmModal({ visible: false, userId: null })
    },

    handleViewChange: (view) => state.setActiveView(view),
    handleNextProfile: () => state.setCurrentProfileIndex(prev => prev + 1)
  }), [state]);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="dashboard-container">
        <header className="app-header">
          <h1 className="app-title">onion.coffee</h1>
        </header>
        
        {state.error && (
          <div 
            className="error-message" 
            onClick={() => state.setError(null)}
            role="alert"
          >
            {state.error}
          </div>
        )}
        
        {(state.updateSuccess || state.feedbackMessage) && (
          <div className="feedback-message" role="status">
            {state.feedbackMessage}
          </div>
        )}

        <main className="main-content">
          {state.activeView === VIEWS.DISCOVER && (
            <DiscoveryView 
              profiles={state.profiles}
              currentIndex={state.currentProfileIndex}
              handlers={handlers}
            />
          )}

          {state.activeView === VIEWS.DATES && (
            <DateDetails dateDetails={state.dateDetails} />
          )}

          {state.activeView === VIEWS.PROFILE && (
            <ProfileView
              profileData={state.profileData}
              loading={state.loading}
              handlers={handlers}
            />
          )}
        </main>

        <nav className="bottom-navigation">
          {Object.entries(VIEWS).map(([key, value]) => (
            <button 
              key={key}
              onClick={() => handlers.handleViewChange(value)}
              className={`nav-item ${state.activeView === value ? 'active' : ''}`}
              aria-current={state.activeView === value ? 'page' : undefined}
            >
              {key === 'DISCOVER' && <Coffee className="nav-icon" />}
              {key === 'DATES' && <Calendar className="nav-icon" />}
              {key === 'PROFILE' && <User className="nav-icon" />}
              <span>{key.charAt(0) + key.slice(1).toLowerCase()}</span>
            </button>
          ))}
        </nav>

        {state.confirmModal.visible && (
          <div 
            className="confirm-modal"
            role="dialog"
            aria-labelledby="modal-title"
          >
            <div className="confirm-content">
              <h3 id="modal-title">Send coffee to this person?</h3>
              <div className="confirm-buttons">
                <button 
                  onClick={handlers.handleConfirmCoffee}
                  className="btn btn-primary"
                  disabled={state.actionInProgress}
                >
                  {state.actionInProgress ? 'Sending...' : 'Yes, Send Coffee ☕'}
                </button>
                <button 
                  onClick={handlers.handleCoffeeModal.close}
                  className="btn btn-secondary"
                  disabled={state.actionInProgress}
                >
                  No, Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
