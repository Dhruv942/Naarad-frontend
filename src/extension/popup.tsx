
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import useLocalStorage from '../hooks/useLocalStorage';
import { UserPreferences, initialPreferencesData } from '../types';

// Declare chrome for extension APIs to satisfy TypeScript without @types/chrome.
declare const chrome: any;

const Popup: React.FC = () => {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [storedPrefs, setStoredPrefs] = useLocalStorage<UserPreferences>('userPreferences', initialPreferencesData);
  
  const isAdded = suggestion ? storedPrefs.customInterestTags.includes(suggestion) : false;

  useEffect(() => {
    // Request page info from the background script when the popup opens
    chrome.runtime.sendMessage({ type: 'GET_PAGE_INFO' }, (response: string | null) => {
      setIsLoading(false);
      if (chrome.runtime.lastError) {
        setError("Could not communicate with the page. Try reloading it.");
        return;
      }
      
      const title = response && typeof response === 'string' ? response.trim() : null;
      if (title) {
        setSuggestion(title);
      } else {
        setError("Could not get a topic from this page.");
      }
    });
  }, []); // Run only once when the popup is opened

  const handleAddInterest = () => {
    if (suggestion && !isAdded) {
      setStoredPrefs(prevPrefs => ({
        ...prevPrefs,
        customInterestTags: [...prevPrefs.customInterestTags, suggestion],
      }));
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
           <svg className={`animate-spin h-8 w-8 text-primary`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      );
    }

    if (error) {
      return <p className="text-center text-red-400 text-sm">{error}</p>;
    }

    if (suggestion) {
      return (
        <div className="text-center">
          <p className="text-sm text-gray-300 mb-2">Add topic to your feed?</p>
          <h2 className="text-lg font-semibold text-white mb-4 break-words">{suggestion}</h2>
          <button
            onClick={handleAddInterest}
            disabled={isAdded}
            className={`w-full px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 ease-in-out flex items-center justify-center
              ${isAdded
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-primary'
              }`}
          >
            {isAdded ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Added to Interests
              </>
            ) : (
                'Add to Custom Interests'
            )}
          </button>
        </div>
      );
    }

    return <p className="text-center text-gray-400">No topic found on this page.</p>;
  };

  return (
    <div className="bg-gray-950 text-white p-4 h-full flex flex-col justify-center">
      {renderContent()}
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to for the extension popup");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
