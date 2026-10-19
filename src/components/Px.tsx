import React from 'react';
import { Image, ImageSourcePropType, ImageStyle, Platform, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { C, FONT } from '../theme';

export const IMG = {
  rocket: require('../../assets/px/rocket.png'),
  flame: [
    require('../../assets/px/flame_0.png'),
    require('../../assets/px/flame_1.png'),
    require('../../assets/px/flame_2.png'),
    require('../../assets/px/flame_3.png'),
  ],
  pad: require('../../assets/px/launchpad.png'),
  scroll: require('../../assets/px/bg_scroll.png'),
  spark: [
    require('../../assets/px/spark_0.png'),
    require('../../assets/px/spark_1.png'),
    require('../../assets/px/spark_2.png'),
  ],
  fuse: require('../../assets/px/fuse.png'),
  fuseBurnt: require('../../assets/px/fuse_burnt.png'),
  knob: require('../../assets/px/knob.png'),
} as const;

const crisp: any = Platform.OS === 'web' ? { imageRendering: 'pixelated' } : {};

export function PxImage({ src, w, h, style }: { src: ImageSourcePropType; w: number; h: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={src} style={[{ width: w, height: h }, crisp, style]} resizeMode="stretch" />;
}

export function T({ children, style, size = 14, color = C.cream, bold }: { children: React.ReactNode; style?: StyleProp<TextStyle>; size?: number; color?: string; bold?: boolean }) {
  return (
    <Text style={[{ fontFamily: FONT, fontSize: size, color, lineHeight: Math.round(size * 1.45) }, bold && styles.bold, style]}>{children}</Text>
  );
}

// 角ばったピクセル風パネル
export function Panel({ children, style, tone = 'navy' }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tone?: 'navy' | 'cream' }) {
  const cream = tone === 'cream';
  return (
    <View style={[styles.panel, { backgroundColor: cream ? C.cream : 'rgba(12,18,51,0.88)', borderColor: cream ? C.ink : C.cream }, style]}>
      {children}
    </View>
  );
}

export function Btn({ label, onPress, kind = 'orange', style, small }: { label: string; onPress: () => void; kind?: 'orange' | 'cream' | 'navy'; style?: StyleProp<ViewStyle>; small?: boolean }) {
  const bg = kind === 'orange' ? C.orange : kind === 'cream' ? C.cream : C.navy2;
  const fg = kind === 'cream' ? C.ink : C.cream;
  const sh = kind === 'orange' ? C.orangeSh : kind === 'cream' ? C.creamSh : C.navy;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, { backgroundColor: bg, borderColor: C.ink, borderBottomColor: sh, paddingVertical: small ? 8 : 14 }, pressed && { transform: [{ translateY: 2 }] }, style]}>
      <T size={small ? 14 : 17} color={fg}>{label}</T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
  panel: { borderWidth: 3, padding: 14 },
  btn: { borderWidth: 3, borderBottomWidth: 6, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
});
