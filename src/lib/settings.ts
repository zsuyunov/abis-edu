export const ITEM_PER_PAGE = 10

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = {
  "/admin(.*)": ["admin"],
  "/student(.*)": ["student"],
  "/teacher(.*)": ["teacher"],
  "/parent(.*)": ["parent"],
  "/main-director(.*)": ["main_director"],
  "/support-director(.*)": ["support_director"],
  "/list/teachers": ["admin", "teacher", "main_director", "support_director"],
  "/list/students": ["admin", "teacher", "main_director", "support_director"],
  "/list/parents": ["admin", "teacher", "main_director", "support_director"],
  "/list/subjects": ["admin", "main_director", "support_director"],
  "/list/classes": ["admin", "teacher", "main_director", "support_director"],
  "/list/exams": ["admin", "teacher", "student", "parent", "main_director"],
  "/list/assignments": ["admin", "teacher", "student", "parent", "main_director"],
  "/list/results": ["admin", "teacher", "student", "parent", "main_director"],
  "/list/attendance": ["admin", "teacher", "student", "parent", "main_director"],
  "/list/events": ["admin", "teacher", "student", "parent", "main_director"],
  "/list/announcements": ["admin", "teacher", "student", "parent", "main_director"],
};
