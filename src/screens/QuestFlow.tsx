import React, { useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { Btn, Panel, T } from '../components/Px';
import { hashtag, Quest } from '../data/quests';
import { livesFor } from '../data/lives';
import { Interest, useStore } from '../store';
import { C } from '../theme';

type Step = 'detail' | 'rate' | 'result';

async function shareText(text: string): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      const nav: any = (globalThis as any).navigator;
      if (nav?.clipboard?.writeText) { await nav.clipboard.writeText(text); return 'コピーしました'; }
      return '共有に対応していません';
    }
    await Share.share({ message: text });
    return '';
  } catch {
    return '';
  }
}

export default function QuestFlow({ quest, onClose }: { quest: Quest; onClose: () => void }) {
  const store = useStore();
  const [step, setStep] = useState<Step>('detail');
  const [picked, setPicked] = useState<Interest | null>(null);
  const [msg, setMsg] = useState('');
  const tag = hashtag(quest);

  const rate = (i: Interest) => {
    store.addRecord(quest.id, i);
    setPicked(i);
    setStep('result');
  };

  const life = (() => {
    const l = livesFor(store.age);
    return store.records.length % 2 === 0 ? l.history[0] : l.world[0];
  })();

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(6,10,31,0.98)', padding: 18, justifyContent: 'center' }}>
      {step === 'detail' && (
        <View style={{ gap: 14 }}>
          <T size={12} color={C.yellow}>{tag}</T>
          <T size={56}>{quest.emoji}</T>
          <T size={24}>{quest.title}</T>
          <T size={14} color={C.creamSh}>{quest.desc}</T>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <T size={13} color={C.yellow}>{quest.time}</T>
            <T size={13} color={C.sky}>{quest.category}</T>
          </View>
          <Panel>
            <T size={12} color={C.creamSh}>上手さは気にしなくて大丈夫。スマホを置いて、現実でやってみよう。終わったら戻ってきてね。</T>
          </Panel>
          <Btn label="やってみた!" onPress={() => setStep('rate')} />
          <Btn label="あとにする" kind="navy" onPress={onClose} />
        </View>
      )}

      {step === 'rate' && (
        <View style={{ gap: 14 }}>
          <T size={24}>どうだった?</T>
          <T size={13} color={C.creamSh}>どちらを選んでも、新しい体験をした証拠。あとで変更もできるよ。</T>
          <Btn label="🔥 少し興味が湧いた" onPress={() => rate('yes')} />
          <Btn label="💧 興味が湧かなかった" kind="cream" onPress={() => rate('no')} />
        </View>
      )}

      {step === 'result' && (
        <View style={{ gap: 14 }}>
          <T size={12} color={C.yellow}>{tag}</T>
          <T size={22}>原体験を記録した!</T>
          <Panel>
            <T size={15}>{quest.emoji} {quest.title}</T>
            <T size={13} color={picked === 'yes' ? C.yellow : C.sky}>{picked === 'yes' ? '少し興味が湧いた' : '興味が湧かなかった'}</T>
          </Panel>
          {life && (
            <Panel tone="cream">
              <T size={11} color={C.orangeSh}>同い年のあの人は…({life.age}歳)</T>
              <T size={15} color={C.ink}>{life.name}</T>
              <T size={12} color={C.ink}>{life.line}</T>
              {life.kind === 'world' && <T size={10} color={C.steel}>※架空のサンプルです</T>}
            </Panel>
          )}
          <Btn
            label={msg || `${tag} をコピー / 共有`}
            kind="cream"
            onPress={async () => setMsg((await shareText(`${quest.emoji} ${quest.title}\n${picked === 'yes' ? '少し興味が湧いた' : '興味が湧かなかった'}\n${tag} #Tryket`)) || '')}
          />
          <Btn label="とじる" onPress={onClose} />
        </View>
      )}
    </View>
  );
}
