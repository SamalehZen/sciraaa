export type SettingsTab = 'usage' | 'subscription' | 'preferences' | 'connectors' | 'memories';

export interface SettingsContextType {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}
