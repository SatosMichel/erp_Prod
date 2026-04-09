import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function Tooltip({ text, children, icon = true, className, position = "top" }) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2"
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent border-[6px]",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent border-[6px]",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent border-[6px]",
    right: "right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent border-[6px]"
  };

  return (
    <div 
      className="relative inline-flex items-center group cursor-help ml-2 align-middle"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      {children}
      {icon && !children && <Info className={twMerge("w-4 h-4 text-slate-400 hover:text-blue-400 transition-colors", className)} />}
      
      {isVisible && (
        <div className={`absolute z-50 w-56 p-2 text-xs font-normal text-white bg-gray-800 rounded-md shadow-lg ${positionClasses[position]}`}>
          <div className={`absolute w-0 h-0 ${arrowClasses[position]}`}></div>
          {text}
        </div>
      )}
    </div>
  );
}
