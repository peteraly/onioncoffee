// src/pages/Register.js

import React, { useState } from 'react';
import { auth, db } from '../firebase/config';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [age, setAge] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          console.log("Recaptcha verified");
        },
        'expired-callback': () => {
          console.log("Recaptcha expired");
          setError("reCAPTCHA expired. Please try again.");
        }
      });
    }
  }

  const formatPhoneNumber = (number) => {
    const cleaned = number.replace(/\D/g, '');
    return cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;
  }

  const onSignUpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setupRecaptcha();
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
      console.log("Sending verification code to:", formattedPhoneNumber);
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      setStep(2);
      console.log('SMS sent successfully');
    } catch (error) {
      console.error('Error sending verification code:', error);
      setError(`Error sending SMS: ${error.message}`);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then(function(widgetId) {
          window.grecaptcha.reset(widgetId);
        });
      }
    }
  }

  const onVerificationSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await window.confirmationResult.confirm(verificationCode);
      const user = result.user;
      await setDoc(doc(db, 'users', user.uid), {
        firstName,
        phoneNumber: formatPhoneNumber(phoneNumber),
        age: parseInt(age),
      });
      console.log("User registered successfully");
      navigate('/dashboard');
    } catch (error) {
      console.error('Error verifying code:', error);
      setError(`Error verifying code: ${error.message}`);
    }
  }

  return (
    <div>
      <h2>Register</h2>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {step === 1 ? (
        <form onSubmit={onSignUpSubmit}>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter first name"
            required
          />
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number (e.g., 17194914511)"
            required
          />
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Enter age"
            required
          />
          <button type="submit">Send Verification Code</button>
          <div id="recaptcha-container"></div>
        </form>
      ) : (
        <form onSubmit={onVerificationSubmit}>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter verification code"
            required
          />
          <button type="submit">Verify Code</button>
        </form>
      )}
    </div>
  );
};

export default Register;