import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Category, QUESTS, Quest } from './data/quests';

export type Interest = 'yes' | 'no';
export type Rec = { id: string; questId: number; at: number; interest: Interest };

type Persisted = {
  onboarded: boolean;
  age: number;
  interests: Category[];
  records: Rec[];
  launchDay: string | null;
  todayIds: number[];
};

const KEY = 'tryket.v1';
const EMPTY: Persisted = { onboarded: false, age: 22, interests: [], records: [], launchDay: null, todayIds: [] };

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const seeded = (str: string) => {
  let a = 0;
  for (const ch of str) a = (a * 31 + ch.charCodeAt(0)) | 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// 未経験・未知の分野を優先して、今日の4件を選ぶ
export function pickQuests(s: Persisted, day: string): number[] {
  const rnd = seeded(day + s.records.length);
  const done = new Set(s.records.map((r) => r.questId));
  const scored = QUESTS.map((q) => ({
    q,
    score: rnd() + (done.has(q.id) ? 0 : 3) + (s.interests.includes(q.category) ? 0 : 2),
  })).sort((a, b) => b.score - a.score);
  const picks: Quest[] = [];
  const used = new Set<Category>();
  for (const { q } of scored) {
    if (picks.length >= 4) break;
    if (!used.has(q.category)) { picks.push(q); used.add(q.category); }
  }
  for (const { q } of scored) {
    if (picks.length >= 4) break;
    if (!picks.includes(q)) picks.push(q);
  }
  if (!picks.some((q) => q.casual)) {
    const casual = scored.find(({ q }) => q.casual && !picks.includes(q));
    if (casual) picks[picks.length - 1] = casual.q;
  }
  return picks.map((q) => q.id);
}

type Store = Persisted & {
  ready: boolean;
  today: string;
  launchedToday: boolean;
  completeOnboarding: (age: number, interests: Category[]) => void;
  launch: () => void;
  addRecord: (questId: number, interest: Interest) => void;
  setInterest: (id: string, interest: Interest) => void;
  setAge: (age: number) => void;
  reset: () => void;
};

const Ctx = createContext<Store | null>(null);
export const useStore = () => useContext(Ctx)!;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<Persisted>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => { if (raw) setS({ ...EMPTY, ...JSON.parse(raw) }); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((fn: (p: Persisted) => Persisted) => {
    setS((prev) => {
      const next = fn(prev);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const today = dayKey();
  const value = useMemo<Store>(
    () => ({
      ...s,
      ready,
      today,
      launchedToday: s.launchDay === today,
      completeOnboarding: (age, interests) => update((p) => ({ ...p, onboarded: true, age, interests })),
      launch: () => update((p) => ({ ...p, launchDay: dayKey(), todayIds: pickQuests(p, dayKey()) })),
      addRecord: (questId, interest) =>
        update((p) => ({ ...p, records: [{ id: `${Date.now()}-${questId}`, questId, at: Date.now(), interest }, ...p.records] })),
      setInterest: (id, interest) => update((p) => ({ ...p, records: p.records.map((r) => (r.id === id ? { ...r, interest } : r)) })),
      setAge: (age) => update((p) => ({ ...p, age })),
      reset: () => update(() => EMPTY),
    }),
    [s, ready, today, update],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
