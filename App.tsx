import { DotGothic16_400Regular, useFonts } from '@expo-google-fonts/dotgothic16';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { T } from './src/components/Px';
import { Quest } from './src/data/quests';
import Journal from './src/screens/Journal';
import Launch from './src/screens/Launch';
import Life from './src/screens/Life';
import Onboarding from './src/screens/Onboarding';
import Opening from './src/screens/Opening';
import QuestFlow from './src/screens/QuestFlow';
import { StoreProvider, useStore } from './src/store';
import { C } from './src/theme';

type Tab = 'launch' | 'life' | 'journal';
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'launch', label: '挑戦', icon: '🚀' },
  { key: 'life', label: '人生', icon: '🌍' },
  { key: 'journal', label: '積み重ね', icon: '📒' },
];
const TAB_H = 62;

function Shell() {
  const store = useStore();
  const win = useWindowDimensions();
  const W = Math.min(win.width, 430);
  const H = Math.min(win.height, 940);
  const [tab, setTab] = useState<Tab>('launch');
  const [quest, setQuest] = useState<Quest | null>(null);
  const [opened, setOpened] = useState(false);

  if (!opened) return <Opening W={W} H={H} onDone={() => setOpened(true)} />;
  if (!store.ready) return null;
  if (!store.onboarded) return <Onboarding W={W} H={H} />;

  const bodyH = H - TAB_H;
  return (
    <View style={{ width: W, height: H, backgroundColor: C.navy }}>
      <View style={{ width: W, height: bodyH }}>
        {tab === 'launch' && <Launch W={W} H={bodyH} onOpen={setQuest} />}
        {tab === 'life' && <Life />}
        {tab === 'journal' && <Journal />}
        {quest && <QuestFlow quest={quest} onClose={() => setQuest(null)} />}
      </View>
      <View style={{ height: TAB_H, flexDirection: 'row', backgroundColor: C.ink, borderTopWidth: 4, borderTopColor: C.cream }}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tab === t.key ? C.navy2 : 'transparent' }}>
            <T size={20}>{t.icon}</T>
            <T size={12} color={tab === t.key ? C.yellow : C.creamSh}>{t.label}</T>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({ DotGothic16_400Regular });
  if (!loaded) return null;
  return (
    <View style={{ flex: 1, backgroundColor: '#05081a', alignItems: 'center', justifyContent: 'center' }}>
      <StatusBar style="light" />
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </View>
  );
}
