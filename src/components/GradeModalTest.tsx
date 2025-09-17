"use client";

import React from "react";

interface GradeModalTestProps {
  isOpen: boolean;
  onClose: () => void;
}

const GradeModalTest = ({ isOpen, onClose }: GradeModalTestProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <h1>Test Modal</h1>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default GradeModalTest;
