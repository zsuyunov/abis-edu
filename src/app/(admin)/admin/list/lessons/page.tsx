import { redirect } from "next/navigation";

const LessonsRedirectPage = () => {
  redirect("/list/timetables");
};

export default LessonsRedirectPage;
