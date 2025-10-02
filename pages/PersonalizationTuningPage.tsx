import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { usePreferences } from '../contexts/PreferencesContext';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import WhatsAppPreview from '../components/common/WhatsAppPreview';
import ProgressIndicator from '../components/common/ProgressIndicator';
import { ICONS, PagePath } from '../constants';
import { generateTuningSamples } from '../services/geminiService';
import { SampleMessage, Alert } from '../types';

// A self-contained, animated card for providing feedback
const TuningCard: React.FC<{
  message: SampleMessage;
  onFeedback: (direction: 'like' | 'dislike') => void;
  isExiting: 'like' | 'dislike' | null;
  isInitial: boolean;
}> = ({ message, onFeedback, isExiting, isInitial }) => {
  const animationClass = 
    isExiting ? (isExiting === 'like' ? 'animate__animated animate__rotateOutUpRight' : 'animate__animated animate__rotateOutUpLeft') :
    isInitial ? 'animate__animated animate__fadeInUp' : '';

  return (
    <div 
      className={`absolute inset-0 flex flex-col items-center justify-between p-3 sm:p-4 bg-gray-800/60 rounded-2xl shadow-2xl-dark border border-white/10 backdrop-blur-sm ${animationClass}`}
      style={{ animationDuration: '0.6s' }}
    >
      <div className="w-full">
        <WhatsAppPreview message={message} />
      </div>
      <div className="flex justify-center items-center gap-6 mt-4 w-full">
        <Button 
          onClick={() => onFeedback('dislike')} 
          className="bg-white/10 hover:bg-red-500/80 border-2 border-red-500/50 text-white !w-28 !h-28 !rounded-full shadow-xl-dark transform hover:scale-110 transition-all duration-300 flex-col gap-1"
          aria-label="Not my Vibe"
        >
          <span className="text-4xl" role="img" aria-hidden="true">👎</span>
          <span className="text-xs font-bold tracking-wider">DISLIKE</span>
        </Button>
        <Button 
          onClick={() => onFeedback('like')} 
          className="bg-white/10 hover:bg-green-500/80 border-2 border-green-500/50 text-white !w-28 !h-28 !rounded-full shadow-xl-dark transform hover:scale-110 transition-all duration-300 flex-col gap-1"
          aria-label="Liked It"
        >
          <span className="text-4xl" role="img" aria-hidden="true">👍</span>
          <span className="text-xs font-bold tracking-wider">LIKE</span>
        </Button>
      </div>
    </div>
  );
};

const PersonalizationTuningPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeAlert, setActiveAlert, user } = usePreferences();
  const [cards, setCards] = useState<SampleMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exitDirection, setExitDirection] = useState<'like' | 'dislike' | null>(null);
  const [isInitialCard, setIsInitialCard] = useState(true);

  const MIN_FEEDBACK_COUNT = 3;

  useEffect(() => {
    if (!activeAlert) {
      navigate(PagePath.DASHBOARD);
      return;
    }

    const fetchCards = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const tuningSamples = await generateTuningSamples(activeAlert, user);
        if (tuningSamples.length < MIN_FEEDBACK_COUNT) {
          setError("Couldn't generate enough samples for tuning. Using fallbacks.");
          const fallbacksNeeded = MIN_FEEDBACK_COUNT - tuningSamples.length;
          const fallbackCards = Array(fallbacksNeeded).fill(0).map((_, i) => ({
            summaryText: `This is a fallback sample message #${i+1} as we couldn't generate enough variety for your choices.`,
            imageUrl: "⚙️",
            actionText: "Explore More"
          }));
          setCards([...tuningSamples, ...fallbackCards]);
        } else {
          setCards(tuningSamples);
        }
      } catch (e) {
        setError("An error occurred while preparing your tuning feed.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCards();
  }, [activeAlert, user, navigate]);

  const handleFeedback = (direction: 'like' | 'dislike') => {
    if (!activeAlert || currentIndex >= cards.length || exitDirection) return;

    setExitDirection(direction);
    const currentCard = cards[currentIndex];

    setActiveAlert((prev) => {
      if (!prev) return null;
      const updatedFeedback = { ...(prev.tuningFeedback || { liked: [], disliked: [] }) };
      if (direction === 'like') {
        updatedFeedback.liked.push(currentCard.summaryText);
      } else {
        updatedFeedback.disliked.push(currentCard.summaryText);
      }
      return { ...prev, tuningFeedback: updatedFeedback };
    });

    setTimeout(() => {
      setFeedbackCount(prev => prev + 1);
      setCurrentIndex(prev => prev + 1);
      setExitDirection(null);
      if (isInitialCard) {
        setIsInitialCard(false);
      }
    }, 600); // Match animation duration
  };
  
  if (!activeAlert) {
    return <Navigate to={PagePath.DASHBOARD} replace />;
  }
  
  const isTuningComplete = feedbackCount >= MIN_FEEDBACK_COUNT;
  const currentCard = cards[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-secondary-dark to-gray-900 text-white page-fade-enter flex flex-col">
      <div className="w-full max-w-xl mx-auto py-10 px-4 sm:px-6 lg:px-8 flex-grow flex flex-col">
        <ProgressIndicator currentStep={2} steps={['Select Interests', 'Fine-Tune Feed', 'Set Cadence']} />
        
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Fine-Tune Your Feed</h1>
          <p className="text-base sm:text-lg text-primary-lighter/80 mt-3">
            Help us learn your taste. Tell us what you think of these AI-generated samples.
          </p>
        </header>

        <div className="flex-grow w-full flex flex-col items-center justify-center py-4">
          <div className={`relative w-full max-w-sm transition-height duration-500 ease-in-out-sine ${isLoading ? 'h-64' : 'h-[600px] sm:h-[650px]'}`}>
            {isLoading && <div className="absolute inset-0 flex items-center justify-center"><LoadingSpinner text="Generating personalized samples..." size="lg" /></div>}
            {error && !isLoading && <div className="absolute inset-0 flex items-center justify-center"><p className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</p></div>}
            
            {!isLoading && !error && (
              <>
                {/* Card Deck visual effect */}
                {currentIndex + 2 < cards.length && !isTuningComplete && (
                  <div className="absolute inset-0 bg-white/5 p-3 rounded-2xl shadow-xl transition-all duration-300" style={{ transform: 'scale(0.9)', top: '30px' }}>
                    <div className="w-full h-full bg-gray-700/50 rounded-xl"></div>
                  </div>
                )}
                {currentIndex + 1 < cards.length && !isTuningComplete && (
                  <div className="absolute inset-0 bg-white/10 p-3 rounded-2xl shadow-2xl transition-all duration-300" style={{ transform: 'scale(0.95)', top: '15px' }}>
                    <div className="w-full h-full bg-gray-800/50 rounded-xl"></div>
                  </div>
                )}

                {/* Top card */}
                {currentCard && !isTuningComplete && (
                  <TuningCard 
                    message={currentCard} 
                    onFeedback={handleFeedback}
                    isExiting={exitDirection}
                    isInitial={isInitialCard}
                  />
                )}

                {/* Completion message */}
                {isTuningComplete && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center animate__animated animate__fadeIn p-8 bg-white/10 rounded-2xl shadow-2xl-dark border border-white/10 backdrop-blur-sm">
                      <span className="text-6xl mb-4 block" role="img" aria-label="Checkmark">✅</span>
                      <h2 className="text-2xl font-semibold text-primary">Great! We've got it.</h2>
                      <p className="text-primary-lighter/80 mt-2">Your preferences are saved. Proceed to the final step to set your update frequency.</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
        
      <div className="sticky bottom-0 z-10 p-4 bg-gray-950/90 backdrop-blur-sm border-t border-primary-lighter/20">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => navigate(PagePath.INTERESTS)} 
            className="w-full sm:w-auto text-primary-lighter/80 hover:text-white"
            leftIcon={ICONS.ARROW_LEFT}
          >
            Back to Interests
          </Button>
          <div className="relative group w-full sm:w-auto">
            <Button 
              type="button" 
              variant="primary" 
              size="lg"
              onClick={() => navigate(PagePath.FREQUENCY)}
              disabled={!isTuningComplete}
              className="w-full disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              rightIcon={ICONS.ARROW_RIGHT}
            >
              Next: Set Cadence ({Math.min(feedbackCount, MIN_FEEDBACK_COUNT)}/{MIN_FEEDBACK_COUNT})
            </Button>
            {!isTuningComplete && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                Please rate {MIN_FEEDBACK_COUNT} samples to continue.
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizationTuningPage;