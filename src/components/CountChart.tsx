"use client";
import Image from "next/image";
import TeacherGenderIcons from "./TeacherGenderIcons";
import StudentGenderIcons from "./StudentGenderIcons";
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
} from "recharts";


const CountChart = ({ boys, girls, isTeacher = false }: { boys: number; girls: number; isTeacher?: boolean }) => {
  const data = [
    {
      name: "Total",
      count: boys+girls,
      fill: "white",
    },
    {
      name: isTeacher ? "Female" : "Girls",
      count: girls,
      fill: isTeacher ? "#60A5FA" : "#22D3EE", // Blue-400 for teachers, cyan for students
    },
    {
      name: isTeacher ? "Male" : "Boys",
      count: boys,
      fill: isTeacher ? "#7C3AED" : "#3B82F6", // Purple for teachers, blue for students
    },
  ];
  return (
    <div className="relative w-full h-[75%]">
      <ResponsiveContainer>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="40%"
          outerRadius="100%"
          barSize={32}
          data={data}
        >
          <RadialBar background dataKey="count" />
        </RadialBarChart>
      </ResponsiveContainer>
      {isTeacher ? (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <TeacherGenderIcons />
        </div>
      ) : (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <StudentGenderIcons />
        </div>
      )}
    </div>
  );
};

export default CountChart;
