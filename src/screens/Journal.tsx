import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Btn, Panel, T } from '../components/Px';
import { CATEGORIES, QUESTS, hashtag } from '../data/quests';
import { useStore } from '../store';
import { C } from '../theme';

export default function Journal() {
  const { records, setInterest, reset } = useStore();
  const yes = records.filter((r) => r.interest === 'yes');
  const no = records.filter((r) => r.interest === 'no');
  const byCat = CATEGORIES.map((c) => {
    const ids = new Set(QUESTS.filter((q) => q.category === c).map((q) => q.id));
    return { c, y: yes.filter((r) => ids.has(r.questId)).length, n: no.filter((r) => ids.has(r.questId)).length };
  });
  const max = Math.max(1, ...byCat.map((b) => Math.max(b.y, b.n)));

  return (
    <View style={{ flex: 1, backgroundColor: C.navy, padding: 14 }}>
      <T size={22}>積み重ね</T>
      <View style={{ flexDirection: 'row', gap: 10, marginVertical: 10 }}>
        <Panel style={{ flex: 1 }}>
          <T size={11} color={C.yellow}>少し興味が湧いた</T>
          <T size={34}>{yes.length}</T>
        </Panel>
        <Panel style={{ flex: 1 }}>
          <T size={11} color={C.sky}>興味が湧かなかった</T>
          <T size={34}>{no.length}</T>
        </Panel>
      </View>

      <Panel style={{ gap: 6 }}>
        <T size={13}>興味の広がり</T>
        {byCat.map((b) => (
          <View key={b.c} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <T size={12} style={{ width: 36 }}>{b.c}</T>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ height: 6, width: `${(b.y / max) * 100}%`, minWidth: b.y ? 6 : 0, backgroundColor: C.yes }} />
              <View style={{ height: 6, width: `${(b.n / max) * 100}%`, minWidth: b.n ? 6 : 0, backgroundColor: C.no }} />
            </View>
            <T size={11} color={C.creamSh} style={{ width: 40, textAlign: 'right' }}>{b.y} / {b.n}</T>
          </View>
        ))}
      </Panel>

      <T size={13} style={{ marginTop: 10, marginBottom: 6 }}>これまでの原体験(タップで分類を変更)</T>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 6 }}>
        {records.length === 0 && <T size={12} color={C.creamSh}>まだ記録がありません。挑戦タブから最初の1つを。</T>}
        {records.map((r) => {
          const q = QUESTS.find((x) => x.id === r.questId);
          if (!q) return null;
          return (
            <Pressable key={r.id} onPress={() => setInterest(r.id, r.interest === 'yes' ? 'no' : 'yes')}>
              <Panel style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                <T size={22}>{q.emoji}</T>
                <View style={{ flex: 1 }}>
                  <T size={14}>{q.title}</T>
                  <T size={10} color={C.creamSh}>{hashtag(q)} ・ {new Date(r.at).toLocaleDateString('ja-JP')}</T>
                </View>
                <T size={12} color={r.interest === 'yes' ? C.yellow : C.sky}>{r.interest === 'yes' ? '🔥 興味あり' : '💧 興味なし'}</T>
              </Panel>
            </Pressable>
          );
        })}
        <Btn small kind="navy" label="データを消去する" onPress={reset} style={{ marginTop: 8 }} />
      </ScrollView>
    </View>
  );
}
