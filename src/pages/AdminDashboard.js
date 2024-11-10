// React and Routing
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Firebase
import { auth, db, storage } from '../firebase/config';
import { 
  doc, getDoc, collection, query, where, getDocs,
  updateDoc, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Context and Components
import { useAuth } from '../contexts/AuthContext';

// Icons 
import { X } from 'lucide-react';

// Chart Components
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// Utils
import { debounce } from 'lodash';

// Core State Management Hook
const useAdminDashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const initialProfileData = {
    firstName: 'User',
    phoneNumber: '',
    age: '25',
    photos: [],
    schedule: '',
    profilePhoto: '',
    gender: '',
    interestedIn: '',
    bio: ''
  };

  // Core States
  const [mainView, setMainView] = useState('admin');
  const [activeView, setActiveView] = useState('discover');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // User States
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(initialProfileData);
  const [photoFile, setPhotoFile] = useState(null);
  const [dateDetails, setDateDetails] = useState(null);

  // Admin States
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupUsers, setGroupUsers] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [coffeeInteractions, setCoffeeInteractions] = useState([]);
  const [mutualMatches, setMutualMatches] = useState([]);

  return {
    state: {
      mainView, setMainView,
      activeView, setActiveView,
      loading, setLoading,
      error, setError,
      feedbackMessage, setFeedbackMessage,
      updateSuccess, setUpdateSuccess,
      user, setUser,
      profileData, setProfileData,
      photoFile, setPhotoFile,
      dateDetails, setDateDetails,
      groups, setGroups,
      groupName, setGroupName,
      groupUsers, setGroupUsers,
      selectedGroupId, setSelectedGroupId,
      allUsers, setAllUsers,
      newUserName, setNewUserName,
      newUserPhone, setNewUserPhone,
      coffeeInteractions, setCoffeeInteractions,
      mutualMatches, setMutualMatches
    },
    auth: { currentUser, isAdmin, navigate },
  };
};

// Data Management Functions
const DataManagement = {
  defaultProfilePhoto: 'https://firebasestorage.googleapis.com/v0/b/onioncoffee-c5fb9.appspot.com/o/default%2Fdefault-avatar.png?alt=media',

  findMutualMatches: (interactions) => {
    const matches = new Set();
    const sentByUser = {};

    interactions.forEach(interaction => {
      const { sender, receiver } = interaction;
      if (!sentByUser[sender]) sentByUser[sender] = new Set();
      sentByUser[sender].add(receiver);
    });

    Object.entries(sentByUser).forEach(([sender, receivers]) => {
      receivers.forEach(receiver => {
        if (sentByUser[receiver]?.has(sender)) {
          const matchKey = [sender, receiver].sort().join('-');
          matches.add(matchKey);
        }
      });
    });

    return Array.from(matches).map(match => {
      const [user1, user2] = match.split('-');
      return { user1, user2, timestamp: new Date().toISOString() };
    });
  },

  fetchAllUsers: async (setAllUsers, setError) => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
      }));
      setAllUsers(usersList);
      return usersList;
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
      return [];
    }
  },

  fetchGroups: async (setGroups, setError) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'groups'));
      const groupList = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
      }));
      setGroups(groupList);
      return groupList;
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Failed to load groups');
      return [];
    }
  },

  fetchCoffeeInteractions: async (setCoffeeInteractions, setMutualMatches, setError) => {
    try {
      const interactionsSnapshot = await getDocs(collection(db, 'coffeeInteractions'));
      const interactionsList = interactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toISOString() || new Date().toISOString()
      }));
      setCoffeeInteractions(interactionsList);
      
      const mutualMatchesList = DataManagement.findMutualMatches(interactionsList);
      setMutualMatches(mutualMatchesList);
      
      return { interactions: interactionsList, matches: mutualMatchesList };
    } catch (error) {
      console.error('Error fetching coffee interactions:', error);
      setError('Failed to load coffee interactions');
      return { interactions: [], matches: [] };
    }
  },

  createGroup: async (groupName, currentUser, groups, setGroups, setError) => {
    try {
      const groupData = {
        name: groupName,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        memberCount: 0,
        lastUpdated: serverTimestamp()
      };

      const groupRef = await addDoc(collection(db, 'groups'), groupData);
      const newGroup = { id: groupRef.id, ...groupData };
      setGroups([...groups, newGroup]);
      return { success: true, group: newGroup };
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Failed to create group');
      return { success: false, error };
    }
  },

  handleGroupSelect: async (groupId, setters) => {
    if (!groupId) {
      console.warn('No group ID provided to handleGroupSelect');
      return { success: false, error: 'No group ID provided' };
    }
    
    const { setSelectedGroupId, setError, setLoading, setGroupUsers } = setters;
    
    try {
      setLoading?.(true);
      setSelectedGroupId?.(groupId);
      
      // Fetch group details first
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      // Fetch users in group
      const q = query(
        collection(db, 'users'),
        where('groupIds', 'array-contains', groupId)
      );
      const querySnapshot = await getDocs(q);
      const usersInGroup = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate().toISOString() || new Date().toISOString()
      }));

      if (typeof setGroupUsers === 'function') {
        setGroupUsers(usersInGroup);
      }

      return { 
        success: true, 
        group: { id: groupId, ...groupDoc.data() },
        users: usersInGroup 
      };
    } catch (error) {
      console.error('Error fetching group users:', error);
      setError?.('Failed to load group users');
      return { success: false, error };
    } finally {
      setLoading?.(false);
    }
  },

  addUserToGroup: async (userId, groupId, setters) => {
    const { setError, setLoading, setGroupUsers } = setters;
    
    try {
      setLoading?.(true);
      
      // Check if user exists
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }
      
      // Check if group exists
      const groupRef = doc(db, 'groups', groupId);
      const groupSnap = await getDoc(groupRef);
      
      if (!groupSnap.exists()) {
        throw new Error('Group not found');
      }

      const userData = userSnap.data();
      const currentGroupIds = userData.groupIds || [];
      
      // Check if user is already in group
      if (currentGroupIds.includes(groupId)) {
        return { success: false, error: 'User already in group' };
      }

      const updatedGroupIds = [...currentGroupIds, groupId];
      
      // Update user document
      await updateDoc(userRef, {
        groupIds: updatedGroupIds,
        lastUpdated: serverTimestamp()
      });
      
      // Update group document
      await updateDoc(groupRef, {
        memberCount: (groupSnap.data().memberCount || 0) + 1,
        lastUpdated: serverTimestamp()
      });

      // Refresh group users
      const refreshResult = await DataManagement.handleGroupSelect(groupId, setters);
      
      return { 
        success: true, 
        user: { id: userId, ...userSnap.data() },
        group: { id: groupId, ...groupSnap.data() },
        refreshResult 
      };
    } catch (error) {
      console.error('Error adding user to group:', error);
      setError?.('Failed to add user to group');
      return { success: false, error };
    } finally {
      setLoading?.(false);
    }
  }
};

// Event Handlers
const EventHandlers = {
  handleProfileUpdate: async (profileData, photoFile, setters) => {
    const { setError, setLoading, setUpdateSuccess } = setters;
    
    setLoading?.(true);
    try {
      let photoURL = profileData.profilePhoto;
      
      if (photoFile) {
        if (!photoFile.type.startsWith('image/') || photoFile.size > 5000000) {
          throw new Error('Invalid file: Must be an image under 5MB');
        }
        const storageRef = ref(storage, `profilePhotos/${profileData.userId}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      const updates = {
        ...profileData,
        profilePhoto: photoURL,
        lastUpdated: serverTimestamp()
      };

      await updateDoc(doc(db, 'users', profileData.userId), updates);
      setUpdateSuccess?.(true);
      return { success: true, updates };
    } catch (error) {
      console.error('Profile update error:', error);
      setError?.('Failed to update profile: ' + error.message);
      return { success: false, error };
    } finally {
      setLoading?.(false);
    }
  },

  handleGroupAction: {
    create: async (groupName, currentUser, setters) => {
      const { setError, setLoading, setGroups, setGroupName } = setters;
      
      if (!groupName?.trim()) {
        setError?.('Group name is required');
        return { success: false, error: 'Group name is required' };
      }
      
      setLoading?.(true);
      try {
        const result = await DataManagement.createGroup(
          groupName.trim(), 
          currentUser, 
          setGroups, 
          setError
        );
        if (result.success) {
          setGroupName?.('');
        }
        return result;
      } catch (error) {
        console.error('Group creation error:', error);
        setError?.('Failed to create group: ' + error.message);
        return { success: false, error };
      } finally {
        setLoading?.(false);
      }
    },

    select: async (groupId, setters) => {
      return await DataManagement.handleGroupSelect(groupId, setters);
    },

    addUser: async (userId, groupId, setters) => {
      return await DataManagement.addUserToGroup(userId, groupId, setters);
    }
  },

  handleUserSearch: debounce((searchTerm, setters) => {
    const { setFilteredUsers, setError } = setters;
    
    try {
      if (!searchTerm) {
        setFilteredUsers?.(null);
        return;
      }

      const searchLower = searchTerm.toLowerCase().trim();
      
      setFilteredUsers?.(users => 
        users?.filter(user => 
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.phoneNumber?.includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchLower)
        ) || []
      );
    } catch (error) {
      console.error('Search error:', error);
      setError?.('Search failed: ' + error.message);
    }
  }, 300),

  handleLogout: async (navigate) => {
    try {
      await auth.signOut();
      navigate('/login');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error };
    }
  },

  handleFileUpload: async (file, userId, setters) => {
    const { setError, setLoading, setPhotoURL } = setters;
    
    if (!file || !userId) {
      setError?.('Invalid file or user ID');
      return { success: false, error: 'Invalid file or user ID' };
    }

    setLoading?.(true);
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }
      if (file.size > 5000000) {
        throw new Error('File size must be under 5MB');
      }

      const fileName = `${userId}_${new Date().getTime()}_${file.name}`;
      const storageRef = ref(storage, `userFiles/${userId}/${fileName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPhotoURL?.(url);
      
      return { success: true, url };
    } catch (error) {
      console.error('File upload error:', error);
      setError?.('File upload failed: ' + error.message);
      return { success: false, error };
    } finally {
      setLoading?.(false);
    }
  },

  handleAnalyticsExport: (data, filename = 'analytics-export.csv') => {
    try {
      if (!data?.length) {
        throw new Error('No data to export');
      }

      const csvContent = convertToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Export error:', error);
      return { success: false, error: error.message };
    }
  },

  // Utility function for editing users
  handleEditUser: async (userId, updates, setters) => {
    const { setError, setLoading } = setters;
    
    setLoading?.(true);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        lastUpdated: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Edit user error:', error);
      setError?.('Failed to edit user: ' + error.message);
      return { success: false, error };
    } finally {
      setLoading?.(false);
    }
  }
};

// Helper function for CSV export
const convertToCSV = (data) => {
  if (!data?.length) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(header => {
      const value = item[header];
      // Handle different data types appropriately
      if (value == null) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value).replace(/,/g, ';');
    }).join(',')
  );
  
  return [
    headers.join(','),
    ...rows
  ].join('\n');
};

// UI Components
const UIComponents = {
  GroupManagementSection: ({ state, handlers }) => {
    const { groups, selectedGroupId, groupUsers, loading, groupName } = state;

    return (
      <section className="group-management-section" aria-labelledby="group-management-header">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Group Management</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={groupName}
              onChange={(e) => state.setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={handlers.createGroup}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || !groupName.trim()}
            >
              Create Group
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="groups-list space-y-2">
            {groups.map(group => (
              <div 
                key={group.id}
                className={`p-4 border rounded cursor-pointer transition-colors ${
                  selectedGroupId === group.id 
                    ? 'bg-blue-50 border-blue-500' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handlers.handleGroupSelect(group.id)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{group.name}</span>
                  <span className="text-sm text-gray-500">
                    {group.memberCount || 0} members
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Created: {new Date(group.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {groups.length === 0 && !loading && (
              <div className="text-gray-500 text-center py-4">
                No groups created yet
              </div>
            )}
          </div>

          {selectedGroupId && (
            <div className="group-details p-4 border rounded">
              <h3 className="text-lg font-medium mb-3">Group Members</h3>
              <div className="space-y-2">
                {groupUsers.map(user => (
                  <div 
                    key={user.id} 
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <div className="user-info">
                      <span className="font-medium">{user.firstName}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {user.phoneNumber}
                      </span>
                    </div>
                    <button 
                      onClick={() => handlers.removeFromGroup(user.id)}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      disabled={loading}
                      aria-label="Remove user from group"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {groupUsers.length === 0 && (
                  <div className="text-gray-500 text-center py-4">
                    No members in this group
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  },

  UserManagementSection: ({ state, handlers }) => {
    const { allUsers, loading, searchTerm } = state;
    
    return (
      <section className="user-management-section mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">User Management</h2>
          <div className="flex gap-4">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => handlers.handleUserSearch(e.target.value)}
              placeholder="Search users..."
              className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Groups
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full overflow-hidden">
                        <img 
                          src={user.profilePhoto || DataManagement.defaultProfilePhoto} 
                          alt={user.firstName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.phoneNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-2">
                      {user.groupIds?.map(groupId => (
                        <span 
                          key={groupId}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                        >
                          {state.groups.find(g => g.id === groupId)?.name || groupId}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${
                      user.setupComplete 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.setupComplete ? 'Active' : 'Setup Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handlers.handleEditUser(user.id)}
                      className="text-blue-600 hover:text-blue-900 disabled:opacity-50 mr-4"
                      disabled={loading}
                    >
                      Edit
                    </button>
                    {user.isAdmin && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {allUsers.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No users found
            </div>
          )}
        </div>
      </section>
    );
  },

  AnalyticsSection: ({ state }) => {
    const { coffeeInteractions, mutualMatches } = state;
    
    return (
      <section className="analytics-section mt-8">
        <h2 className="text-xl font-semibold mb-6">Analytics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Interaction Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {coffeeInteractions.length}
                </div>
                <div className="text-sm text-gray-500">
                  Total Interactions
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {mutualMatches.length}
                </div>
                <div className="text-sm text-gray-500">
                  Mutual Matches
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Interaction Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={coffeeInteractions}>
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={date => new Date(date).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={label => new Date(label).toLocaleString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    );
  }
};

// Main Dashboard Component
const AdminDashboard = () => {
  const { 
    state, 
    auth: { currentUser, isAdmin, navigate }
  } = useAdminDashboard();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
  
    const loadInitialData = async () => {
      state.setLoading(true);
      try {
        await Promise.all([
          DataManagement.fetchAllUsers(state.setAllUsers, state.setError),
          DataManagement.fetchGroups(state.setGroups, state.setError),
          DataManagement.fetchCoffeeInteractions(
            state.setCoffeeInteractions,
            state.setMutualMatches,
            state.setError
          )
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
        state.setError('Failed to load dashboard data');
      } finally {
        state.setLoading(false);
      }
    };
  
    loadInitialData();
  }, [isAdmin, navigate, state]);

  const handlers = {
    createGroup: () => EventHandlers.handleGroupAction.create(
      state.groupName,
      currentUser,
      {
        setError: state.setError,
        setLoading: state.setLoading,
        setGroups: state.setGroups,
        setGroupName: state.setGroupName
      }
    ),

    handleGroupSelect: (groupId) => DataManagement.handleGroupSelect(
      groupId,
      {
        setSelectedGroupId: state.setSelectedGroupId,
        setGroupUsers: state.setGroupUsers,
        setError: state.setError,
        setLoading: state.setLoading
      }
    ),

    handleUserSearch: (term) => EventHandlers.handleUserSearch(
      term,
      {
        setFilteredUsers: state.setAllUsers,
        setError: state.setError
      }
    ),

    handleEditUser: async (userId) => {
      const result = await EventHandlers.handleEditUser(
        userId,
        {
          setError: state.setError,
          setLoading: state.setLoading
        }
      );
      if (result.success) {
        // Refresh user list after edit
        await DataManagement.fetchAllUsers(state.setAllUsers, state.setError);
      }
    },

    handleLogout: () => EventHandlers.handleLogout(navigate),

    handleExportData: () => EventHandlers.handleAnalyticsExport(
      state.coffeeInteractions,
      'coffee-interactions-export.csv'
    )
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Error</h2>
        <p>{state.error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={handlers.handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <UIComponents.GroupManagementSection 
            state={state} 
            handlers={handlers}
          />
          
          <UIComponents.UserManagementSection 
            state={state} 
            handlers={handlers}
          />
          
          <UIComponents.AnalyticsSection 
            state={state}
          />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;