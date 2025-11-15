
import React from 'react';
import SparklesIcon from './icons/SparklesIcon';

const Header: React.FC = () => {
  return (
    <header className="py-6 text-center border-b border-gray-700">
      <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
        AI Photo Editor
      </h1>
      <p className="mt-2 text-lg text-gray-400 flex items-center justify-center gap-2">
        Powered by Nano Banana <SparklesIcon className="w-5 h-5 text-yellow-300" />
      </p>
    </header>
  );
};

export default Header;
