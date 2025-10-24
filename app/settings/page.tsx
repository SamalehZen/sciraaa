'use client';

import React, { useContext } from 'react';
import { useUser } from '@/contexts/user-context';
import { useQuery } from '@tanstack/react-query';
import { getSubDetails } from '@/app/actions';
import { SettingsContent } from '@/components/settings/content';
import { SettingsContext } from './layout';

export default function SettingsPage() {
  const { user } = useUser();
  const { activeTab } = useContext(SettingsContext);

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscriptionData', user?.id],
    queryFn: () => getSubDetails(),
    enabled: !!user,
  });

  return (
    <SettingsContent
      user={user}
      subscriptionData={subscriptionData}
      activeTab={activeTab}
    />
  );
}
