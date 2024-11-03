import React, { useState } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import '../styles/Login.css';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('Captcha Resolved');
        },
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.');
          setLoading(false);
        }
      }, auth);
    }
};

  const formatPhoneNumber = (number) => {
    const cleaned = number.replace(/\D/g, '');
    return cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;
  };

  const onSignInSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!phoneNumber) {
      setError('Please enter a phone number');
      setLoading(false);
      return;
    }

    try {
      setupRecaptcha();
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
      console.log('Attempting to send code to:', formattedPhoneNumber);
      
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhoneNumber,
        window.recaptchaVerifier
      );
      
      window.confirmationResult = confirmationResult;
      setStep(2);
    } catch (error) {
      console.error('Sign in error:', error);
      let errorMessage = 'Error sending verification code. Please try again.';
      
      if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'Security check failed. Please ensure you are using a valid domain.';
      } else if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Please enter a valid phone number.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'Too many attempts. Please try again later.';
      }
      
      setError(errorMessage);
      
      // Clear recaptcha on error
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (clearError) {
          console.error('Error clearing reCAPTCHA:', clearError);
        }
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const onVerificationSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!verificationCode) {
      setError('Please enter the verification code');
      setLoading(false);
      return;
    }

    try {
      if (!window.confirmationResult) {
        throw new Error('Verification session expired. Please request a new code.');
      }

      const result = await window.confirmationResult.confirm(verificationCode);
      const user = result.user;
      
      // Check if user is admin
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Redirect based on admin status
        if (userData.isAdmin === true) {
          navigate('/admin-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        // New user, redirect to regular dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Verification Error:', error);
      let errorMessage = 'Invalid verification code. Please try again.';
      
      if (error.code === 'auth/code-expired') {
        errorMessage = 'Verification code expired. Please request a new code.';
      } else if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid code. Please check and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">onion.coffee</h2>
      {error && <p className="error-message">{error}</p>}
      
      {step === 1 ? (
        <form onSubmit={onSignInSubmit} className="login-form">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number (e.g., 7194914511)"
            className="input-field"
            required
          />
          <div id="recaptcha-container"></div>  {/* Add this line */}
          <button 
            type="submit" 
            className="submit-button" 
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={onVerificationSubmit} className="login-form">
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter verification code"
            className="input-field"
            required
          />
          <button 
            type="submit" 
            className="submit-button" 
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Login;