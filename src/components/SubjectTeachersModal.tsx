"use client";

import { useState } from "react";
import Image from "next/image";

const SubjectTeachersModal = ({
  subject,
}: {
  subject: any;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky hover:bg-lamaSkyLight"
        onClick={() => setOpen(true)}
        title="View Teachers"
      >
        <Image src="/view.png" alt="" width={16} height={16} />
      </button>
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[95%] md:w-[80%] lg:w-[70%] xl:w-[60%] 2xl:w-[50%]">
            <div className="p-4 flex flex-col gap-4 max-w-4xl">
              <span className="text-xl font-medium">
                Teachers for {subject.name}
              </span>
              
              {(!subject.TeacherAssignment || subject.TeacherAssignment.length === 0) ? (
                <p className="text-gray-500">No teachers assigned to this subject.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-gray-600 mb-2">
                    Total: {subject.TeacherAssignment.length} teacher(s)
                  </p>
                  <div className="max-h-60 overflow-y-auto">
                    {subject.TeacherAssignment.map((assignment: any) => {
                      const teacher = assignment.Teacher;
                      const branch = assignment.Branch;
                      const classInfo = assignment.Class;
                      return (
                      <div 
                        key={`${teacher.id}-${assignment.Branch?.id}-${assignment.Class?.id}`} 
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <Image
                          src="/noAvatar.png"
                          alt=""
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex flex-col flex-1">
                          <span className="font-medium text-sm">
                            {teacher.firstName} {teacher.lastName}
                          </span>
                          <span className="text-xs text-gray-500 mb-1">
                            {teacher.teacherId}
                          </span>
                          {branch && (
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-xs text-gray-600 font-medium">Branch:</span>
                              <span className="text-xs text-gray-700">
                                {branch.shortName} - {branch.district}
                              </span>
                            </div>
                          )}
                          {classInfo && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-600 font-medium">Class:</span>
                              <span className="text-xs text-gray-700">
                                {classInfo.name}
                                {classInfo.academicYear && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    ({classInfo.academicYear.name}{classInfo.academicYear.isCurrent && " - Current"})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-auto">
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {assignment.role}
                          </span>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubjectTeachersModal;
