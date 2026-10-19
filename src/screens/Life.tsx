import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Btn, Panel, T } from '../components/Px';
import { livesFor } from '../data/lives';
import { useStore } from '../store';
import { C } from '../theme';

export default function Life() {
  const { age, setAge } = useStore();
  const [tab, setTab] = useState<'history' | 'world'>('history');
  const list = livesFor(age)[tab].slice(0, 5);

  return (
    <View style={{ flex: 1, backgroundColor: C.navy, padding: 14 }}>
      <T size={22}>同じ年、違う人生</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
        <T size={13} color={C.creamSh}>あなたの年齢</T>
        <Btn small kind="navy" label="−" onPress={() => setAge(Math.max(10, age - 1))} />
        <T size={22}>{age}歳</T>
        <Btn small kind="navy" label="＋" onPress={() => setAge(Math.min(90, age + 1))} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        {(['history', 'world'] as const).map((k) => (
          <Pressable key={k} onPress={() => setTab(k)} style={{ flex: 1 }}>
            <Panel style={{ alignItems: 'center', paddingVertical: 8, backgroundColor: tab === k ? C.orange : undefined }}>
              <T size={13}>{k === 'history' ? '歴史上の人物' : '世界の同い年'}</T>
            </Panel>
          </Pressable>
        ))}
      </View>
      <T size={11} color={C.creamSh} style={{ marginBottom: 8 }}>
        {tab === 'history' ? 'その人が、あなたに近い年齢だった頃。誰かと比べるためではなく、人生の形を知るために。' : '※ 実在の人物ではない架空のサンプルです(取材コンテンツに差し替え予定)。'}
      </T>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8 }}>
        {list.map((l, i) => (
          <Panel key={i} tone="cream">
            <T size={11} color={C.orangeSh}>{l.age}歳{l.age !== age ? `(あなたと${Math.abs(l.age - age)}歳差)` : '(同い年)'}</T>
            <T size={16} color={C.ink}>{l.name}</T>
            <T size={13} color={C.ink}>{l.line}</T>
          </Panel>
        ))}
      </ScrollView>
    </View>
  );
}
