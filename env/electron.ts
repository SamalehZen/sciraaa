export const isElectronEnv = typeof window !== 'undefined' 
  && typeof window.electronAPI !== 'undefined';

export const isElectronBuild = process.env.NEXT_PUBLIC_IS_ELECTRON === 'true';

export const getEnvVar = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};
