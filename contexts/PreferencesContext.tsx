import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { UserPreferences, initialUserData, Alert, initialAlertData } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { useNavigate } from 'react-router-dom';
import { PagePath } from '../constants';

interface PreferencesContextType {
  user: UserPreferences;
  setUser: Dispatch<SetStateAction<UserPreferences>>;
  activeAlert: Alert | null;
  setActiveAlert: Dispatch<SetStateAction<Alert | null>>;
  startNewAlert: () => void;
  selectAlertForEditing: (alertId: string) => void;
  saveActiveAlert: () => void;
  deleteAlert: (alertId: string) => void;
  updateAlert: (alertId: string, partialAlert: Partial<Alert>) => void;
  logout: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [storedUser, setStoredUser] = useLocalStorage<UserPreferences>('userPreferences', initialUserData);
  const [user, setUser] = useState<UserPreferences>(storedUser);
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  
  // The navigate function can only be used in components that are descendants of a Router.
  // PreferencesProvider is high up, so we need a wrapper component to use the hook.
  return (
      <PreferencesContext.Provider value={useProviderValue(user, setUser, activeAlert, setActiveAlert, setStoredUser)}>
        {children}
      </PreferencesContext.Provider>
  );
};

// This hook contains the logic that uses navigate and is called within the provider.
const useProviderValue = (
    user: UserPreferences, 
    setUser: Dispatch<SetStateAction<UserPreferences>>,
    activeAlert: Alert | null,
    setActiveAlert: Dispatch<SetStateAction<Alert | null>>,
    setStoredUser: Dispatch<SetStateAction<UserPreferences>>
): PreferencesContextType => {

  const navigate = useNavigate();

  useEffect(() => {
    setStoredUser(user);
  }, [user, setStoredUser]);

  const logout = () => {
    setUser(initialUserData);
    setActiveAlert(null);
    navigate(PagePath.LANDING);
  };

  const startNewAlert = () => {
    const newAlert: Alert = {
      id: `new-${Date.now()}`, // Temporary ID
      name: `New Alert ${user.alerts.length + 1}`,
      ...initialAlertData
    };
    setActiveAlert(newAlert);
    navigate(PagePath.INTERESTS);
  };

  const selectAlertForEditing = (alertId: string) => {
    const alertToEdit = user.alerts.find(a => a.id === alertId);
    if (alertToEdit) {
      setActiveAlert(alertToEdit);
      navigate(PagePath.INTERESTS);
    } else {
      console.error("Alert not found for editing");
    }
  };

  const saveActiveAlert = () => {
    if (!activeAlert) return;

    setUser(prevUser => {
      const existingIndex = prevUser.alerts.findIndex(a => a.id === activeAlert.id);
      let newAlerts;
      if (existingIndex > -1) {
        // Update existing alert
        newAlerts = [...prevUser.alerts];
        newAlerts[existingIndex] = activeAlert;
      } else {
        // Add new alert (and give it a permanent ID if it was temporary)
        const finalAlert = { ...activeAlert, id: `alert-${Date.now()}` };
        newAlerts = [...prevUser.alerts, finalAlert];
      }
      return { ...prevUser, alerts: newAlerts };
    });
    // After saving, clear the active alert
    setActiveAlert(null);
  };

  const deleteAlert = (alertId: string) => {
    setUser(prevUser => ({
      ...prevUser,
      alerts: prevUser.alerts.filter(a => a.id !== alertId),
    }));
  };

  const updateAlert = (alertId: string, partialAlert: Partial<Alert>) => {
     setUser(prevUser => ({
      ...prevUser,
      alerts: prevUser.alerts.map(a => a.id === alertId ? { ...a, ...partialAlert } : a),
    }));
  }

  return { user, setUser, activeAlert, setActiveAlert, startNewAlert, selectAlertForEditing, saveActiveAlert, deleteAlert, updateAlert, logout };
}


export const usePreferences = (): PreferencesContextType => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
