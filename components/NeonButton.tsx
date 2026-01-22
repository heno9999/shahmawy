import React from 'react';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
}

export const NeonButton: React.FC<NeonButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyle = "relative flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-lg transition-all duration-300 transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0";
  
  const variants = {
    primary: "bg-shahm-panel border border-shahm-neon text-shahm-neon shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:bg-shahm-neon hover:text-shahm-dark hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]",
    secondary: "bg-transparent border border-shahm-accent text-shahm-accent hover:bg-shahm-accent hover:text-shahm-dark hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]",
    danger: "bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      {...props}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      {children}
    </button>
  );
};