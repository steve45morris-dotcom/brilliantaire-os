export interface AdapterRegistryConfig {
  name: string;
  kind: 'shell' | 'codex' | 'claude' | 'gemini';
}

export const ADAPTER_REGISTRY_CONFIG: AdapterRegistryConfig[] = [
  { name: 'shell', kind: 'shell' },
  { name: 'gemini', kind: 'gemini' },
];
