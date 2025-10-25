import { Suspense } from "react";
import SettingsPageClient from "./client";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SettingsPageClient />
    </Suspense>
  );
}
