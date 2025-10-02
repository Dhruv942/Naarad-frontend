import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  steps: string[];
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep, steps }) => {
  return (
    <nav aria-label="Progress" className="mb-10">
      <div className="flex items-start w-full max-w-2xl mx-auto">
        {steps.map((stepName, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          return (
            <React.Fragment key={stepName}>
              <div className="flex flex-col items-center text-center flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300
                  ${isCompleted ? 'bg-primary text-white' : ''}
                  ${isCurrent ? 'bg-primary text-white ring-4 ring-primary/30' : ''}
                  ${!isCompleted && !isCurrent ? 'bg-gray-600 text-gray-300' : ''}
                `}>
                  {isCompleted ? (
                     <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : stepNumber}
                </div>
                <p className={`mt-2 text-xs sm:text-sm font-medium w-24 sm:w-28 transition-colors duration-300 ${isCurrent ? 'text-primary-lighter font-semibold' : 'text-primary-lighter/70'}`}>
                  {stepName}
                </p>
              </div>
              {stepNumber < steps.length && (
                 <div className={`flex-1 h-1 mt-5 mx-1 sm:mx-2 transition-colors duration-500 ${isCompleted ? 'bg-primary' : 'bg-gray-700'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </nav>
  );
};

export default ProgressIndicator;
