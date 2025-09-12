"use client";

import React, { useState } from 'react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import Image from 'next/image';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'uz' as Language, name: t('language.uzbek'), flag: '🇺🇿' },
    { code: 'ru' as Language, name: t('language.russian'), flag: '🇷🇺' },
    { code: 'en' as Language, name: t('language.english'), flag: '🇺🇸' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Language Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1.5 shadow-sm border border-white/30 hover:shadow-md transition-all duration-200"
      >
        <span className="text-lg">{currentLanguage?.flag}</span>
        <span className="text-xs font-medium text-gray-700 hidden sm:block">
          {currentLanguage?.code.toUpperCase()}
        </span>
        <svg 
          width="10" 
          height="10" 
          viewBox="0 0 24 24" 
          fill="none" 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path 
            d="M6 9L12 15L18 9" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-gray-200 py-2 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 ${
                language === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.name}</span>
              {language === lang.code && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSelector;
