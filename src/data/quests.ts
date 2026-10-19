export type Category = '創作' | '音楽' | '自然' | '文化' | '生活';
export const CATEGORIES: Category[] = ['創作', '音楽', '自然', '文化', '生活'];

export type Quest = {
  id: number; // #原体験 + id (3 digits)
  emoji: string;
  title: string;
  desc: string;
  time: string;
  category: Category;
  casual?: boolean; // 生活のついでにできる
};

export const QUESTS: Quest[] = [
  { id: 1, emoji: '✏️', title: '物語の続きを一行書く', desc: '紙とペンで「その扉を開けると、」の続きを一行だけ書く', time: '約1分', category: '創作' },
  { id: 2, emoji: '🎨', title: '目を閉じて猫を描く', desc: '上手さは気にせず、目を閉じたまま紙に猫を描いてみる', time: '約1分', category: '創作' },
  { id: 3, emoji: '🎧', title: '知らない国の音楽を聴く', desc: '普段選ばない国の音楽を30秒だけ聴いてみる', time: '約1分', category: '音楽' },
  { id: 4, emoji: '🚶', title: 'いつもと違う道を歩く', desc: '安全で明るい道を選んで、少しだけ遠回りしてみる', time: '帰り道', category: '生活', casual: true },
  { id: 5, emoji: '🌱', title: '足元の植物を観察する', desc: '名前を知らない草を1つ選び、葉の形を3つ言葉にする', time: '約2分', category: '自然' },
  { id: 6, emoji: '🏛️', title: '建物の素材を観察する', desc: '近くの建物の壁・窓・屋根の素材を1つずつ探す', time: '約3分', category: '文化', casual: true },
  { id: 7, emoji: '🌙', title: '空を1分だけ見上げる', desc: '雲か月か星を、スマホを見ずに1分眺める', time: '約1分', category: '自然', casual: true },
  { id: 8, emoji: '🥁', title: '机でリズムを作る', desc: '指で机を叩いて、4拍のオリジナルのリズムを作る', time: '約1分', category: '音楽' },
  { id: 10, emoji: '🍳', title: '食材を1つ新しく選ぶ', desc: '食べたことのない野菜や調味料を1つ手に取ってみる', time: '買い物のついで', category: '生活', casual: true },
  { id: 11, emoji: '📖', title: '知らない言葉を1つ調べる', desc: '最近耳にしてよく分からなかった言葉を、1つだけ調べる', time: '約1分', category: '文化' },
  { id: 12, emoji: '🖋️', title: '左手で名前を書く', desc: '利き手と逆の手で、自分の名前を書いてみる', time: '約1分', category: '創作' },
  { id: 13, emoji: '🌍', title: '外国語で挨拶を1つ覚える', desc: '行ったことのない国の挨拶を調べて、声に出して言う', time: '約1分', category: '文化' },
  { id: 15, emoji: '👂', title: '1分間、音を数える', desc: '目を閉じて、聞こえる音がいくつあるか数える', time: '約1分', category: '自然', casual: true },
  { id: 16, emoji: '🪞', title: '10年後の自分に一言書く', desc: '付箋や紙に、10年後の自分への一言を書いておく', time: '約1分', category: '創作' },
  { id: 17, emoji: '🎼', title: '無音の曲に名前を付ける', desc: '頭の中で浮かんだ1小節に、タイトルを付けてみる', time: '約1分', category: '音楽' },
  { id: 18, emoji: '🛒', title: '知らない店に入ってみる', desc: '前を通るだけだった店に、1分だけ入ってみる', time: '約3分', category: '生活', casual: true },
  { id: 19, emoji: '🍃', title: '風の向きを探す', desc: '外に出て、今どちらから風が吹いているか確かめる', time: '約1分', category: '自然', casual: true },
  { id: 20, emoji: '🧩', title: '漢字を1つ分解してみる', desc: '好きな漢字を部品に分けて、意味を想像してみる', time: '約1分', category: '文化' },
  { id: 22, emoji: '🚃', title: '電車で別の車両に乗る', desc: 'いつもと違う位置から乗り、景色や人を観察する', time: '通勤のついで', category: '生活', casual: true },
];

export const hashtag = (q: Quest) => `#原体験${String(q.id).padStart(3, '0')}`;
