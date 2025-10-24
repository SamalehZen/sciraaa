'use client';

import React, { useState, useContext } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Analytics01Icon,
  Crown02Icon,
  Settings02Icon,
  ConnectIcon,
  Brain02Icon,
  UserAccountIcon,
  InformationCircleIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Heart,
  LogOut,
  Mail,
} from 'lucide-react';
import { SettingsContext } from '@/app/settings/layout';
import { toast } from 'sonner';
import type { SettingsTab } from './types';

interface SettingsSidebarProps {
  user: any;
}

const navItems: Array<{ id: SettingsTab; label: string; icon: any }> = [
  { id: 'usage', label: 'Usage', icon: Analytics01Icon },
  { id: 'subscription', label: 'Subscription', icon: Crown02Icon },
  { id: 'preferences', label: 'Preferences', icon: Settings02Icon },
  { id: 'connectors', label: 'Connectors', icon: ConnectIcon },
  { id: 'memories', label: 'Memories', icon: Brain02Icon },
];

const utilityIcons = [
  { icon: UserAccountIcon, label: 'Account', action: () => {} },
  { icon: Mail, label: 'Support', action: () => window.open('mailto:support@scira.ai') },
  { icon: InformationCircleIcon, label: 'Info', action: () => {} },
  { icon: Heart, label: 'Feedback', action: () => {} },
];

export function SettingsSidebar({ user }: SettingsSidebarProps) {
  const { activeTab, setActiveTab } = useContext(SettingsContext);
  const router = useRouter();
  const [blurPersonalInfo, setBlurPersonalInfo] = useState(false);

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.firstName
      ? user.firstName[0].toUpperCase()
      : 'U';

  const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name || 'User';
  const userEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || user?.email || '';

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="w-64 bg-[#0d0d0d] border-r border-[#333333] flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 border-b border-[#333333]">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <Avatar className="h-[120px] w-[120px]">
                <AvatarImage src={user?.profileImageUrl || ''} />
                <AvatarFallback className="text-2xl bg-[#7CB342] text-white font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-1 w-full">
              <h3 className="text-white font-bold text-xl">{userName}</h3>
              <p className="text-[#a0a0a0] text-sm line-clamp-2">{userEmail}</p>
            </div>

            <div className="w-full pt-3 space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#1e1e1e] rounded-lg">
                <Label htmlFor="blur-info" className="text-xs font-medium cursor-pointer">
                  Blur personal info
                </Label>
                <Switch
                  id="blur-info"
                  checked={blurPersonalInfo}
                  onCheckedChange={setBlurPersonalInfo}
                />
              </div>

              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full bg-[#333333] text-white border-0 hover:bg-[#444444]"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeTab === item.id
                  ? 'bg-[#1e1e1e] text-white'
                  : 'text-[#a0a0a0] hover:bg-[rgba(255,255,255,0.05)]'
              )}
            >
              <HugeiconsIcon icon={item.icon} size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-[#333333] space-y-2">
        {utilityIcons.map((util, idx) => (
          <button
            key={idx}
            onClick={util.action}
            className="w-full p-2.5 rounded-lg text-[#a0a0a0] hover:bg-[rgba(255,255,255,0.05)] transition-all flex items-center justify-center"
            title={util.label}
          >
            {typeof util.icon === 'function' ? (
              <HugeiconsIcon icon={util.icon} size={18} />
            ) : (
              <util.icon className="h-[18px] w-[18px]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
