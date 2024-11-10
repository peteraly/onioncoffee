import React from 'react';
import ReactDOM from 'react-dom/client'; // For React 18+
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Get the root element from the DOM
const rootElement = document.getElementById('root');

if (rootElement) {
  // Initialize the React root with createRoot in React 18
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  // Log an error if the root element is missing
  console.error('Root element not found. Ensure your index.html has a <div id="root"></div>.');
}

// Optional: Measure performance in your app, use reportWebVitals (if needed)
reportWebVitals();
