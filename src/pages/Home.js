import React from 'react';

const Home = () => {
  return (
    <div className="flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to onion.coffee</h1>
      <p className="text-xl mb-8">Discover our unique coffee blends!</p>
      <iframe 
        src="https://forms.gle/tCL3G4SVHW62qYhn9"
        className="w-full max-w-2xl h-[600px]"
        frameBorder="0"
        marginHeight="0"
        marginWidth="0"
        title="Onion Coffee Feedback Form"  // Added title attribute for accessibility
      >
        Loading form...
      </iframe>
    </div>
  );
};

export default Home;
