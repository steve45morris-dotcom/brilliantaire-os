# 📐 CANONICAL TYPE SYSTEM v1.0
`Version: 1.0.0` | `Status: Approved` | `Scope: Type System`

TypeScript contracts and interfaces for all core entities, API payload wrappers, RPC parameters, and realtime events.

---

## 🏛️ Core TypeScript Primitive Types
```typescript
export type UUID = string;
export type Timestamp = string;
```

---

## 🧱 Value Object Types
```typescript
export type Priority = 'P1' | 'P2' | 'P3';
export type EnergyLevel = 'High' | 'Medium' | 'Resting';
export type TimeEstimate = { estimatedMin: number; maximumMin: number };
export type FocusScore = number; // 0 - 100
export type CompletionScore = number; // 0 - 100
export type ConfidenceScore = number; // 0.0 - 1.0
export type MissionStatus = 'Staged' | 'Approved' | 'Running' | 'Completed' | 'Skipped' | 'Failed';
export type SessionStatus = 'Active' | 'Wrapped' | 'Failing';
export type TrustLevel = number; // 0.0 - 1.0
```

---

## 🏛️ Domain Entity Interfaces

### 1. User
```typescript
export interface User {
  readonly id: UUID;
  name: string;
  timezone?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 2. Workspace
```typescript
export interface Workspace {
  readonly id: UUID;
  user_id: UUID;
  root_path: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 3. Project
```typescript
export interface Project {
  readonly id: UUID;
  workspace_id: UUID;
  name: string;
  priority: Priority;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 4. Mission
```typescript
export interface Mission {
  readonly id: UUID;
  sprint_id: UUID;
  name: string;
  status: MissionStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 5. Action
```typescript
export interface Action {
  readonly id: UUID;
  mission_id: UUID;
  command: string;
  created_at: Timestamp;
}
```

### 6. Session
```typescript
export interface Session {
  readonly id: UUID;
  workspace_id: UUID;
  status: SessionStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

## 📨 API Communication Types

### Response Envelope
```typescript
export interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: {
    request_id: string;
    timestamp: Timestamp;
    version: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any[];
}
```

---

## 🔌 RPC Parameter Interfaces

### `generate_daily_plan`
```typescript
export interface GenerateDailyPlanInput {
  user_id: UUID;
}
export interface GenerateDailyPlanOutput {
  plan_json: any;
}
```

### `approve_timeline`
```typescript
export interface ApproveTimelineInput {
  timeline_id: UUID;
  user_id: UUID;
}
export interface ApproveTimelineOutput {
  success: boolean;
}
```

---

## 📡 Realtime Event Type Interfaces

```typescript
export interface MissionStartedEvent {
  topic: 'mission.started';
  payload: {
    mission_id: UUID;
    timestamp: Timestamp;
  };
}

export interface MissionCompletedEvent {
  topic: 'mission.completed';
  payload: {
    mission_id: UUID;
    review_id: UUID;
    timestamp: Timestamp;
  };
}
```

---

## 📋 Document Metadata
- **Purpose**: Canonical reference sheet for Type systems.
- **Version**: 1.0.0
- **Cross References**:
  - [START HERE](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/START%20HERE.md)

*I build before burning.*
