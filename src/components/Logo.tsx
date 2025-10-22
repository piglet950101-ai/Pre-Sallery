import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'light', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-12',
    md: 'h-16', 
    lg: 'h-20',
    xl: 'h-24'
  };

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo Image Only */}
      <img 
        src="/logo/logo2.png" 
        alt="nominero logo" 
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
    </div>
  );
};

export default Logo;
