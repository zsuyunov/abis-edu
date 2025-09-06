import ParentHomeworkContainer from '@/components/ParentHomeworkContainer';
import React from 'react';

const ParentHomeworkPage = () => {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Children&apos;s Homework</h1>
      <ParentHomeworkContainer />
    </div>
  );
};

export default ParentHomeworkPage;
