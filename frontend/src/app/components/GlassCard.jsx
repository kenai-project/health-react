import { cn } from './ui/utils';

const GlassCard = ({ children, className, hover = false, ...props }) => {
  return (
    <div
      className={cn(
        'backdrop-blur-md bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50',
        hover && 'transition-all duration-300 hover:shadow-2xl hover:scale-105',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
