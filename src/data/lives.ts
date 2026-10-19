export type Life = {
  kind: 'history' | 'world';
  age: number;
  name: string; // history: 実在の人物 / world: 架空のモデルケース
  line: string; // その年齢の頃
  note?: string;
};

// history: 一般に知られている史実の概要(出典の確認・追記は公開前に行う)
// world: 実在の人物ではない「架空のサンプル」。取材コンテンツに差し替える前提。
export const LIVES: Life[] = [
  { kind: 'history', age: 14, name: '藤井聡太', line: '史上最年少でプロ棋士になった。' },
  { kind: 'history', age: 15, name: 'マララ・ユスフザイ', line: '女子教育を訴え続ける中、襲撃を受ける。その後も声をあげ続けた。' },
  { kind: 'history', age: 17, name: '手塚治虫', line: '初めての連載漫画で、プロとしてデビューした。' },
  { kind: 'history', age: 18, name: 'フリーダ・カーロ', line: '重傷を負う事故に遭い、ベッドの上で絵を描き始めた。' },
  { kind: 'history', age: 21, name: 'スティーブ・ジョブズ', line: '友人とともに、ガレージでアップルを創業した。' },
  { kind: 'history', age: 22, name: '松下幸之助', line: '勤めていた会社を辞め、独立の道へ進んだ。' },
  { kind: 'history', age: 25, name: 'J.K.ローリング', line: '電車の中で、ある魔法使いの少年の物語を思いついた。' },
  { kind: 'history', age: 27, name: 'ゴッホ', line: '画家になることを決め、絵を描き始めた。それまでは別の仕事に就いていた。' },
  { kind: 'history', age: 27, name: '渋沢栄一', line: 'パリ万博に随行し、ヨーロッパの産業や社会を目の当たりにした。' },
  { kind: 'history', age: 28, name: '宮沢賢治', line: '生前に出版した詩集と童話集を発表した。当時は大きくは注目されなかった。' },
  { kind: 'history', age: 30, name: 'スティーブ・ジョブズ', line: '自分が創業した会社を、追われるように去ることになった。' },
  { kind: 'history', age: 38, name: '夏目漱石', line: '『吾輩は猫である』の連載を始め、作家としての道を歩み出した。' },
  { kind: 'history', age: 50, name: '伊能忠敬', line: '江戸で天文学を学び直し始めた。のちに日本中を測量して歩く。' },
  { kind: 'history', age: 70, name: '葛飾北斎', line: '代表作の連作を世に出した。それでも「まだ足りない」と描き続けた。' },

  { kind: 'world', age: 15, name: '架空の15歳(ネパール)', line: '山の村から、毎日2時間かけて歩いて学校へ通う。将来は教師になりたい。', note: 'サンプル' },
  { kind: 'world', age: 17, name: '架空の17歳(ブラジル)', line: '昼は家の屋台を手伝い、夜に英語を勉強している。いつか海外で働きたい。', note: 'サンプル' },
  { kind: 'world', age: 19, name: '架空の19歳(ケニア)', line: 'スマホ1台で動画編集を覚え、仕事を請け負い始めた。', note: 'サンプル' },
  { kind: 'world', age: 22, name: '架空の22歳(ドイツ)', line: '大学を休み、1年間かけて自分に合う仕事を探している。', note: 'サンプル' },
  { kind: 'world', age: 24, name: '架空の24歳(インド)', line: '地元の農業をITで変える小さな会社を、友人と立ち上げた。', note: 'サンプル' },
  { kind: 'world', age: 27, name: '架空の27歳(日本)', line: '会社員を続けながら、週末は陶芸の工房に通っている。', note: 'サンプル' },
  { kind: 'world', age: 30, name: '架空の30歳(ペルー)', line: '家族の店を継ぐか、都市へ出るかで迷っている。', note: 'サンプル' },
  { kind: 'world', age: 35, name: '架空の35歳(ノルウェー)', line: '育児休暇を取り、初めて平日の昼の町をゆっくり歩いた。', note: 'サンプル' },
  { kind: 'world', age: 45, name: '架空の45歳(ベトナム)', line: '長年の仕事を離れ、小さなカフェを開く準備をしている。', note: 'サンプル' },
];

// 指定年齢に近い順に、歴史と世界を交互に返す
export function livesFor(age: number) {
  const by = (kind: Life['kind']) =>
    LIVES.filter((l) => l.kind === kind).sort((a, b) => Math.abs(a.age - age) - Math.abs(b.age - age));
  return { history: by('history'), world: by('world') };
}
