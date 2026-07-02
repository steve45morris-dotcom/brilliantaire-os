# 🧱 CANONICAL COMPONENT SYSTEM v1.0
`Version: 1.0.0` | `Status: Approved` | `Scope: Component System`

This document defines core React components properties structures, state bindings, and accessibility parameters for **IcyOS**.

---

## 📐 Component Props Contracts (Zustand & Shared Types Mappings)

### 1. `Button`
```typescript
export interface ButtonProps {
  label: string;
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  onClick: () => void;
}
```

### 2. `StatusPill`
```typescript
import { MissionStatus } from '@icyos/shared';
export interface StatusPillProps {
  status: MissionStatus;
}
```

### 3. `TimelineBlock`
```typescript
import { UUID, Timestamp } from '@icyos/shared';
export interface TimelineBlockProps {
  id: UUID;
  missionName: string;
  startTime: Timestamp;
  endTime: Timestamp;
  onClick: () => void;
}
```

### 4. `MissionCard`
```typescript
import { Mission } from '@icyos/shared';
export interface MissionCardProps {
  mission: Mission;
  onSelect: (id: string) => void;
}
```

### 5. `InboxCaptureBox`
```typescript
export interface InboxCaptureBoxProps {
  placeholder?: string;
  onSubmit: (input: string) => void;
  isLoading: boolean;
}
```

### 6. `SessionTimer`
```typescript
export interface SessionTimerProps {
  durationSeconds: number;
  onTick: (remainingSeconds: number) => void;
  onComplete: () => void;
}
```

### 7. `CommandConsole`
```typescript
export interface CommandConsoleProps {
  activeTerminalId: string;
  onExecute: (command: string) => void;
}
```

### 8. `TrustThresholdSlider`
```typescript
export interface TrustThresholdSliderProps {
  currentValue: number;
  minValue?: number;
  maxValue?: number;
  onChange: (value: number) => void;
}
```

---

## 🎨 UI/UX Design System Rules
- **Themes**: Dark-first, high contrast background colors (`#09090b` zinc-950).
- **Fonts**: Monospace typography for console prompts, Inter/Outfit for headings.
- **Accents**: Neon warning cues (`#f43f5e` rose-500, `#10b981` emerald-500).

---

## 📋 Document Metadata
- **Purpose**: Canonical reference sheet for component properties.
- **Version**: 1.0.0
- **Cross References**:
  - [START HERE](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/START%20HERE.md)

*I build before burning.*
