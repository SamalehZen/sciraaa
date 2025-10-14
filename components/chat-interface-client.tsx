'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const ChatInterfaceLazy = dynamic(
  () => import('@/components/chat-interface').then((m) => m.ChatInterface),
  {
    ssr: false,
    loading: () => <div style={{ minHeight: 240 }} />,
  }
);

export function ChatInterfaceClient() {
  return <ChatInterfaceLazy />;
}
