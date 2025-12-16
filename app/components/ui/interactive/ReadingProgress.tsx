import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateProgress = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      
      const totalScrollableHeight = documentHeight - windowHeight;
      const currentProgress = totalScrollableHeight > 0 
        ? (scrollTop / totalScrollableHeight) * 100 
        : 0;
      
      setProgress(Math.min(100, Math.max(0, currentProgress)));
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress);
    window.addEventListener('resize', updateProgress);

    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none">
      <motion.div
        className="h-full bg-gradient-to-r from-primary-start via-primary-end to-pink-500"
        style={{
          width: `${progress}%`,
          boxShadow: `0 0 10px rgba(255, 159, 67, 0.5), 0 0 20px rgba(255, 107, 107, 0.3)`,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.1 }}
      />
    </div>
  );
}

