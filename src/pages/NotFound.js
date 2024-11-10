import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="not-found-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      <Link to="/" style={{
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#4a5568',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '5px'
      }}>
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;