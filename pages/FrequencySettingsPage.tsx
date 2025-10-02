import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { usePreferences } from '../contexts/PreferencesContext';
import Button from '../components/common/Button';
import TagButton from '../components/common/TagButton'; 
import Input from '../components/common/Input';
import SectionCard from '../components/common/SectionCard';
import ProgressIndicator from '../components/common/ProgressIndicator';
import { ICONS, PagePath } from '../constants';
import { UpdateFrequency, Alert } from '../types';

const FrequencySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeAlert, setActiveAlert, user, saveActiveAlert } = usePreferences();
  const [customTime, setCustomTime] = useState(activeAlert?.customFrequencyTime || "09:00");
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    if (!activeAlert) {
      navigate(PagePath.DASHBOARD);
    }
  }, [activeAlert, navigate]);

  if (!activeAlert) {
    return <Navigate to={PagePath.DASHBOARD} replace />;
  }
  
  const handleUpdateAlert = (updater: (prevAlert: Alert) => Alert) => {
    setActiveAlert(prev => prev ? updater(prev) : null);
  };

  const frequencyOptions = Object.values(UpdateFrequency);

  const handleFrequencyTagSelect = (newFrequency: UpdateFrequency) => {
    handleUpdateAlert(prev => {
        const newState = { ...prev, frequency: newFrequency };
        if (newFrequency !== UpdateFrequency.CUSTOM) {
            newState.customFrequencyTime = undefined;
            setTimeError('');
        } else {
            newState.customFrequencyTime = customTime;
        }
        return newState;
    });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setCustomTime(newTime);
    if (activeAlert.frequency === UpdateFrequency.CUSTOM) {
      handleUpdateAlert(prev => ({...prev, customFrequencyTime: newTime}));
    }
    if (newTime) {
        setTimeError('');
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeAlert.frequency === UpdateFrequency.CUSTOM && !customTime) {
        setTimeError("Please specify a time for custom frequency.");
        return;
    }
    setTimeError('');
    saveActiveAlert();
    alert("Alert Saved! You're all set. Redirecting to your dashboard...");
    navigate(PagePath.DASHBOARD);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-secondary-dark to-gray-900 text-white page-fade-enter">
      <div className="max-w-xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <ProgressIndicator currentStep={3} steps={['Select Interests', 'Fine-Tune Feed', 'Set Cadence']} />
        
        <header className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Set Cadence for <span className="text-primary">{activeAlert.name}</span></h1>
          <p className="text-base sm:text-lg text-primary-lighter/80 mt-3">Almost there! Choose how often you'd like to receive your updates.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <SectionCard 
            className="bg-white/5 backdrop-blur-xl shadow-2xl border border-white/10"
          >
            <div className="mb-8">
              <label className="block text-md font-semibold text-primary-lighter mb-4">How often should updates arrive?</label>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {frequencyOptions.map(freq => (
                  <TagButton
                    key={freq}
                    label={freq}
                    isSelected={activeAlert.frequency === freq}
                    onClick={() => handleFrequencyTagSelect(freq)}
                    size="lg"
                    color="bg-gray-700/50 hover:bg-gray-700"
                    textColor="text-gray-100"
                    selectedColor="bg-primary ring-2 ring-primary-dark shadow-lg"
                    selectedTextColor="text-white"
                    className="!rounded-lg w-full justify-center !py-3"
                  />
                ))}
              </div>
            </div>
            
            {activeAlert.frequency === UpdateFrequency.CUSTOM && (
              <div className="mt-6 p-4 bg-primary-lighter/5 rounded-lg border border-primary/20 transition-all duration-300 ease-in-out">
                <Input
                    label="Preferred delivery time"
                    type="time"
                    id="customTime"
                    value={customTime}
                    onChange={handleTimeChange}
                    inputClassName="bg-white/10 placeholder-gray-400 text-white border-white/20 focus:border-primary focus:ring-primary"
                    labelClassName="text-primary-lighter !font-medium text-md"
                    error={timeError}
                    required
                />
              </div>
            )}

             <div className="mt-10">
                <p className="block text-md font-semibold text-primary-lighter mb-3">Delivery Platform:</p>
                <div className="bg-primary-lighter/10 p-4 rounded-lg border-2 border-primary/40 shadow-sm">
                    <div className="flex items-center">
                        <input
                            id="whatsapp-platform"
                            name="platform"
                            type="radio"
                            checked={user.platform === "WhatsApp"}
                            readOnly 
                            className="focus:ring-primary h-5 w-5 text-primary border-gray-400 cursor-not-allowed bg-gray-600"
                        />
                        <label htmlFor="whatsapp-platform" className="ml-3 block text-md font-medium text-primary-lighter flex items-center">
                            <span className="mr-2 text-xl">{ICONS.WHATSAPP}</span> WhatsApp
                        </label>
                    </div>
                    <p className="ml-9 mt-1 text-xs text-gray-400">(Currently the only platform. More coming soon!)</p>
                </div>
            </div>
          </SectionCard>

          <div className="mt-12 pt-8 border-t border-primary-lighter/20 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => navigate(PagePath.TUNING)} 
              className="w-full sm:w-auto text-primary-lighter/80 hover:text-white !py-3 px-6"
              leftIcon={ICONS.ARROW_LEFT}
            >
              Back to Tuning
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white !py-3.5 px-8 shadow-lg hover:shadow-xl"
              leftIcon={ICONS.CHECK}
            >
              Confirm & Create Alert
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FrequencySettingsPage;
