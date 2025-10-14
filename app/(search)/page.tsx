import React from 'react';
import { ChatInterfaceClient } from '@/components/chat-interface-client';
import { InstallPrompt } from '@/components/InstallPrompt';

const Home = () => {
  return (
    <React.Fragment>
      <ChatInterfaceClient />
      <InstallPrompt />
    </React.Fragment>
  );
};

export default Home;
