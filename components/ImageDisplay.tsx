
import React from 'react';
import Loader from './Loader';

interface ImageDisplayProps {
  title: string;
  imageSrc: string | null;
  isLoading?: boolean;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ title, imageSrc, isLoading = false }) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <h3 className="text-xl font-semibold text-gray-300">{title}</h3>
      <div className="aspect-square w-full rounded-lg bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center z-10">
            <Loader />
            <p className="mt-4 text-gray-300">AI is thinking...</p>
          </div>
        )}
        {imageSrc ? (
          <img src={imageSrc} alt={title} className="w-full h-full object-contain" />
        ) : (
          <div className="text-center text-gray-500 p-4">
            <p>Your image will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageDisplay;
