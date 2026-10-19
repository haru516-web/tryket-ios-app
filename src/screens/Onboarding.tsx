import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Btn, IMG, Panel, PxImage, T } from '../components/Px';
import { CATEGORIES, Category } from '../data/quests';
import { useStore } from '../store';
import { C } from '../theme';

export default function Onboarding({ W, H }: { W: number; H: number }) {
  const { completeOnboarding } = useStore();
  const [age, setAge] = useState(22);
  const [picked, setPicked] = useState<Category[]>([]);
  const toggle = (c: Category) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  return (
    <View style={{ width: W, height: H, backgroundColor: C.navy, padding: 18, justifyContent: 'center', gap: 14 }}>
      <View style={{ alignItems: 'center' }}>
        <PxImage src={IMG.rocket} w={26 * 3} h={48 * 3} />
      </View>
      <T size={30} style={{ textAlign: 'center' }}>Tryket</T>
      <T size={14} color={C.creamSh} style={{ textAlign: 'center' }}>やってみる、で世界がひらく。{'\n'}毎日ひとつ、まだやったことのないことを。</T>

      <Panel>
        <T size={13} color={C.yellow}>あなたの年齢</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 4 }}>
          <Btn small kind="navy" label="−" onPress={() => setAge((a) => Math.max(10, a - 1))} />
          <T size={26}>{age}歳</T>
          <Btn small kind="navy" label="＋" onPress={() => setAge((a) => Math.min(90, a + 1))} />
        </View>
      </Panel>

      <Panel>
        <T size={13} color={C.yellow}>もともと興味のあるジャンル(複数OK)</T>
        <T size={11} color={C.creamSh}>選んだもの以外の、未知の分野を優先して提案するよ</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {CATEGORIES.map((c) => (
            <Pressable key={c} onPress={() => toggle(c)}>
              <View style={{ borderWidth: 3, borderColor: picked.includes(c) ? C.yellow : C.cream, backgroundColor: picked.includes(c) ? C.orange : 'transparent', paddingHorizontal: 14, paddingVertical: 6 }}>
                <T size={14}>{c}</T>
              </View>
            </Pressable>
          ))}
        </View>
      </Panel>

      <Btn label="🚀 はじめる" onPress={() => completeOnboarding(age, picked)} />
    </View>
  );
}
