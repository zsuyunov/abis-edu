"use client";

const StudentGenderIcons = () => {
  return (
    <div className="flex items-center justify-center space-x-4">
      {/* Male Student Icon - Dark Blue */}
      <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="9" r="4" fill="#2563EB" />
        <path d="M16 18c-5 0-8 3-8 6v4h16v-4c0-3-3-6-8-6z" fill="#2563EB" />
        <path d="M22 4h4v4M22 8l4-4" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      
      {/* Female Student Icon - Light Blue */}
      <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="9" r="4" fill="#60A5FA" />
        <path d="M16 18c-5 0-8 3-8 6v4h16v-4c0-3-3-6-8-6z" fill="#60A5FA" />
        <path d="M16 24v4M14 28h4" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export default StudentGenderIcons;
