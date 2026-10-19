import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { IMG, PxImage } from '../components/Px';
import { C, FONT } from '../theme';

// タイムライン(ms)。タップで 0 から再生が始まる
const T_RISE0 = 200;
const T_RISE1 = 2200;
const T_EXIT = 2900;
const T_LOGO = 2700;
const T_TAG = 3500;
const T_HINT = 4200;
const END = 5300;
const LOGO = 'Tryket'.split('');

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const easeOut = (x: number) => 1 - (1 - x) * (1 - x);
const easeIn = (x: number) => x * x;
const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

export default function Opening({ W, H, onDone }: { W: number; H: number; onDone: () => void }) {
  // 確認用: ?ot=3500 のように指定すると、その時刻で演出を固定して表示する(Webのみ)
  const frozen = (() => {
    const q = (globalThis as any).location?.search as string | undefined;
    const m = q?.match(/[?&]ot=(\d+)/);
    return m ? Number(m[1]) : null;
  })();
  const [started, setStarted] = useState(frozen !== null);
  const [t, setT] = useState(frozen ?? 0);
  const [blink, setBlink] = useState(0);
  const finished = useRef(false);
  const finish = useRef(() => {});
  finish.current = () => {
    if (finished.current) return;
    finished.current = true;
    onDone();
  };

  // 待機中: 「タップではじめる」の点滅だけ動かす
  useEffect(() => {
    if (started) return;
    const id = setInterval(() => setBlink((b) => b + 1), 450);
    return () => clearInterval(id);
  }, [started]);

  // タップ後: 演出を再生
  useEffect(() => {
    if (!started || frozen !== null) return;
    const start = performance.now();
    let id = 0;
    const loop = () => {
      const now = performance.now() - start;
      if (now >= END) { finish.current(); return; }
      setT(now);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [started, frozen]);

  const s = W / 90;
  const rw = 26 * s, rh = 48 * s;
  const SH = 480 * s;
  const startScroll = -(SH - H) * 0.35;
  const scrollY = startScroll * (1 - easeInOut(clamp((t - T_RISE0) / 2900)));

  const yMid = H * 0.3;
  const y0 = H * 0.58; // 待機中のロケット位置(ここから昇り始める)
  let rocketY = y0;
  if (t >= T_RISE0 && t < T_RISE1) rocketY = y0 + (yMid - y0) * easeOut((t - T_RISE0) / (T_RISE1 - T_RISE0));
  else if (t >= T_RISE1 && t < T_EXIT) rocketY = yMid - (yMid + rh + 60) * easeIn((t - T_RISE1) / (T_EXIT - T_RISE1));
  else if (t >= T_EXIT) rocketY = -rh - 100;
  const flying = started && t < T_EXIT;
  const showRocket = !started || t < T_EXIT;
  const shakeX = started && flying ? 2 * Math.sin(t * 0.1) : 0;

  // 到達時の火花
  const burstP = clamp((t - T_RISE1) / 1000);
  const burst = started && t >= T_RISE1 && burstP < 1;
  const bx = W / 2, by = yMid + rh * 0.5;

  const fadeOut = clamp((t - (END - 300)) / 300);

  return (
    <Pressable
      onPress={() => {
        if (frozen !== null) return;
        if (!started) setStarted(true);
        else finish.current(); // 再生中のタップはスキップ
      }}
      style={{ width: W, height: H, overflow: 'hidden', backgroundColor: C.navy }}
    >
      <View style={{ position: 'absolute', left: 0, top: 0, width: W, height: SH, transform: [{ translateY: scrollY }] }}>
        <PxImage src={IMG.scroll} w={W} h={SH} />
      </View>

      {showRocket && (
        <View style={{ position: 'absolute', left: (W - rw) / 2, top: rocketY, transform: [{ translateX: shakeX }] }}>
          <PxImage src={IMG.rocket} w={rw} h={rh} />
          {flying && <PxImage src={IMG.flame[Math.floor(t / 70) % 4]} w={14 * s} h={22 * s} style={{ position: 'absolute', left: 6 * s, top: 46 * s }} />}
        </View>
      )}

      {burst &&
        Array.from({ length: 8 }).map((_, k) => {
          const a = (k / 8) * Math.PI * 2;
          const r = 30 + burstP * 140;
          const size = 44 * (1 - burstP * 0.5);
          return (
            <PxImage
              key={k}
              src={IMG.spark[(k + Math.floor(t / 80)) % 3]}
              w={size}
              h={size}
              style={{ position: 'absolute', left: bx + Math.cos(a) * r - size / 2, top: by + Math.sin(a) * r - size / 2, opacity: 1 - burstP }}
            />
          );
        })}

      {/* 待機中のタイトル */}
      {!started && (
        <>
          <View style={{ position: 'absolute', left: 0, right: 0, top: H * 0.12, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT, fontSize: Math.min(64, W / 6.4), color: C.cream, textShadowColor: C.orange, textShadowOffset: { width: 4, height: 4 }, textShadowRadius: 0 }}>Tryket</Text>
          </View>
          <View style={{ position: 'absolute', bottom: 44, left: 0, right: 0, alignItems: 'center', opacity: blink % 2 === 0 ? 1 : 0.55 }} pointerEvents="none">
            <View style={{ backgroundColor: 'rgba(12,18,51,0.88)', borderWidth: 3, borderColor: C.cream, paddingVertical: 8, paddingHorizontal: 20 }}>
              <Text style={{ fontFamily: FONT, fontSize: 16, color: C.cream }}>タップではじめる</Text>
            </View>
          </View>
        </>
      )}

      {/* ロゴ */}
      {started && (
        <View
          style={{
            position: 'absolute', left: 0, right: 0, top: H * 0.33, alignItems: 'center', paddingVertical: 26,
            backgroundColor: 'rgba(12,18,51,0.8)', borderTopWidth: 3, borderBottomWidth: 3, borderColor: C.cream,
            opacity: clamp((t - (T_LOGO - 200)) / 300),
          }}
        >
          <View style={{ flexDirection: 'row' }}>
            {LOGO.map((ch, i) => {
              const p = easeOut(clamp((t - (T_LOGO + i * 110)) / 250));
              return (
                <Text
                  key={i}
                  style={{
                    fontFamily: FONT,
                    fontSize: Math.min(64, W / 6.4),
                    color: C.cream,
                    opacity: p,
                    transform: [{ translateY: (1 - p) * 20 }],
                    textShadowColor: C.orange,
                    textShadowOffset: { width: 4, height: 4 },
                    textShadowRadius: 0,
                  }}
                >
                  {ch}
                </Text>
              );
            })}
          </View>
          <Text style={{ fontFamily: FONT, fontSize: 15, color: C.cream, marginTop: 14, opacity: clamp((t - T_TAG) / 500) }}>
            やってみる、で世界がひらく。
          </Text>
        </View>
      )}

      {started && t < T_HINT && (
        <Text style={{ position: 'absolute', top: 14, right: 14, fontFamily: FONT, fontSize: 12, color: C.creamSh, opacity: 0.7 }}>タップでスキップ</Text>
      )}

      {/* 暗転(終了時) */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: '#000', opacity: fadeOut }} />
    </Pressable>
  );
}
