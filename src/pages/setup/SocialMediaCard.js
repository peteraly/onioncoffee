import React, { useState } from 'react';

const SocialMediaCard = ({ data, onUpdate, onNext, onBack }) => {
  const [socialLinks, setSocialLinks] = useState(data || []);
  const [error, setError] = useState(null);
  const [newLink, setNewLink] = useState({
    platform: '',
    handle: '',
    url: ''
  });

  const platforms = [
    { id: 'instagram', label: 'Instagram', prefix: '@' },
    { id: 'twitter', label: 'Twitter/X', prefix: '@' },
    { id: 'linkedin', label: 'LinkedIn', prefix: 'https://linkedin.com/in/' },
    { id: 'website', label: 'Personal Website', prefix: 'https://' },
    { id: 'other', label: 'Other', prefix: 'https://' }
  ];

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateHandle = (platform, handle) => {
    switch (platform) {
      case 'instagram':
      case 'twitter':
        return handle.startsWith('@') && handle.length > 1;
      case 'linkedin':
        return validateUrl(`https://linkedin.com/in/${handle}`);
      case 'website':
      case 'other':
        return validateUrl(handle);
      default:
        return true;
    }
  };

  const handleAddLink = () => {
    if (!newLink.platform || !newLink.handle) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateHandle(newLink.platform, newLink.handle)) {
      setError('Please enter a valid handle or URL');
      return;
    }

    // Format the URL based on platform
    let formattedUrl = newLink.handle;
    if (newLink.platform === 'instagram') {
      formattedUrl = `https://instagram.com/${newLink.handle.replace('@', '')}`;
    } else if (newLink.platform === 'twitter') {
      formattedUrl = `https://twitter.com/${newLink.handle.replace('@', '')}`;
    } else if (newLink.platform === 'linkedin' && !newLink.handle.startsWith('http')) {
      formattedUrl = `https://linkedin.com/in/${newLink.handle}`;
    }

    setSocialLinks(prev => [...prev, {
      ...newLink,
      url: formattedUrl
    }]);

    setNewLink({
      platform: '',
      handle: '',
      url: ''
    });
    setError(null);
  };

  const handleRemoveLink = (index) => {
    setSocialLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(socialLinks);
    onNext();
  };

  return (
    <div className="setup-card-content">
      <h2>Social Media Links</h2>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="social-links-list">
          {socialLinks.map((link, index) => (
            <div key={index} className="social-link-item">
              <span>{platforms.find(p => p.id === link.platform)?.label}</span>
              <span>{link.handle}</span>
              <button
                type="button"
                className="btn-remove"
                onClick={() => handleRemoveLink(index)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="add-social-link">
          <select
            value={newLink.platform}
            onChange={(e) => setNewLink(prev => ({
              ...prev,
              platform: e.target.value
            }))}
          >
            <option value="">Select Platform</option>
            {platforms.map(platform => (
              <option key={platform.id} value={platform.id}>
                {platform.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={newLink.handle}
            onChange={(e) => setNewLink(prev => ({
              ...prev,
              handle: e.target.value
            }))}
            placeholder={
              newLink.platform 
                ? `Enter ${platforms.find(p => p.id === newLink.platform)?.prefix}...` 
                : 'Select platform first'
            }
          />

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddLink}
          >
            Add Link
          </button>
        </div>

        <div className="btn-container">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onBack}
          >
            Back
          </button>
          <button
            type="submit"
            className="btn btn-primary"
          >
            Complete Setup
          </button>
        </div>
      </form>
    </div>
  );
};

export default SocialMediaCard;