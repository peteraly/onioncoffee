// Login.js

import React, { useState } from 'react';
import { auth, db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { useAuth, TEST_USER } from '../contexts/AuthContext';
import '../styles/Login.css';

const TEST_MODE = false; // Set to true for testing with the test account

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsTestUser } = useAuth();

  const initializeRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'normal',  // Use 'invisible' in production
        callback: (response) => {
          console.log('reCAPTCHA verified successfully:', response);
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired, please try again.');
        }
      }, auth);

      window.recaptchaVerifier.render().then((widgetId) => {
        console.log('reCAPTCHA rendered with widget ID:', widgetId);
      });
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (TEST_MODE && phoneNumber === TEST_USER.phoneNumber) {
        setStep(2); // Move to test code input step in test mode
      } else if (!TEST_MODE) {
        initializeRecaptcha();  // Initialize reCAPTCHA before sending code

        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
        window.confirmationResult = confirmationResult;  // Store confirmation result for code verification
        console.log('Verification code sent to:', phoneNumber);
        setStep(2);  // Proceed to verification code input step
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      setError('Failed to send verification code. Please check the number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (TEST_MODE && phoneNumber === TEST_USER.phoneNumber && verificationCode === TEST_USER.verificationCode) {
        await handleTestLogin();
      } else if (!TEST_MODE) {
        if (window.confirmationResult) {
          const result = await window.confirmationResult.confirm(verificationCode);
          console.log('User signed in:', result.user);
          navigate('/dashboard');
        } else {
          throw new Error('No confirmation result available. Please restart the process.');
        }
      }
    } catch (error) {
      console.error('Code verification error:', error);
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-900">onion.coffee</h2>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

        <div id="recaptcha-container"></div> {/* reCAPTCHA container */}

        <form onSubmit={step === 1 ? handleVerificationSubmit : handleCodeSubmit} className="space-y-4">
          {step === 1 ? (
            <div className="space-y-4">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter your phone number"
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                disabled={loading}
                required
              />
              <button 
                type="submit"
                className="w-full px-4 py-2 text-white bg-blue-600 rounded-md"
                disabled={loading || !phoneNumber}
              >
                {loading ? 'Processing...' : 'Send Code'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter verification code"
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                disabled={loading}
                required
              />
              <button 
                type="submit"
                className="w-full px-4 py-2 text-white bg-blue-600 rounded-md"
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
