# Tryket

「やってみる、で世界がひらく。」毎日ひとつ、未知の“はじめて”をロケットで打ち上げるアプリ(Expo / React Native、Webでも動作)。

## 動かす

```bash
npm install
npm run web          # http://localhost:8081 (Web)
npm run export:web   # dist/ に静的Webビルドを出力
npm run gen          # ピクセルアート素材を tools/gen.mjs から再生成 (out/)
```

## 構成

- `src/screens/Launch.tsx` 発射演出(つまみスライド→導火線→発射→宇宙→今日の挑戦)
- `src/screens/QuestFlow.tsx` クエスト詳細 → 興味あり/なし → 記録・共有
- `src/screens/Journal.tsx` 積み重ね(カテゴリ別の広がり・履歴・分類変更)
- `src/screens/Life.tsx` 同じ年、違う人生
- `src/data/` 同梱のクエスト・人物データ(`lives.ts` の world は架空サンプル)
- `src/store.tsx` 端末内保存(AsyncStorage)

データはすべて端末内に保存され、サーバーは使いません。
