"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const AcademicYearSetCurrentModal = ({
  data,
}: {
  data?: any;
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSetCurrent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/academic-years/${data.id}/set-current`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success(`${data.name} has been set as the current academic year!`);
        setOpen(false);
        router.refresh();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to set current academic year');
      }
    } catch (error) {
      console.error('Error setting current academic year:', error);
      toast.error('Failed to set current academic year');
    } finally {
      setLoading(false);
    }
  };

  if (data?.isCurrent) {
    return (
      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
        Current
      </span>
    );
  }

  if (data?.status !== "ACTIVE") {
    return null;
  }

  return (
    <>
      <button
        className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500"
        onClick={() => setOpen(true)}
        title="Set as Current Academic Year"
      >
        <Image src="/star.png" alt="" width={16} height={16} />
      </button>
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]">
            <div className="flex flex-col gap-6">
              <h1 className="text-xl font-semibold">
                Set Current Academic Year
              </h1>
              
              <div className="border-l-4 bg-blue-50 border-blue-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Confirmation:</strong> You are about to set &quot;{data.name}&quot; as the current academic year.
                    </p>
                    <p className="text-xs mt-1 text-blue-600">
                      This will remove the current status from all other academic years and make this one active for new enrollments.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Academic Year Details:</h3>
                <div className="text-sm text-gray-600">
                  <p><strong>Name:</strong> {data.name}</p>
                  <p><strong>Start Date:</strong> {new Date(data.startDate).toLocaleDateString()}</p>
                  <p><strong>End Date:</strong> {new Date(data.endDate).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> <span className="capitalize">{data.status}</span></p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-gray-400 text-white p-2 rounded-md hover:bg-gray-500"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSetCurrent}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Setting..." : "Set as Current"}
                </button>
              </div>
            </div>
            
            <div
              className="absolute top-4 right-4 cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-full p-2 z-10"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={16} height={16} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AcademicYearSetCurrentModal;
