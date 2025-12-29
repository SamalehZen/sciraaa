'use client';

import { useState, useEffect } from 'react';

interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  isElectron: () => Promise<boolean>;
  showNotification: (title: string, body: string) => void;
  copyToClipboard: (text: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    const checkElectron = async () => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        try {
          const isElectronEnv = await window.electronAPI.isElectron();
          setIsElectron(isElectronEnv);
          if (isElectronEnv) {
            const version = await window.electronAPI.getAppVersion();
            const plat = await window.electronAPI.getPlatform();
            setAppVersion(version);
            setPlatform(plat);
          }
        } catch (e) {
          setIsElectron(false);
        }
      }
    };
    checkElectron();
  }, []);

  const showNotification = (title: string, body: string) => {
    if (window.electronAPI) {
      window.electronAPI.showNotification(title, body);
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    }
  };

  const copyToClipboard = (text: string) => {
    if (window.electronAPI) {
      window.electronAPI.copyToClipboard(text);
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  return { isElectron, appVersion, platform, showNotification, copyToClipboard };
}
