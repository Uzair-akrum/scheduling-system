"use client";

import { useSyncExternalStore } from "react";
import { isClientShowcaseMode } from "@/lib/showcase";

export interface ShowcaseWorker {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "SUPERVISOR" | "WORKER";
  skills: string[];
  phone: string | null;
  isActive: boolean;
  createdAt: Date | string;
  _count: {
    shiftSignups: number;
  };
}

export interface ShowcaseStation {
  id: string;
  name: string;
  description: string | null;
  category: string;
  capacity: number;
  location: string | null;
  status: "ACTIVE" | "MAINTENANCE" | "OFFLINE";
  requiredSkills: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  _count: {
    shifts: number;
  };
}

export interface ShowcaseShift {
  id: string;
  title: string;
  workStationId: string;
  startTime: Date | string;
  endTime: Date | string;
  capacity: number;
  notes: string | null;
  isRecurring: boolean;
  recurrenceRule: string | null;
  recurrenceEnd: Date | string | null;
  parentShiftId: string | null;
  originalDate: Date | string | null;
  isCancelled: boolean;
  createdById: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  workStation: {
    id: string;
    name: string;
    category: string;
  };
  _count: {
    signups: number;
  };
}

export interface ShowcaseMyShift {
  id: string;
  status: string;
  occurrenceDate: string | null;
  createdAt: string;
  shift: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    workStation: {
      name: string;
      category: string;
    };
  };
}

type State = {
  workersCreated: ShowcaseWorker[];
  workersUpdated: Record<string, Partial<ShowcaseWorker>>;
  workersDeleted: Set<string>;

  stationsCreated: ShowcaseStation[];
  stationsUpdated: Record<string, Partial<ShowcaseStation>>;
  stationsDeleted: Set<string>;

  shiftsCreated: ShowcaseShift[];
  shiftsUpdated: Record<string, Partial<ShowcaseShift>>;
  shiftsDeleted: Set<string>;

  myShiftCreated: ShowcaseMyShift[];
  myShiftCancelledKeys: Set<string>;
};

const state: State = {
  workersCreated: [],
  workersUpdated: {},
  workersDeleted: new Set(),

  stationsCreated: [],
  stationsUpdated: {},
  stationsDeleted: new Set(),

  shiftsCreated: [],
  shiftsUpdated: {},
  shiftsDeleted: new Set(),

  myShiftCreated: [],
  myShiftCancelledKeys: new Set(),
};

const listeners = new Set<() => void>();
let version = 0;

function notify() {
  version += 1;
  for (const listener of listeners) {
    listener();
  }
}

function tmpId(prefix: string) {
  return `tmp_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function subscribeShowcase(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useShowcaseStoreVersion() {
  return useSyncExternalStore(subscribeShowcase, () => version, () => 0);
}

export function mergeWorkers<T extends ShowcaseWorker>(baseline: T[]): T[] {
  if (!isClientShowcaseMode()) {
    return baseline;
  }

  const visible = baseline
    .filter((worker) => !state.workersDeleted.has(worker.id))
    .map((worker) => ({ ...worker, ...state.workersUpdated[worker.id] }));

  return [...visible, ...(state.workersCreated as T[])];
}

export function createShowcaseWorker(input: Omit<ShowcaseWorker, "id" | "createdAt" | "_count">) {
  if (!isClientShowcaseMode()) {
    return;
  }

  state.workersCreated.push({
    ...input,
    id: tmpId("worker"),
    createdAt: new Date().toISOString(),
    _count: { shiftSignups: 0 },
  });
  notify();
}

export function updateShowcaseWorker(id: string, patch: Partial<ShowcaseWorker>) {
  if (!isClientShowcaseMode()) {
    return;
  }

  const createdIdx = state.workersCreated.findIndex((worker) => worker.id === id);
  if (createdIdx >= 0) {
    state.workersCreated[createdIdx] = {
      ...state.workersCreated[createdIdx],
      ...patch,
    };
    notify();
    return;
  }

  state.workersUpdated[id] = {
    ...(state.workersUpdated[id] || {}),
    ...patch,
  };
  notify();
}

export function deleteShowcaseWorker(id: string) {
  if (!isClientShowcaseMode()) {
    return;
  }

  state.workersCreated = state.workersCreated.filter((worker) => worker.id !== id);
  delete state.workersUpdated[id];
  state.workersDeleted.add(id);
  notify();
}

export function mergeStations<T extends ShowcaseStation>(baseline: T[]): T[] {
  if (!isClientShowcaseMode()) {
    return baseline;
  }

  const visible = baseline
    .filter((station) => !state.stationsDeleted.has(station.id))
    .map((station) => ({ ...station, ...state.stationsUpdated[station.id] }));

  return [...visible, ...(state.stationsCreated as T[])];
}

export function createShowcaseStation(input: Omit<ShowcaseStation, "id" | "createdAt" | "updatedAt" | "_count">) {
  if (!isClientShowcaseMode()) {
    return;
  }

  state.stationsCreated.push({
    ...input,
    id: tmpId("station"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { shifts: 0 },
  });
  notify();
}

export function updateShowcaseStation(id: string, patch: Partial<ShowcaseStation>) {
  if (!isClientShowcaseMode()) {
    return;
  }

  const createdIdx = state.stationsCreated.findIndex((station) => station.id === id);
  if (createdIdx >= 0) {
    state.stationsCreated[createdIdx] = {
      ...state.stationsCreated[createdIdx],
      ...patch,
    };
    notify();
    return;
  }

  state.stationsUpdated[id] = {
    ...(state.stationsUpdated[id] || {}),
    ...patch,
  };
  notify();
}

export function deleteShowcaseStation(id: string) {
  if (!isClientShowcaseMode()) {
    return;
  }

  state.stationsCreated = state.stationsCreated.filter((station) => station.id !== id);
  delete state.stationsUpdated[id];
  state.stationsDeleted.add(id);
  notify();
}

export function mergeShifts<T extends ShowcaseShift>(baseline: T[]): T[] {
  if (!isClientShowcaseMode()) {
    return baseline;
  }

  const visible = baseline
    .filter((shift) => !state.shiftsDeleted.has(shift.id))
    .map((shift) => ({ ...shift, ...state.shiftsUpdated[shift.id] }));

  return [...visible, ...(state.shiftsCreated as T[])];
}

export function createShowcaseShift(input: Omit<ShowcaseShift, "id" | "createdAt" | "updatedAt" | "_count" | "parentShiftId" | "originalDate" | "isCancelled">) {
  if (!isClientShowcaseMode()) {
    return;
  }

  state.shiftsCreated.push({
    ...input,
    id: tmpId("shift"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parentShiftId: null,
    originalDate: null,
    isCancelled: false,
    _count: { signups: 0 },
  });
  notify();
}

export function updateShowcaseShift(id: string, patch: Partial<ShowcaseShift>) {
  if (!isClientShowcaseMode()) {
    return;
  }

  const createdIdx = state.shiftsCreated.findIndex((shift) => shift.id === id);
  if (createdIdx >= 0) {
    state.shiftsCreated[createdIdx] = {
      ...state.shiftsCreated[createdIdx],
      ...patch,
    };
    notify();
    return;
  }

  state.shiftsUpdated[id] = {
    ...(state.shiftsUpdated[id] || {}),
    ...patch,
  };
  notify();
}

export function deleteShowcaseShift(id: string) {
  if (!isClientShowcaseMode()) {
    return;
  }

  state.shiftsCreated = state.shiftsCreated.filter((shift) => shift.id !== id);
  delete state.shiftsUpdated[id];
  state.shiftsDeleted.add(id);
  notify();
}

export function createShowcaseSignup(signup: ShowcaseMyShift) {
  if (!isClientShowcaseMode()) {
    return;
  }

  const exists = state.myShiftCreated.some((item) => item.id === signup.id);
  if (!exists) {
    state.myShiftCreated.push(signup);
  }
  notify();
}

export function cancelShowcaseSignup(key: string) {
  if (!isClientShowcaseMode()) {
    return;
  }

  state.myShiftCancelledKeys.add(key);
  notify();
}

export function hasShowcaseSignup(shiftId: string, occurrenceDate?: string | null): boolean {
  if (!isClientShowcaseMode()) {
    return false;
  }

  const key = `${shiftId}_${occurrenceDate || ""}`;
  if (state.myShiftCancelledKeys.has(key)) {
    return false;
  }

  return state.myShiftCreated.some((signup) => {
    const signupKey = `${signup.shift.id}_${signup.occurrenceDate || ""}`;
    return signupKey === key;
  });
}

export function mergeMyShifts<T extends ShowcaseMyShift>(baseline: T[]): T[] {
  if (!isClientShowcaseMode()) {
    return baseline;
  }

  const filteredBaseline = baseline.filter((signup) => {
    const key = `${signup.shift.id}_${signup.occurrenceDate || ""}`;
    return !state.myShiftCancelledKeys.has(key);
  });

  const extra = state.myShiftCreated.filter((signup) => {
    const key = `${signup.shift.id}_${signup.occurrenceDate || ""}`;
    return !state.myShiftCancelledKeys.has(key);
  });

  return [...filteredBaseline, ...(extra as T[])];
}
