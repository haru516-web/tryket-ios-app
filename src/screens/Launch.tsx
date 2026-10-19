import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, View } from 'react-native';
import { Quest, QUESTS } from '../data/quests';
import { IMG, Panel, PxImage, T } from '../components/Px';
import { dayKey, useStore } from '../store';
import { C } from '../theme';

// タイムライン(ms)。スワイプで着火すると 0 から再生する
const T_SHAKE = 700; // 点火して揺れる
const T_LIFT = 2200; // 離陸
const T_SCROLL0 = 1200; // 背景が流れ始める
const T_SCROLL1 = 4200;
const T_EXIT = 4900; // ロケットが画面外へ
const END = T_EXIT;

const SWIPE_UP = 70; // これ以上上へスワイプしたら発射
const SWIPE_ANY = 100; // 方向を問わない最小距離

const easeIn = (x: number) => x * x;
const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export default function Launch({ W, H, onOpen }: { W: number; H: number; onOpen: (q: Quest) => void }) {
  const store = useStore();
  const [t, setT] = useState(store.launchedToday ? END : -1); // -1: 待機(スワイプ待ち)
  const [pull, setPull] = useState(0); // スワイプ中の引き上げ量(px)
  const raf = useRef<number | null>(null);

  // 画面サイズ由来の寸法(1ドット = s px)
  const m = useMemo(() => {
    const s = W / 90;
    const SH = 480 * s;
    const groundOffset = H - SH;
    const padTop = 402 * s;
    const rocketLeft = 40 * s;
    const rocketTop0 = padTop + 9 * s + groundOffset;
    const R = rocketTop0 - H * 0.28;
    return { s, SH, groundOffset, padTop, rocketLeft, rocketTop0, R };
  }, [W, H]);

  const play = (from = 0) => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const start = performance.now() - from;
    const loop = () => {
      const now = performance.now() - start;
      if (now >= END) { setT(END); raf.current = null; return; }
      setT(now);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  };
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);
  useEffect(() => { if (!store.launchedToday) setT(-1); }, [store.launchedToday]);

  const ignite = () => {
    setPull(0);
    if (!store.launchedToday) store.launch();
    play(0);
  };
  const skip = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    setPull(0);
    if (!store.launchedToday) store.launch();
    setT(END);
  };
  const igniteRef = useRef(ignite);
  igniteRef.current = ignite;

  const idle = t < 0;
  const done = t >= END;
  const tt = Math.max(t, 0);

  // スワイプ操作(待機中のみ有効)
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 8 || Math.abs(g.dx) > 8,
        onPanResponderMove: (_e, g) => setPull(clamp(-g.dy, 0, 140)),
        onPanResponderRelease: (_e, g) => {
          if (-g.dy >= SWIPE_UP || Math.hypot(g.dx, g.dy) >= SWIPE_ANY) igniteRef.current();
          else setPull(0);
        },
        onPanResponderTerminate: () => setPull(0),
      }),
    [],
  );

  // スクロールと位置
  const scrollY = idle ? m.groundOffset : m.groundOffset * (1 - easeInOut(clamp((tt - T_SCROLL0) / (T_SCROLL1 - T_SCROLL0))));
  let rocketY = idle ? -pull * 0.5 : 0;
  if (tt >= T_SHAKE && tt < T_LIFT) rocketY = -m.R * easeIn((tt - T_SHAKE) / (T_LIFT - T_SHAKE));
  else if (tt >= T_LIFT && tt < T_SCROLL1) rocketY = -m.R;
  else if (tt >= T_SCROLL1) rocketY = -(m.R + (H + 300) * easeIn(clamp((tt - T_SCROLL1) / (T_EXIT - T_SCROLL1))));
  const shakeAmp = idle ? clamp((pull - 20) / 60) * 3 : tt < T_SHAKE ? 2 + (tt / T_SHAKE) * 4 : 0;
  const shakeX = shakeAmp * Math.sin((idle ? pull : tt) * 0.35);
  const flameOn = idle ? pull > 40 : !done && tt >= 150;
  const flameFrame = idle ? Math.floor(pull / 12) % 4 : Math.floor(tt / 70) % 4;

  const todayQuests = store.todayIds.map((id) => QUESTS.find((q) => q.id === id)!).filter(Boolean);
  const doneToday = new Set(store.records.filter((r) => dayKey(new Date(r.at)) === store.today).map((r) => r.questId));
  const cardsOpacity = clamp((tt - 4400) / 500);

  return (
    <View
      {...(idle ? pan.panHandlers : {})}
      style={{ width: W, height: H, overflow: 'hidden', backgroundColor: C.navy, cursor: idle ? ('grab' as any) : undefined }}
    >
      {/* 背景(地上→空→宇宙) と発射台 */}
      <View style={{ position: 'absolute', left: 0, top: 0, width: W, height: m.SH, transform: [{ translateY: done ? 0 : scrollY }] }}>
        <PxImage src={IMG.scroll} w={W} h={m.SH} />
        <PxImage src={IMG.pad} w={64 * m.s} h={64 * m.s} style={{ position: 'absolute', left: 13 * m.s, top: m.padTop }} />
      </View>

      {/* ロケット(待機中のタップでも発射できる) */}
      {!done && (
        <Pressable
          disabled={!idle}
          onPress={ignite}
          style={{ position: 'absolute', left: m.rocketLeft, top: m.rocketTop0, transform: [{ translateY: rocketY }, { translateX: shakeX }] }}
        >
          <PxImage src={IMG.rocket} w={26 * m.s} h={48 * m.s} />
          {flameOn && (
            <PxImage src={IMG.flame[flameFrame]} w={14 * m.s} h={22 * m.s} style={{ position: 'absolute', left: 6 * m.s, top: 46 * m.s }} />
          )}
        </Pressable>
      )}

      {/* ヘッダー */}
      {idle && (
        <View style={{ position: 'absolute', top: 18, left: 0, right: 0, alignItems: 'center' }} pointerEvents="none">
          <Panel style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
            <T size={20}>Tryket</T>
            <T size={11} color={C.creamSh}>今日のはじめてを打ち上げよう</T>
          </Panel>
        </View>
      )}

      {/* スワイプの案内 */}
      {idle && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 22, alignItems: 'center', opacity: pull > 0 ? 0.5 : 1 }} pointerEvents="none">
          <Panel style={{ paddingVertical: 8, paddingHorizontal: 18, alignItems: 'center' }}>
            <T size={18} color={C.yellow}>▲</T>
            <T size={14}>上にスワイプして発射</T>
          </Panel>
        </View>
      )}

      {/* スキップ / もう一度 */}
      {!idle && !done && (
        <Pressable onPress={skip} style={{ position: 'absolute', top: 14, right: 14 }}>
          <Panel style={{ paddingVertical: 4, paddingHorizontal: 10 }}>
            <T size={13}>スキップ ▶▶</T>
          </Panel>
        </Pressable>
      )}
      {done && (
        <Pressable onPress={() => play(0)} style={{ position: 'absolute', top: 12, right: 12 }}>
          <Panel style={{ paddingVertical: 4, paddingHorizontal: 10 }}>
            <T size={12}>🚀 もう一度見る</T>
          </Panel>
        </Pressable>
      )}
      {idle && (
        <Pressable onPress={skip} style={{ position: 'absolute', top: 14, right: 14 }}>
          <T size={12} color={C.creamSh}>演出をスキップ</T>
        </Pressable>
      )}

      {/* 今日の挑戦 */}
      {(done || tt >= 4400) && (
        <View style={{ position: 'absolute', left: 14, right: 14, top: 52, bottom: 12, opacity: done ? 1 : cardsOpacity }}>
          <T size={22} style={{ marginBottom: 2 }}>今日の挑戦</T>
          <T size={12} color={C.creamSh} style={{ marginBottom: 10 }}>気になるものを1つ選んで、現実でやってみよう</T>
          <View style={{ flex: 1, gap: 10 }}>
            {todayQuests.map((q) => (
              <Pressable key={q.id} onPress={() => onOpen(q)} style={{ flex: 1 }}>
                <Panel style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: doneToday.has(q.id) ? 0.55 : 1 }}>
                  <T size={30}>{q.emoji}</T>
                  <View style={{ flex: 1 }}>
                    <T size={16}>{q.title}</T>
                    <T size={11} color={C.creamSh}>{q.desc}</T>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      <T size={11} color={C.yellow}>{q.time}</T>
                      <T size={11} color={C.sky}>{q.category}</T>
                      {q.casual && <T size={11} color={C.cream}>ついで</T>}
                    </View>
                  </View>
                  {doneToday.has(q.id) && <T size={16} color={C.yellow}>済</T>}
                </Panel>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
