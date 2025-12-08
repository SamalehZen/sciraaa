'use client';

import { useState } from 'react';
import FormComponent from '../components/ui/form-component';

/**
 * Exemple d'utilisation du composant Chat Input (form-component)
 * 
 * Ce composant montre comment intégrer le chat input dans votre application.
 * Vous devrez adapter les props selon votre implémentation.
 */
export default function ChatInputExample() {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedModel, setSelectedModel] = useState('hyper-google-think');
  const [selectedGroup, setSelectedGroup] = useState('web');
  const [status, setStatus] = useState('ready');

  // Fonction pour envoyer un message
  const sendMessage = (message: any) => {
    console.log('Sending message:', message);
    setMessages([...messages, message]);
    setInput('');
    setStatus('streaming');
    
    // Simuler une réponse après 2 secondes
    setTimeout(() => {
      setStatus('ready');
    }, 2000);
  };

  // Mock user data - à remplacer par vos vraies données
  const mockUser = {
    id: '1',
    email: 'user@example.com',
    name: 'John Doe',
    isProUser: true,
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold mb-8">Exemple Chat Input</h1>

        {/* Messages */}
        <div className="space-y-4 mb-20">
          {messages.map((msg, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-muted">
              {JSON.stringify(msg)}
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <FormComponent
              chatId="example-chat-1"
              user={mockUser}
              input={input}
              setInput={setInput}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              sendMessage={sendMessage}
              status={status}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              selectedGroup={selectedGroup}
              setSelectedGroup={setSelectedGroup}
              // Props optionnelles
              subscriptionData={{ hasSubscription: true }}
              showExperimentalModels={false}
              isLimitBlocked={false}
              onOpenSettings={(tab) => console.log('Open settings:', tab)}
              selectedConnectors={[]}
              setSelectedConnectors={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
