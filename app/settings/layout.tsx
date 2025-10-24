'use client';

import React, { createContext, useState } from 'react';
import { useUser } from '@/contexts/user-context';
import { SettingsSidebar } from '@/components/settings/sidebar';
import type { SettingsTab } from '@/components/settings/types';

export const SettingsContext = createContext<{
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}>({
  activeTab: 'usage',
  setActiveTab: () => {},
});

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState<SettingsTab>('usage');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#121212]">
        <p className="text-[#a0a0a0]">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#121212]">
        <p className="text-[#a0a0a0]">Please sign in to access settings</p>
      </div>
    );
  }

  return (
    <SettingsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="flex h-screen bg-[#121212] overflow-hidden">
        <SettingsSidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </SettingsContext.Provider>
  );
}
