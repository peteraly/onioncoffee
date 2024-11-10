import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/DateDetails.css'; // Updated to ensure path correctness

const DateDetails = ({ dateDetails }) => {
  if (!dateDetails) {
    return <p>No upcoming dates scheduled.</p>;
  }

  const { time, location, tip } = dateDetails;

  return (
    <div className="date-details-container">
      <h3>Upcoming Date</h3>
      <div className="date-card">
        <p><strong>☕ Coffee Date</strong></p>
        <p>{time || 'Time not set'}</p>
        <p>{location || 'Location not set'}</p>
        <button className="check-in-button" aria-label="Check In Button">Check In</button>
        <div className="date-actions">
          <button className="share-location-button" aria-label="Share Location Button">📍 Share Location</button>
          <button className="sos-button" aria-label="SOS Button">🆘 SOS</button>
        </div>
      </div>
      <div className="getting-ready">
        <p><strong>Getting Ready:</strong> {tip || 'No tips available'}</p>
      </div>
    </div>
  );
};

// Prop types to validate incoming props
DateDetails.propTypes = {
  dateDetails: PropTypes.shape({
    time: PropTypes.string,
    location: PropTypes.string,
    tip: PropTypes.string,
  }),
};

export default DateDetails;
