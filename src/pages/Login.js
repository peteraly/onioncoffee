import React, { useState, useEffect, useRef } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Login.css';

const TEST_CREDENTIALS = {
  phoneNumber: '5551234567',
  verificationCode: '123456'
};

const TEST_USER_DATA = {
  firstName: 'Test User',
  phoneNumber: TEST_CREDENTIALS.phoneNumber,
  age: '25',
  setupComplete: true,
  isAdmin: false,
  createdAt: new Date(),
  lastUpdated: new Date(),
  groupIds: [],
  coffeeAdded: []
};

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsTestUser } = useAuth();
  const recaptchaContainerRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);

  useEffect(() => {
    const initRecaptcha = async () => {
      if (step === 1 && !recaptchaVerifierRef.current) {
        try {
          console.log('Starting reCAPTCHA initialization');
          const verifier = new RecaptchaVerifier(
            recaptchaContainerRef.current,
            {
              size: 'normal',
              callback: handleVerificationSubmit,
              'expired-callback': async () => {
                console.error('reCAPTCHA expired.');
                setLoading(false);
                setError('reCAPTCHA expired. Please try again.');
              }
            },
            auth
          );
          await verifier.render();
          recaptchaVerifierRef.current = verifier;
          console.log('reCAPTCHA initialized');
        } catch (error) {
          console.error('reCAPTCHA init error:', error);
          setError('Failed to initialize verification system. Please refresh the page.');
        }
      }
    };

    initRecaptcha();

    return () => {
      // Clean up the recaptchaVerifier when the component unmounts
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear().catch(console.error);
        recaptchaVerifierRef.current = null;
      }
    };
  }, [step]); // Only re-initialize if the step changes

  const formatPhoneNumber = (number) => {
    const cleaned = number.replace(/\D/g, '');
    return cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;
  };

  const handleVerificationSubmit = async () => {
    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }
  
    if (!recaptchaVerifierRef.current) {
      setError('reCAPTCHA is not ready. Please try again.');
      return;
    }
  
    try {
      setLoading(true);
  
      // Format the phone number
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
      console.log('Formatted Phone Number:', formattedPhoneNumber);
  
      // Send the verification code
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhoneNumber,
        recaptchaVerifierRef.current
      );
  
      // Store confirmation result globally for later use
      window.confirmationResult = confirmationResult;
      setStep(2); // Move to the next step (entering the code)
      console.log('Verification code sent successfully.');
    } catch (error) {
      console.error('Phone verification error:', error);
      setError(error.message || 'Failed to send verification code');
      if (recaptchaVerifierRef.current) {
        await recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  // Create test user profile in Firestore
  const createTestUserProfile = async () => {
    try {
      const testUserRef = doc(db, 'users', TEST_CREDENTIALS.phoneNumber);
      const userDoc = await getDoc(testUserRef);

      if (!userDoc.exists()) {
        // If the test user doesn't exist, create a new document
        await setDoc(testUserRef, TEST_USER_DATA);
        console.log('Test user profile created.');
      } else {
        console.log('Test user profile already exists.');
      }

      return true; // Return true after successful profile creation
    } catch (error) {
      console.error('Error creating test user profile:', error);
      return false; // Return false in case of error
    }
  };

  // Handle form submission for verifying the code
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (step === 1) {
        if (phoneNumber === TEST_CREDENTIALS.phoneNumber) {
          setStep(2);
          return;
        }
        return;
      }

      setLoading(true);
      if (phoneNumber === TEST_CREDENTIALS.phoneNumber) {
        if (verificationCode === TEST_CREDENTIALS.verificationCode) {
          const profileCreated = await createTestUserProfile();
          if (!profileCreated) {
            throw new Error('Failed to create test profile');
          }
          setIsTestUser(true);
          navigate('/dashboard');
        } else {
          throw new Error('Invalid verification code');
        }
        return;
      }

      if (!window.confirmationResult) {
        throw new Error('Verification session expired. Please try again.');
      }

      const result = await window.confirmationResult.confirm(verificationCode);
      if (result.user) {
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (userDoc.exists()) {
          navigate('/dashboard');
        } else {
          navigate('/setup');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          onion.coffee
        </h2>
        
        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-sm font-medium text-blue-800">Test Account:</p>
          <p className="text-sm text-blue-700">Phone: {TEST_CREDENTIALS.phoneNumber}</p>
          {step === 2 && (
            <p className="text-sm text-blue-700">Code: {TEST_CREDENTIALS.verificationCode}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            <div className="space-y-4">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
              />
              <div id="recaptcha-container" ref={recaptchaContainerRef} className="flex justify-center"></div>
              <button 
                type="submit"
                className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
                disabled={loading || !phoneNumber}
              >
                {loading ? 'Processing...' : 'Send Verification Code'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter verification code"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
              />
              <button 
                type="submit"
                className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  setStep(1);
                  setVerificationCode('');
                  setError('');
                }}
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Back to Phone Number
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
