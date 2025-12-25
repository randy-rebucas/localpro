export type AppPackage =
  | "marketplace"
  | "academy"
  | "ads"
  | "supplies"
  | "rentals"
  | "finance"
  | "facility"
  | "plus"
  | "jobs"
  | "referrals"
  | null;

export type PackageId = Exclude<AppPackage, null>;


