import path from "path";

/** 服务端数据目录；Zeabur 可挂载持久卷并设置 STUDENT_DATA_DIR=/data */
export function getStudentDataDir(): string {
  const configured = process.env.STUDENT_DATA_DIR?.trim();
  if (configured) return configured;
  return path.join(process.cwd(), "data");
}

export function getStudentDataFilePath(): string {
  return path.join(getStudentDataDir(), "student-data.json");
}

export function getStudentGrowthFilePath(): string {
  return path.join(getStudentDataDir(), "student-growth.json");
}

export function getStudentProfileFilePath(): string {
  return path.join(getStudentDataDir(), "student-profile.json");
}
