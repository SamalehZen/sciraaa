'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  UsageSection,
  SubscriptionSection,
  PreferencesSection,
  ConnectorsSection,
  MemoriesSection,
} from '@/components/settings-dialog';
import { Sun, Moon, MessageSquare, Settings } from 'lucide-react';
import type { SettingsTab } from './types';

interface SettingsContentProps {
  user: any;
  subscriptionData?: any;
  activeTab: SettingsTab;
}

export function SettingsContent({
  user,
  subscriptionData,
  activeTab,
}: SettingsContentProps) {
  const renderContent = () => {
    if (!user) {
      return <div className="text-[#a0a0a0]">Loading...</div>;
    }

    switch (activeTab) {
      case 'usage':
        return <UsageSection user={user} />;
      case 'subscription':
        return (
          <SubscriptionSection
            user={user}
            subscriptionData={subscriptionData}
            isProUser={user?.isProUser}
          />
        );
      case 'preferences':
        return <PreferencesSection user={user} />;
      case 'connectors':
        return <ConnectorsSection user={user} />;
      case 'memories':
        return <MemoriesSection />;
      default:
        return <UsageSection user={user} />;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'usage':
        return 'Usage Statistics';
      case 'subscription':
        return 'Subscription';
      case 'preferences':
        return 'Preferences';
      case 'connectors':
        return 'Connectors';
      case 'memories':
        return 'Memories';
      default:
        return 'Settings';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] overflow-hidden">
      <header className="border-b border-[#333333] px-8 py-6 flex items-center justify-between flex-shrink-0">
        <h1 className="text-3xl font-bold text-white">{getTabTitle()}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-[#a0a0a0] hover:text-white hover:bg-[rgba(255,255,255,0.1)]"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#a0a0a0] hover:text-white hover:bg-[rgba(255,255,255,0.1)]"
          >
            <Sun className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#a0a0a0] hover:text-white hover:bg-[rgba(255,255,255,0.1)]"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 overflow-hidden">
        <div className="px-8 py-6 text-white">
          {renderContent()}
        </div>
      </ScrollArea>
    </div>
  );
}
