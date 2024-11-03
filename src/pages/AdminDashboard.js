import React, { useEffect, useState, useCallback } from 'react';
import { auth, db, storage } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, deleteDoc, serverTimestamp, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Coffee, Calendar, User, MapPin, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PhotoCarousel from '../components/PhotoCarousel';
import DateDetails from './setup/DateDetails';
import '../styles/AdminDashboard.css';
import '../styles/App.css';
import ErrorBoundary from '../components/ErrorBoundary';

const AdminDashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Main View State
  const [mainView, setMainView] = useState('admin'); // 'admin' or 'user'
  const [activeView, setActiveView] = useState('discover'); // For user view navigation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Shared States
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
  const [dateDetails, setDateDetails] = useState(null);

  // User View States
  const [profiles, setProfiles] = useState([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [sameGroupUsers, setSameGroupUsers] = useState([]);
  const [coffeeEmojis, setCoffeeEmojis] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ 
    visible: false, 
    userId: null, 
    index: null 
  });

  // Admin View States
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupUsers, setGroupUsers] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [coffeeInteractions, setCoffeeInteractions] = useState([]);
  const [mutualMatches, setMutualMatches] = useState([]);

  const defaultProfilePhoto = 'https://firebasestorage.googleapis.com/v0/b/onioncoffee-c5fb9.appspot.com/o/default%2Fdefault-avatar.png?alt=media';

  // Generate random distance for demo purposes
  const getRandomDistance = () => Math.floor(Math.random() * 11 + 1);

  // Admin Status Check
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
  }, [isAdmin, navigate]);

  // Fetch potential matches for user view
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
  }, [currentUser, fetchCoffeeInteractions]); // Add `fetchCoffeeInteractions` to dependencies  

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    if (!currentUser) return;
  
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) throw new Error('User profile not found');
  
      const userData = userDoc.data();
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
  
      // Fetch date details
      const dateDocRef = doc(db, 'dates', currentUser.uid);
      const dateDoc = await getDoc(dateDocRef);
      if (dateDoc.exists()) {
        setDateDetails(dateDoc.data());
      }
  
      // Conditionally fetch admin data based on mainView state
      if (mainView === 'admin') {
        await Promise.all([fetchAllUsers(), fetchGroups(), fetchCoffeeInteractions()]);
      } else if (mainView === 'user') {
        await fetchProfiles();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, navigate, mainView, fetchProfiles]);

  useEffect(() => {
    if (currentUser) fetchUserData();
  }, [currentUser, fetchUserData]);

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
      if (!currentUser?.uid) {
        throw new Error('User not authenticated');
      }

      const updates = {
        ...profileData,
        lastUpdated: serverTimestamp(),
        isAdmin: true // Preserve admin status
      };
      
      if (photoFile) {
        const photoRef = ref(storage, `profilePhotos/${currentUser.uid}`);
        await uploadBytes(photoRef, photoFile);
        const photoURL = await getDownloadURL(photoRef);
        
        updates.profilePhoto = photoURL;
        updates.photos = [photoURL, ...(profileData.photos || []).slice(0, 2)];
      }

      const userRef = doc(db, 'users', currentUser.uid);
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
        setUpdateSuccess(false);
        setFeedbackMessage('');
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

      // Update coffee emojis if in group view
      if (coffeeEmojis.length > 0) {
        const updatedCoffeeEmojis = [...coffeeEmojis];
        updatedCoffeeEmojis[index] = true;
        setCoffeeEmojis(updatedCoffeeEmojis);
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
      
      // If in discovery view, move to next profile
      if (activeView === 'discover') {
        setTimeout(() => setCurrentProfileIndex(prev => prev + 1), 1500);
      }
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

  // Admin Functions
  const fetchCoffeeInteractions = useCallback(async () => {
    try {
      const interactionsSnapshot = await getDocs(collection(db, 'coffeeInteractions'));
      const interactionsList = interactionsSnapshot.docs.map((doc) => doc.data());
      setCoffeeInteractions(interactionsList);

      const mutualMatchesList = findMutualMatches(interactionsList);
      setMutualMatches(mutualMatchesList);
    } catch (error) {
      console.error('Error fetching coffee interactions:', error);
      setError('Failed to load coffee interactions');
    }
  }, []);

  const fetchGroups = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'groups'));
      const groupList = querySnapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setGroups(groupList);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Failed to load groups');
    }
  };

  const fetchAllUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setAllUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    }
  };

  const findMutualMatches = (interactions) => {
    const matches = [];
    const sentByUser = {};

    interactions.forEach((interaction) => {
      const { sender, receiver } = interaction;
      if (!sentByUser[sender]) {
        sentByUser[sender] = [];
      }
      sentByUser[sender].push(receiver);
    });

    for (let sender in sentByUser) {
      sentByUser[sender].forEach((receiver) => {
        if (sentByUser[receiver] && sentByUser[receiver].includes(sender)) {
          matches.push({ user1: sender, user2: receiver });
        }
      });
    }

    return matches;
  };

  // Group Management Functions
  const createGroup = async () => {
    if (!groupName) return;
    try {
      setError(null);
      const groupRef = await addDoc(collection(db, 'groups'), { 
        name: groupName,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp()
      });
      setGroups([...groups, { id: groupRef.id, name: groupName }]);
      setGroupName('');
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Failed to create group');
    }
  };

  const handleGroupSelect = async (groupId) => {
    if (!groupId) return;
    setSelectedGroupId(groupId);
    try {
      const q = query(
        collection(db, 'users'), 
        where('groupIds', 'array-contains', groupId)
      );
      const querySnapshot = await getDocs(q);
      const usersInGroup = querySnapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setGroupUsers(usersInGroup);
    } catch (error) {
      console.error('Error fetching users in group:', error);
      setError('Failed to load group users');
    }
  };

  const addUserToGroup = async (userId, groupId) => {
    if (!userId || !groupId) return;
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.groupIds?.includes(groupId)) {
          setError('User is already in this group');
          return;
        }
        const updatedGroupIds = userData.groupIds ? 
          [...userData.groupIds, groupId] : [groupId];
        
        await updateDoc(userDocRef, { 
          groupIds: updatedGroupIds,
          lastUpdated: serverTimestamp()
        });
        
        await fetchAllUsers();
        await handleGroupSelect(selectedGroupId);
        setError(null);
      }
    } catch (error) {
      console.error('Error adding user to group:', error);
      setError('Failed to add user to group');
    }
  };

  const removeUserFromGroup = async (userId, groupId) => {
    if (!userId || !groupId) return;
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedGroupIds = userData.groupIds.filter(id => id !== groupId);
        await updateDoc(userDocRef, { 
          groupIds: updatedGroupIds,
          lastUpdated: serverTimestamp()
        });
        await fetchAllUsers();
        await handleGroupSelect(selectedGroupId);
        setError(null);
      }
    } catch (error) {
      console.error('Error removing user from group:', error);
      setError('Failed to remove user from group');
    }
  };

  const deleteGroup = async (groupId) => {
    if (!groupId) return;
    try {
      await deleteDoc(doc(db, 'groups', groupId));
      setGroups(groups.filter((group) => group.id !== groupId));
      setSelectedGroupId('');
      setGroupUsers([]);
      setError(null);
    } catch (error) {
      console.error('Error deleting group:', error);
      setError('Failed to delete group');
    }
  };

  const addNewUser = async () => {
    if (!newUserName || !newUserPhone) {
      setError('Please provide both name and phone number');
      return;
    }
    
    try {
      const formattedPhone = newUserPhone.startsWith('+') ? 
        newUserPhone : `+1${newUserPhone}`;
      
      const userRef = await addDoc(collection(db, 'users'), {
        firstName: newUserName,
        phoneNumber: formattedPhone,
        groupIds: [],
        coffeeAdded: [],
        photos: [defaultProfilePhoto],
        profilePhoto: defaultProfilePhoto,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      
      setAllUsers([...allUsers, { 
        id: userRef.id, 
        firstName: newUserName, 
        phoneNumber: formattedPhone 
      }]);
      
      setNewUserName('');
      setNewUserPhone('');
      setError(null);
      setFeedbackMessage('User added successfully');
      setTimeout(() => setFeedbackMessage(''), 3000);
    } catch (error) {
      console.error('Error adding user:', error);
      setError('Failed to add new user');
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to log out');
    }
  };

  // Render User View Functions
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

  // Render Admin View
  const renderAdminDashboard = () => (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome, {profileData.firstName}</p>
      </div>

      <div className="admin-sections">
        {/* Group Management Section */}
        <section className="admin-section">
          <h2>Group Management</h2>
          <div className="group-management">
            <div className="group-creation">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter new group name"
                className="admin-input"
              />
              <button 
                onClick={createGroup}
                disabled={!groupName}
                className="admin-button"
              >
                Create Group
              </button>
            </div>

            <div className="group-selection">
              <select 
                onChange={(e) => handleGroupSelect(e.target.value)}
                className="admin-select"
              >
                <option value="">Select a group</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedGroupId && (
              <div className="group-details">
                <h3>Group Members</h3>
                <div className="group-members">
                  {groupUsers.map(user => (
                    <div key={user.id} className="group-member">
                      <span>{user.firstName} - {user.phoneNumber}</span>
                      <button 
                        onClick={() => removeUserFromGroup(user.id, selectedGroupId)}
                        className="admin-button-danger"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    if (window.confirm('Delete this group?')) {
                      deleteGroup(selectedGroupId);
                    }
                  }}
                  className="admin-button-danger"
                >
                  Delete Group
                </button>
              </div>
            )}
          </div>
        </section>

        {/* User Management Section */}
        <section className="admin-section">
          <h2>User Management</h2>
          <div className="user-management">
            <div className="add-user">
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Name"
                className="admin-input"
              />
              <input
                type="text"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                placeholder="Phone (+1xxxxxxxxxx)"
                className="admin-input"
              />
              <button 
                onClick={addNewUser}
                disabled={!newUserName || !newUserPhone}
                className="admin-button"
              >
                Add User
              </button>
            </div>

            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Group</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.firstName}</td>
                      <td>{user.phoneNumber}</td>
                      <td>
                        <select
                          value={user.groupIds?.[0] || ''}
                          onChange={(e) => addUserToGroup(user.id, e.target.value)}
                          className="admin-select"
                        >
                          <option value="">Select Group</option>
                          {groups.map(group => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Analytics Section */}
        <section className="admin-section">
          <h2>Analytics</h2>
          <div className="analytics">
            <div className="coffee-interactions">
              <h3>Recent Coffee Interactions</h3>
              <table>
                <thead>
                  <tr>
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {coffeeInteractions.map((interaction, index) => (
                    <tr key={index}>
                      <td>{interaction.sender}</td>
                      <td>{interaction.receiver}</td>
                      <td>
                        {interaction.timestamp?.toDate().toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mutual-matches">
              <h3>Mutual Matches</h3>
              {mutualMatches.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>User 1</th>
                      <th>User 2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mutualMatches.map((match, index) => (
                      <tr key={index}>
                        <td>{match.user1}</td>
                        <td>{match.user2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No mutual matches found</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  // Render User Dashboard
  const renderUserDashboard = () => (
    <div className="dashboard-container">
      {/* Main Content */}
      <div className="main-content">
        {activeView === 'discover' && renderDiscoveryView()}
        {activeView === 'dates' && <DateDetails dateDetails={dateDetails} />}
        {activeView === 'profile' && renderProfileView()}
      </div>

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
    </div>
  );

  if (!isAdmin) {
    return <div className="access-denied">Access Denied</div>;
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="admin-container">
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
  
      {/* View Toggle */}
      <div className="view-toggle">
        <button
          onClick={() => setMainView('admin')}
          className={`toggle-btn ${mainView === 'admin' ? 'active' : ''}`}
        >
          Admin Dashboard
        </button>
        <button
          onClick={() => setMainView('user')}
          className={`toggle-btn ${mainView === 'user' ? 'active' : ''}`}
        >
          User Dashboard
        </button>
      </div>
  
      {/* Main Content */}
      
      {/* Main Content */}
<ErrorBoundary>
  {mainView === 'admin' ? renderAdminDashboard() : renderUserDashboard()}
</ErrorBoundary>

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

/* Logout Button */
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

export default AdminDashboard;