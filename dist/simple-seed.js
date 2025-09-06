"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcryptjs_1 = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var defaultPassword, branch, academicYear, mathSubject, scienceSubject, teacher1, class1, parent1, student1, student2, timetable1, timetable2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, bcryptjs_1.default.hash("admin123", 12)];
                case 1:
                    defaultPassword = _a.sent();
                    // Clear existing data (development only) - in correct order for foreign key constraints
                    return [4 /*yield*/, prisma.attendance.deleteMany()];
                case 2:
                    // Clear existing data (development only) - in correct order for foreign key constraints
                    _a.sent();
                    return [4 /*yield*/, prisma.timetable.deleteMany()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.student.deleteMany()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.parent.deleteMany()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma.class.deleteMany()];
                case 6:
                    _a.sent(); // Delete classes before teachers (supervisor relationship)
                    return [4 /*yield*/, prisma.teacher.deleteMany()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, prisma.subject.deleteMany()];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, prisma.semester.deleteMany()];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, prisma.academicYear.deleteMany()];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, prisma.grade.deleteMany()];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, prisma.branch.deleteMany()];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, prisma.admin.deleteMany()];
                case 13:
                    _a.sent();
                    // ADMIN
                    return [4 /*yield*/, prisma.admin.create({
                            data: {
                                id: "admin1",
                                phone: "+998901234567",
                                password: defaultPassword,
                            },
                        })];
                case 14:
                    // ADMIN
                    _a.sent();
                    return [4 /*yield*/, prisma.branch.create({
                            data: {
                                shortName: "Main Campus",
                                legalName: "Beruniy Maktab Main Campus",
                                stir: "123456789",
                                phone: "+998901234567",
                                region: "Tashkent",
                                address: "123 Education Street, Tashkent, Uzbekistan",
                                district: "Yunusabad",
                                longitude: 69.2401,
                                latitude: 41.2995,
                                status: 'ACTIVE',
                            },
                        })];
                case 15:
                    branch = _a.sent();
                    return [4 /*yield*/, prisma.academicYear.create({
                            data: {
                                name: "".concat(new Date().getFullYear(), "-").concat(new Date().getFullYear() + 1),
                                startDate: new Date("".concat(new Date().getFullYear(), "-09-01")),
                                endDate: new Date("".concat(new Date().getFullYear() + 1, "-08-31")),
                                status: 'ACTIVE',
                                isCurrent: true,
                            },
                        })];
                case 16:
                    academicYear = _a.sent();
                    return [4 /*yield*/, prisma.subject.create({
                            data: { name: "Mathematics" }
                        })];
                case 17:
                    mathSubject = _a.sent();
                    return [4 /*yield*/, prisma.subject.create({
                            data: { name: "Science" }
                        })];
                case 18:
                    scienceSubject = _a.sent();
                    return [4 /*yield*/, prisma.teacher.create({
                            data: {
                                id: "teacher1",
                                teacherId: "T10001",
                                phone: "+998901234568",
                                password: defaultPassword,
                                firstName: "John",
                                lastName: "Teacher",
                                email: "teacher1@example.com",
                                address: "Teacher Address 1",
                                gender: client_1.UserSex.MALE,
                                dateOfBirth: new Date("1990-01-01"),
                                status: client_1.TeacherStatus.ACTIVE,
                            },
                        })];
                case 19:
                    teacher1 = _a.sent();
                    return [4 /*yield*/, prisma.class.create({
                            data: {
                                name: "1A",
                                capacity: 25,
                                branchId: branch.id,
                                academicYearId: academicYear.id,
                                language: 'UZBEK',
                                educationType: 'PRIMARY',
                                supervisorId: teacher1.id,
                                status: 'ACTIVE',
                            },
                        })];
                case 20:
                    class1 = _a.sent();
                    return [4 /*yield*/, prisma.parent.create({
                            data: {
                                id: "parent1",
                                firstName: "Jane",
                                lastName: "Parent",
                                phone: "+998901234569",
                                parentId: "P10001",
                                password: defaultPassword,
                                status: 'ACTIVE',
                            },
                        })];
                case 21:
                    parent1 = _a.sent();
                    return [4 /*yield*/, prisma.student.create({
                            data: {
                                id: "student1",
                                firstName: "Alice",
                                lastName: "Student",
                                studentId: "S10001",
                                phone: "+998901234570",
                                password: defaultPassword,
                                dateOfBirth: new Date("2015-01-01"),
                                gender: client_1.UserSex.FEMALE,
                                status: 'ACTIVE',
                                branchId: branch.id,
                                classId: class1.id,
                                parentId: parent1.id,
                            },
                        })];
                case 22:
                    student1 = _a.sent();
                    return [4 /*yield*/, prisma.student.create({
                            data: {
                                id: "student2",
                                firstName: "Bob",
                                lastName: "Student",
                                studentId: "S10002",
                                phone: "+998901234571",
                                password: defaultPassword,
                                dateOfBirth: new Date("2015-02-01"),
                                gender: client_1.UserSex.MALE,
                                status: 'ACTIVE',
                                branchId: branch.id,
                                classId: class1.id,
                                parentId: parent1.id,
                            },
                        })];
                case 23:
                    student2 = _a.sent();
                    return [4 /*yield*/, prisma.timetable.create({
                            data: {
                                branchId: branch.id,
                                classId: class1.id,
                                academicYearId: academicYear.id,
                                subjectId: mathSubject.id,
                                teacherId: teacher1.id,
                                fullDate: new Date(),
                                day: 'MONDAY',
                                startTime: new Date("2024-01-01T09:00:00Z"),
                                endTime: new Date("2024-01-01T10:00:00Z"),
                                roomNumber: "101",
                                buildingName: "Main Building",
                                status: 'ACTIVE',
                            },
                        })];
                case 24:
                    timetable1 = _a.sent();
                    return [4 /*yield*/, prisma.timetable.create({
                            data: {
                                branchId: branch.id,
                                classId: class1.id,
                                academicYearId: academicYear.id,
                                subjectId: scienceSubject.id,
                                teacherId: teacher1.id,
                                fullDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                                day: 'TUESDAY',
                                startTime: new Date("2024-01-01T10:00:00Z"),
                                endTime: new Date("2024-01-01T11:00:00Z"),
                                roomNumber: "102",
                                buildingName: "Main Building",
                                status: 'ACTIVE',
                            },
                        })];
                case 25:
                    timetable2 = _a.sent();
                    // ATTENDANCE RECORDS
                    return [4 /*yield*/, prisma.attendance.create({
                            data: {
                                studentId: student1.id,
                                timetableId: timetable1.id,
                                date: new Date(),
                                status: 'PRESENT',
                                notes: "Good attendance",
                                archived: false,
                            },
                        })];
                case 26:
                    // ATTENDANCE RECORDS
                    _a.sent();
                    return [4 /*yield*/, prisma.attendance.create({
                            data: {
                                studentId: student2.id,
                                timetableId: timetable1.id,
                                date: new Date(),
                                status: 'LATE',
                                notes: "Arrived 10 minutes late",
                                archived: false,
                            },
                        })];
                case 27:
                    _a.sent();
                    return [4 /*yield*/, prisma.attendance.create({
                            data: {
                                studentId: student1.id,
                                timetableId: timetable2.id,
                                date: new Date(Date.now() + 24 * 60 * 60 * 1000),
                                status: 'ABSENT',
                                notes: "Sick leave",
                                archived: false,
                            },
                        })];
                case 28:
                    _a.sent();
                    console.log("✅ Simple seed completed successfully!");
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
