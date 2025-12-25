import type { AppPackage } from "@/contexts/package-switcher-context";

export type PackageId = Exclude<AppPackage, null>;

export interface PackageRegistryEntry {
  id: PackageId;
  label: string;
  /** Primary route for the package/module */
  route: string;
  /** Backend feature catalog id (see PACKAGE_SWITCHER_FEATURE_CATALOG.md) */
  featureId: string;
  /** App settings feature key used for gating in settings.app.features */
  appSettingsKey: string;
}

export const PACKAGE_REGISTRY: Record<PackageId, PackageRegistryEntry> = {
  marketplace: {
    id: "marketplace",
    label: "Marketplace",
    route: "/marketplace",
    featureId: "marketplace",
    appSettingsKey: "marketplace",
  },
  academy: {
    id: "academy",
    label: "Academy",
    route: "/academy",
    featureId: "academy",
    appSettingsKey: "academy",
  },
  ads: {
    id: "ads",
    label: "Ads",
    route: "/ads",
    featureId: "ads",
    appSettingsKey: "ads",
  },
  supplies: {
    id: "supplies",
    label: "Supplies",
    route: "/supplies",
    featureId: "supplies",
    appSettingsKey: "supplies",
  },
  rentals: {
    id: "rentals",
    label: "Rentals",
    route: "/rentals",
    featureId: "rentals",
    appSettingsKey: "rentals",
  },
  finance: {
    id: "finance",
    label: "Finance",
    route: "/finance",
    featureId: "finance",
    appSettingsKey: "finance",
  },
  facility: {
    id: "facility",
    label: "Facility Care",
    route: "/facility-care",
    featureId: "facilityCare",
    appSettingsKey: "facilityCare",
  },
  plus: {
    id: "plus",
    label: "LocalPro Plus",
    route: "/plus",
    featureId: "localproPlus",
    appSettingsKey: "localProPlus",
  },
  jobs: {
    id: "jobs",
    label: "Jobs",
    route: "/jobs",
    featureId: "jobs",
    appSettingsKey: "jobBoard",
  },
  referrals: {
    id: "referrals",
    label: "Referrals",
    route: "/referrals",
    featureId: "referrals",
    appSettingsKey: "referrals",
  },
};

export const PACKAGE_IDS = Object.keys(PACKAGE_REGISTRY) as PackageId[];

export function getPackageEntry(id: AppPackage | null | undefined): PackageRegistryEntry | null {
  if (!id) return null;
  return PACKAGE_REGISTRY[id] || null;
}


