import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../contexts/PreferencesContext';
import Button from '../components/common/Button';
import SectionCard from '../components/common/SectionCard';
import { ICONS, PagePath, INTEREST_TAG_HIERARCHY, FollowUpQuestion as FollowUpQuestionTypeConstant, Tag as TagType } from '../constants';
import { Alert, SelectableTagCategoryKey, CategorySpecificPreferences } from '../types';

const getTagTextColor = (backgroundColor: string): string => {
  if (backgroundColor.includes('orange')) return 'text-orange-700';
  if (backgroundColor.includes('pink')) return 'text-pink-700';
  if (backgroundColor.includes('purple')) return 'text-purple-700';
  if (backgroundColor.includes('teal')) return 'text-teal-700';
  if (backgroundColor.includes('blue')) return 'text-blue-700';
  if (backgroundColor.includes('primary-lightest')) return 'text-green-800';
  return 'text-primary-darker';
};

const DisplayDetailTag: React.FC<{ label: string; icon?: React.ReactNode, color?: string }> = ({ label, icon, color = 'primary-lightest' }) => {
  const textColorClass = getTagTextColor(color);
  return (
    <span className={`bg-${color} ${textColorClass} px-2.5 py-1 rounded-full text-xs font-medium shadow-sm border border-black/5 inline-flex items-center gap-1.5`}>
      {icon && <span className="text-sm">{icon}</span>}
      {label}
    </span>
  );
};

const AlertCard: React.FC<{ alert: Alert }> = ({ alert }) => {
  const { deleteAlert, updateAlert, selectAlertForEditing } = usePreferences();
  const [isEditingName, setIsEditingName] = useState(false);
  const [alertName, setAlertName] = useState(alert.name);

  const getTagDisplayDetails = (tagId: string): { label: string, icon?: string | React.ReactNode } => {
    for (const mainCatKey in INTEREST_TAG_HIERARCHY) {
      const mainCat = INTEREST_TAG_HIERARCHY[mainCatKey as keyof typeof INTEREST_TAG_HIERARCHY];
      const processTags = (tags: TagType[] | undefined) => {
        const foundTag = tags?.find(t => t.id === tagId);
        if (foundTag) return { label: foundTag.label, icon: foundTag.icon };
        return null;
      };

      if (mainCat.tags) {
        const result = processTags(mainCat.tags);
        if (result) return result;
      }
      if (mainCat.subCategories) {
        for (const subCat of mainCat.subCategories) {
          if (subCat.tags) {
            const result = processTags(subCat.tags);
            if (result) return result;
          }
        }
      }
    }
    return { label: tagId };
  };

  const allInterests: React.ReactNode[] = [];
  (['sports', 'moviesTV', 'news', 'youtube'] as SelectableTagCategoryKey[]).forEach(key => {
    const cat = alert[key] as CategorySpecificPreferences;
    if (cat.selectedTags.length > 0) {
      allInterests.push(...cat.selectedTags.map(tagId => {
        const { label } = getTagDisplayDetails(tagId);
        const categoryColor = INTEREST_TAG_HIERARCHY[key.toUpperCase() as keyof typeof INTEREST_TAG_HIERARCHY]?.color;
        const lightColor = categoryColor ? `${categoryColor}-light` : 'primary-lightest';
        return <DisplayDetailTag key={tagId} label={label} color={lightColor} />;
      }));
    }
  });

  if (alert.customInterestTags.length > 0) {
    allInterests.push(...alert.customInterestTags.map(tag => (
      <DisplayDetailTag key={tag} label={tag} color="accent-teal-light" />
    )));
  }

  const handleNameSave = () => {
    if (alertName.trim() === '') {
      setAlertName(alert.name);
    } else {
      updateAlert(alert.id, { name: alertName.trim() });
    }
    setIsEditingName(false);
  };

  return (
    <SectionCard className="bg-white/95 backdrop-blur-md shadow-xl-dark border border-gray-200/70">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
            <button
              onClick={() => updateAlert(alert.id, { isActive: !alert.isActive })}
              className={`flex-shrink-0 w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${alert.isActive ? 'bg-primary focus:ring-primary' : 'bg-gray-300 focus:ring-gray-400'}`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${alert.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          
          {isEditingName ? (
            <input
              type="text"
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
              className="text-2xl font-semibold text-gray-800 bg-gray-100 rounded-md px-2 -ml-2"
              autoFocus
            />
          ) : (
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              {alert.name}
              <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-primary transition-colors text-sm">
                {ICONS.EDIT}
              </button>
            </h2>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button onClick={() => selectAlertForEditing(alert.id)} variant="outline" size="sm" className="w-full sm:w-auto">{ICONS.EDIT} Edit</Button>
          <Button onClick={() => deleteAlert(alert.id)} variant="ghost" size="sm" className="w-full sm:w-auto text-red-500 hover:bg-red-50">{ICONS.TRASH} Delete</Button>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <strong className="font-medium text-gray-500 text-sm">Status:</strong>
          <span className={`ml-2 font-semibold ${alert.isActive ? 'text-green-700' : 'text-orange-600'}`}>
            {alert.isActive ? 'Active' : 'Paused'}
          </span>
        </div>
        <div>
          <strong className="font-medium text-gray-500 text-sm">Frequency:</strong>
          <span className="ml-2 text-gray-700">
            {alert.frequency}{alert.frequency === 'Custom' && alert.customFrequencyTime ? ` at ${alert.customFrequencyTime}` : ''}
          </span>
        </div>
        {allInterests.length > 0 && (
          <div>
            <strong className="font-medium text-gray-500 text-sm block mb-1.5">Interests:</strong>
            <div className="flex flex-wrap gap-2">
              {allInterests}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

const DashboardPage: React.FC = () => {
  const { user, logout, startNewAlert } = usePreferences();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-lightest via-green-50 to-teal-100 py-10 px-4 sm:px-6 lg:px-8 page-fade-enter">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-secondary tracking-tight">Your Dashboard</h1>
              <p className="text-lg text-gray-600 mt-1">Manage your personalized WhatsApp updates.</p>
            </div>
            <Button onClick={logout} variant="danger" size="md" className="!py-2.5 px-5 shadow-md hover:shadow-lg" leftIcon={ICONS.CANCEL}>
              Logout
            </Button>
          </div>
        </header>

        <div className="mb-8 flex justify-center sm:justify-end">
          <Button onClick={startNewAlert} variant="primary" size="lg" className="w-full sm:w-auto" leftIcon={ICONS.PLUS}>
            Create New Alert
          </Button>
        </div>

        <div className="space-y-6">
          {user.alerts.length > 0 ? (
            user.alerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
          ) : (
            <SectionCard className="text-center py-12">
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Alerts Yet!</h2>
              <p className="text-gray-500 mb-6">Click the button above to create your first personalized alert.</p>
              <Button onClick={startNewAlert} variant="primary" size="md" leftIcon={ICONS.PLUS}>
                Create Your First Alert
              </Button>
            </SectionCard>
          )}
        </div>
        
        <div className="mt-12">
           <SectionCard 
            title="Update History & Analytics" 
            icon={<span className="text-primary text-3xl">📊</span>} 
            className="opacity-80 bg-white/80 backdrop-blur-md shadow-lg border border-gray-200/50 hover:opacity-100"
            titleClassName="!text-xl !text-gray-600"
          >
            <div className="text-center py-5">
              <p className="text-gray-500 font-medium text-lg">Coming Soon!</p>
              <p className="text-gray-500 mt-1">Track updates received and insights into your most engaged topics.</p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
