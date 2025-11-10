"use client";

import { MaintenanceMode } from "@/components/maintenance-mode";
import { ForceUpdate } from "@/components/force-update";

export function AppSettingsProvider() {
  return (
    <>
      <MaintenanceMode />
      <ForceUpdate />
    </>
  );
}

