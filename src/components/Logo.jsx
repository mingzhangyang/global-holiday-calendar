import React from 'react';
import { CalendarIcon } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';

const Logo = ({ 
  size = 'medium', 
  showText = true, 
  className = '',
  useImage = false,
  logoFormat = 'svg', // 'svg', 'png', or 'icon'
  titleAs = 'h1'
}) => {
  const { t } = useTranslation();
  const sizeClasses = {
    small: {
      icon: 20,
      text: 'text-sm',
      container: 'space-x-2'
    },
    medium: {
      icon: 32,
      text: 'text-xl md:text-2xl lg:text-3xl',
      container: 'space-x-3'
    },
    large: {
      icon: 48,
      text: 'text-2xl md:text-3xl lg:text-4xl',
      container: 'space-x-4'
    }
  };

  const currentSize = sizeClasses[size];
  const TitleTag = titleAs;

  const getLogoSrc = () => {
    if (logoFormat === 'svg') return '/logo.svg';
    if (logoFormat === 'png') return '/logo.png';
    return '/logo.png'; // fallback
  };

  return (
    <div className={`flex items-center ${currentSize.container} ${className}`}>
      <div className="flex shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/12 p-2 shadow-lg backdrop-blur-md">
        {useImage ? (
          logoFormat === 'svg' ? (
            <img 
              src={getLogoSrc()}
              alt={t('app.title')}
              className={`flex-shrink-0`}
              style={{ 
                width: currentSize.icon, 
                height: currentSize.icon,
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.12))'
              }}
            />
          ) : (
            <img 
              src={getLogoSrc()}
              alt={t('app.title')}
              className="object-contain flex-shrink-0 rounded-xl"
              style={{ 
                width: currentSize.icon, 
                height: currentSize.icon,
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
              }}
            />
          )
        ) : (
          <CalendarIcon 
            size={currentSize.icon} 
            className="flex-shrink-0" 
            aria-hidden="true" 
          />
        )}
      </div>
      
      {showText && (
        <div className="text-center sm:text-left">
          <TitleTag 
            className={`${currentSize.text} font-bold tracking-tight`}
          >
            {t('app.title')}
          </TitleTag>
          {size === 'medium' || size === 'large' ? (
            <p 
              className="mt-1 text-xs text-white/70 md:text-sm"
            >
              {t('app.subtitle')}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default React.memo(Logo);
