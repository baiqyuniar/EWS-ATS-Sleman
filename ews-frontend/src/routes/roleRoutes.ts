import type { UserRole } from "../types/api";

export function defaultRouteForRole(role: UserRole): string {
  switch (role) {
    case "ADMIN":
    case "DINAS_PENDIDIKAN":
      return "/dashboard";
    case "OPD":
      return "/dashboard/dinas";
    case "SEKOLAH":
      return "/dashboard/school";
    case "KAPANEWON":
      return "/dashboard/kapanewon";
    default:
      return "/dashboard";
  }
}
