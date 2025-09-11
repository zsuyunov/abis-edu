import { redirect } from "next/navigation";

const LessonsRedirectPage = () => {
  redirect("/admin/list/timetables");
};

export default LessonsRedirectPage;
