import React, { ReactNode } from 'react';

interface SectionCardProps {
  title?: string; // Title is now optional
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
  onClick?: () => void;
  headerActions?: ReactNode; // For buttons or other elements in the header
}

const SectionCard: React.FC<SectionCardProps> = ({ 
    title, 
    icon, 
    children, 
    className = "", 
    titleClassName = "",
    onClick,
    headerActions 
}) => {
  return (
    <div 
      className={`bg-white shadow-card rounded-xl p-6 md:p-8 mb-6 transition-all duration-200 hover:shadow-xl ${onClick ? 'clickable' : ''} ${className}`}
      onClick={onClick}
    >
      {(title || icon || headerActions) && (
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center">
            {icon && <span className="text-3xl mr-3.5 text-primary">{icon}</span>}
            {title && <h2 className={`text-2xl font-semibold text-gray-800 ${titleClassName}`}>{title}</h2>}
          </div>
          {headerActions && <div className="w-full sm:w-auto">{headerActions}</div>}
        </div>
      )}
      <div className="space-y-6"> {/* Increased space-y from 5 to 6, or kept if already 6 */}
        {children}
      </div>
    </div>
  );
};

export default SectionCard;