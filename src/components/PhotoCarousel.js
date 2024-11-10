import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from "../utils/utils"; // Ensure the correct path for `cn`

const PhotoCarousel = ({ 
  photos = [], 
  altText = "Photo carousel",
  className,
  showControls = true,
  autoPlay = false,
  interval = 5000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  useEffect(() => {
    if (autoPlay && photos.length > 1) {
      const timer = setInterval(handleNext, interval);
      return () => clearInterval(timer);
    }
  }, [autoPlay, interval, handleNext, photos.length]);

  if (!photos || photos.length === 0) {
    return (
      <div className={cn(
        "relative w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center",
        className
      )}>
        <p className="text-gray-500">No photos available</p>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full group", className)}>
      {/* Current Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <img
          src={photos[currentIndex]}
          alt={`${altText} - ${currentIndex + 1} of ${photos.length}`}
          className="w-full h-full object-cover transition-all"
        />
      </div>

      {/* Navigation Controls */}
      {showControls && photos.length > 1 && (
        <>
          {/* Navigation Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentIndex 
                    ? "bg-white" 
                    : "bg-white/50 hover:bg-white/75"
                )}
                aria-label={`Go to slide ${index + 1} of ${photos.length}`}
                aria-current={index === currentIndex ? 'true' : 'false'}
              />
            ))}
          </div>

          {/* Arrow Buttons */}
          <button
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next photo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
};

export default PhotoCarousel;
