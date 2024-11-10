import React, { useState } from 'react';

const ScheduleCard = ({ data, timeSlots, onUpdate, onNext, onBack }) => {
  const [schedule, setSchedule] = useState(data || {});
  const [error, setError] = useState(null);

  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
  ];

  const handleDayToggle = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        available: !prev[day]?.available
      }
    }));
  };

  const handleTimeSlotToggle = (day, slotId) => {
    setSchedule(prev => {
      const currentSlots = prev[day]?.timeSlots || [];
      const newSlots = currentSlots.includes(slotId)
        ? currentSlots.filter(id => id !== slotId)
        : [...currentSlots, slotId];
      
      return {
        ...prev,
        [day]: {
          ...prev[day],
          timeSlots: newSlots
        }
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const hasSelection = Object.values(schedule).some(
      day => day.available && day.timeSlots.length > 0
    );

    if (!hasSelection) {
      setError('Please select at least one day and time slot for your availability.');
      return;
    }

    onUpdate(schedule);
    onNext();
  };

  return (
    <div className="setup-card-content">
      <h2>Schedule Availability</h2>
      {error && (
        <div className="setup-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="schedule-grid">
          {days.map(day => (
            <div key={day} className="day-container">
              <div className="day-header">
                <label className="day-toggle">
                  <input
                    type="checkbox"
                    checked={schedule[day]?.available || false}
                    onChange={() => handleDayToggle(day)}
                  />
                  <span className="day-name">
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </span>
                </label>
              </div>

              {schedule[day]?.available && (
                <div className="time-slots">
                  {timeSlots.map(slot => (
                    <label key={slot.id} className="time-slot">
                      <input
                        type="checkbox"
                        checked={schedule[day]?.timeSlots.includes(slot.id)}
                        onChange={() => handleTimeSlotToggle(day, slot.id)}
                      />
                      <span className="slot-time">{slot.label}</span>
                      <small>{slot.time}</small>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="setup-navigation">
          <button
            type="button"
            className="setup-btn setup-btn-secondary"
            onClick={onBack}
          >
            Back
          </button>
          <button
            type="submit"
            className="setup-btn setup-btn-primary"
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleCard;
