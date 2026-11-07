// 食品表示よみ の問題（ブラウザと node の両方で使う）。
// 問題は全部ここに並べて作る（BANK）。1問は「種類|中身の名前」の key を持ち、同じ key ならいつも同じ問題・同じ並びの選び肢になる。
// 中身は消費者庁の食品表示の案内に合わせる（出どころは SRC。遊び方・README にも書く）。商品・会社の名前はすべて架空。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ日なら、どの端末でも同じ問題になる。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];

  // 出どころ（短い名前と URL）。どれも消費者庁（caa.go.jp）の資料
  const SRC = {
    kigen: ["消費者庁「食品期限表示の設定のためのガイドライン」", "https://www.caa.go.jp/policies/policy/food_labeling/food_labeling_act/assets/food_labeling_cms201_250328_1029.pdf"],
    loss: ["消費者庁「期限表示（消費期限と賞味期限）」の啓発資料", "https://www.caa.go.jp/policies/policy/consumer_policy/information/food_loss/efforts/assets/consumer_education_cms201_260630_09.pdf"],
    al: ["消費者庁「食物アレルギー表示に関する情報」", "https://www.caa.go.jp/policies/policy/food_labeling/food_sanitation/allergy/"],
    alhb: ["消費者庁「加工食品の食物アレルギー表示ハンドブック」（2026年4月版）", "https://www.caa.go.jp/policies/policy/food_labeling/food_sanitation/allergy/assets/food_labeling_cms204_260401_02.pdf"],
    tenka: ["消費者庁「食品添加物の表示」", "https://www.caa.go.jp/policies/policy/food_labeling/food_sanitation/food_additive/assets/food_labeling_cms204_210408_01.pdf"],
    pam: ["消費者庁「知っていますか？ 食品表示」（パンフレット）", "https://www.caa.go.jp/policies/policy/food_labeling/information/pamphlets/assets/food_labeling_cms201_250512_01.pdf"],
    nut: ["消費者庁「栄養成分表示を活用しよう」", "https://www.caa.go.jp/policies/policy/food_labeling/information/pamphlets/assets/food_labeling_cms201_250512_02.pdf"],
    gen: ["消費者庁「原料原産地表示 Q&A」", "https://www.caa.go.jp/policies/policy/food_labeling/quality/country_of_origin/qa/"],
    fusiyo: ["消費者庁「食品添加物の不使用表示に関するガイドライン」(2022)", "https://www.caa.go.jp/policies/policy/food_labeling/food_labeling_act/assets/food_labeling_cms201_220330_25.pdf"],
  };

  // アレルギー：表示の義務（特定原材料）と、すすめ（特定原材料に準ずるもの）。2026年4月からカシューナッツが義務（経過措置があるので問題の答えにはしない）
  const GIMU = ["えび", "かに", "くるみ", "小麦", "そば", "卵", "乳", "落花生"];
  const SUSUME = ["アーモンド", "あわび", "いか", "いくら", "オレンジ", "キウイフルーツ", "牛肉", "ごま", "さけ", "さば", "大豆", "鶏肉", "バナナ", "ピスタチオ", "豚肉", "マカダミアナッツ", "もも", "やまいも", "りんご", "ゼラチン"];
  const AL_ORDER = [...GIMU, "カシューナッツ", ...SUSUME];
  const alName = (a) => (a === "乳" ? "乳成分" : a);

  // 商品（すべて架空）。g：原材料（重さの多い順）[名前, そこから来るアレルゲン]、t：添加物（多い順）、k：期限の種類（s=消費・m=賞味）、
  // ym：賞味期限を年月で書く（作ってから3か月を超えるもの）、cold：要冷蔵、o：重さ1位の原材料の産地、n：栄養成分 [どの量あたり, 熱量, たんぱく質, 脂質, 炭水化物, 食塩相当量]
  const P = [
    { id: "bento", nm: "幕の内弁当", mei: "弁当", g: [["ご飯", []], ["鶏肉の唐揚げ", ["小麦", "大豆", "鶏肉"]], ["焼き鮭", ["さけ"]], ["卵焼き", ["卵"]], ["煮物", ["大豆"]], ["ポテトサラダ", ["卵", "乳"]]], t: ["調味料（アミノ酸等）", "pH調整剤", "着色料（カロチノイド）"], vol: "1食", k: "s", cold: false, hz: "直射日光・高温多湿を避けて保存", o: null, n: ["1食あたり", 720, 24.1, 21.5, 104.3, 3.2], mk: "こもれび総菜株式会社" },
    { id: "sand", nm: "たまごサンド", mei: "調理パン", g: [["パン", ["小麦", "乳", "大豆"]], ["卵フィリング", ["卵"]], ["マヨネーズ", ["卵", "大豆"]], ["レタス", []]], t: ["乳化剤", "イーストフード", "調味料（アミノ酸）"], vol: "2個", k: "s", cold: true, hz: "10℃以下で保存", o: null, n: ["1包装あたり", 312, 11.4, 16.2, 30.1, 1.4], mk: "あさひベーカリー株式会社" },
    { id: "pan", nm: "山型食パン", mei: "食パン", g: [["小麦粉", ["小麦"]], ["砂糖", []], ["バター", ["乳"]], ["食塩", []], ["パン酵母", []]], t: ["乳化剤（大豆由来）"], vol: "6枚", k: "s", cold: false, hz: "直射日光・高温多湿を避けて保存", o: null, n: ["1枚あたり", 158, 5.3, 2.4, 28.6, 0.7], mk: "あさひベーカリー株式会社" },
    { id: "psala", nm: "ポテトサラダ", mei: "そうざい（サラダ）", g: [["じゃがいも", []], ["マヨネーズ", ["卵", "大豆"]], ["にんじん", []], ["きゅうり", []], ["ハム", ["豚肉", "乳"]]], t: ["調味料（アミノ酸等）", "酸味料", "保存料（ソルビン酸K）"], vol: "150g", k: "s", cold: true, hz: "10℃以下で保存", o: "国産", n: ["100gあたり", 162, 2.4, 11.0, 13.5, 1.1], mk: "こもれび総菜株式会社" },
    { id: "onigiri", nm: "鮭おにぎり", mei: "おにぎり", g: [["ご飯", []], ["鮭フレーク", ["さけ", "大豆"]], ["のり", []], ["食塩", []]], t: ["調味料（アミノ酸等）"], vol: "1個", k: "s", cold: false, hz: "直射日光・高温多湿を避けて保存", o: null, n: ["1個あたり", 178, 4.6, 1.5, 36.4, 1.2], mk: "こもれび総菜株式会社" },
    { id: "chips", nm: "ポテトチップス うすしお", mei: "ポテトチップス", g: [["じゃがいも", []], ["植物油", []], ["食塩", []]], t: ["調味料（アミノ酸）"], vol: "60g", k: "m", ym: true, cold: false, hz: "直射日光・高温多湿を避けて保存", o: null, n: ["1袋（60g）あたり", 336, 3.1, 21.4, 32.6, 0.5], mk: "ほしぞら製菓株式会社" },
    { id: "cookie", nm: "チョコチップクッキー", mei: "焼菓子", g: [["小麦粉", ["小麦"]], ["砂糖", []], ["ショートニング", []], ["チョコレートチップ", ["乳", "大豆"]], ["全卵", ["卵"]], ["全粉乳", ["乳"]]], t: ["膨張剤", "乳化剤（大豆由来）", "香料"], vol: "12枚", k: "m", ym: true, cold: false, hz: "直射日光・高温多湿を避けて保存", o: null, n: ["1枚あたり", 54, 0.7, 2.8, 6.6, 0.04], mk: "ほしぞら製菓株式会社" },
    { id: "udon", nm: "きつねうどん（カップ）", mei: "即席カップめん", g: [["油揚げめん", ["小麦", "大豆"]], ["スープ", ["小麦", "大豆", "さば"]], ["かやく（味付油揚げ・かまぼこ）", ["卵", "大豆"]]], t: ["加工でん粉", "調味料（アミノ酸等）", "炭酸カルシウム", "カラメル色素"], vol: "96g（めん72g）", k: "m", cold: false, hz: "においの強いもののそばを避け、常温で保存", o: null, n: ["1食（96g）あたり", 432, 9.8, 19.6, 54.2, 5.1], mk: "みなと食品株式会社" },
    { id: "milk", nm: "おいしい牛乳", mei: "牛乳", g: [["生乳", ["乳"]]], t: [], vol: "1000ml", k: "m", cold: true, hz: "10℃以下で保存", o: null, n: ["200mlあたり", 137, 6.8, 7.8, 9.9, 0.2], mk: "そよかぜ乳業株式会社" },
    { id: "yog", nm: "まろやかヨーグルト", mei: "はっ酵乳", g: [["生乳", ["乳"]], ["乳製品", ["乳"]], ["砂糖", []]], t: [], vol: "400g", k: "m", cold: true, hz: "10℃以下で保存", o: null, n: ["100gあたり", 84, 3.6, 3.0, 10.7, 0.1], mk: "そよかぜ乳業株式会社" },
    { id: "nuts", nm: "ミックスナッツ", mei: "ナッツ類", g: [["アーモンド", ["アーモンド"]], ["くるみ", ["くるみ"]], ["マカダミアナッツ", ["マカダミアナッツ"]], ["植物油", []], ["食塩", []]], t: [], vol: "200g", k: "m", ym: true, cold: false, hz: "直射日光・高温多湿を避けて保存", o: "アメリカ", n: ["25gあたり", 156, 4.8, 14.1, 3.6, 0.1], mk: "みなと食品株式会社" },
    { id: "saba", nm: "さば水煮（缶詰）", mei: "さば水煮", g: [["さば", ["さば"]], ["食塩", []]], t: [], vol: "190g（固形量140g）", k: "m", ym: true, cold: false, hz: "直射日光を避け、常温で保存", o: null, n: ["1缶（190g）あたり", 330, 33.1, 21.7, 0.4, 1.6], mk: "うみかぜ水産株式会社" },
    { id: "ebi", nm: "えびせんべい", mei: "米菓", g: [["でん粉", []], ["えび", ["えび"]], ["植物油", []], ["砂糖", []], ["食塩", []]], t: ["調味料（アミノ酸等）", "膨張剤"], vol: "80g", k: "m", ym: true, cold: false, hz: "直射日光・高温多湿を避けて保存", o: null, n: ["1袋（80g）あたり", 404, 4.2, 18.6, 54.8, 1.3], mk: "ほしぞら製菓株式会社" },
    { id: "kani", nm: "かに風味かまぼこ", mei: "風味かまぼこ", g: [["魚肉", []], ["でん粉", []], ["卵白", ["卵"]], ["かにエキス", ["かに"]], ["食塩", []]], t: ["調味料（アミノ酸等）", "着色料（カロチノイド、紅麹）"], vol: "80g", k: "m", cold: true, hz: "10℃以下で保存", o: null, n: ["100gあたり", 89, 12.1, 0.4, 9.2, 2.2], mk: "うみかぜ水産株式会社" },
    { id: "pbutter", nm: "ピーナッツバター", mei: "ピーナッツバター", g: [["落花生", ["落花生"]], ["砂糖", []], ["植物油脂", []], ["食塩", []]], t: [], vol: "200g", k: "m", ym: true, cold: false, hz: "直射日光・高温多湿を避けて保存", o: "アメリカ", n: ["大さじ1杯（17g）あたり", 108, 4.2, 8.6, 3.5, 0.2], mk: "みなと食品株式会社" },
    { id: "soba", nm: "信州風ざるそば（乾めん）", mei: "干しそば", g: [["小麦粉", ["小麦"]], ["そば粉", ["そば"]], ["食塩", []], ["やまいも粉", ["やまいも"]]], t: [], vol: "270g（3人前）", k: "m", ym: true, cold: false, hz: "直射日光・高温多湿を避けて保存", o: null, n: ["1人前（90g）あたり", 311, 10.4, 1.6, 64.2, 2.0], mk: "みなと食品株式会社" },
    { id: "curry", nm: "ココナッツカレー（レトルト）", mei: "カレー", g: [["野菜（じゃがいも・たまねぎ・にんじん）", []], ["鶏肉", ["鶏肉"]], ["ココナッツミルク", []], ["小麦粉", ["小麦"]], ["カレー粉", []], ["食塩", []]], t: ["増粘剤（加工でん粉）", "調味料（アミノ酸等）", "カラメル色素"], vol: "180g", k: "m", ym: true, cold: false, hz: "直射日光を避け、常温で保存", o: null, n: ["1袋（180g）あたり", 198, 7.2, 10.8, 18.1, 2.3], mk: "みなと食品株式会社" },
    { id: "choco", nm: "ビターチョコレート", mei: "チョコレート", g: [["カカオマス", []], ["砂糖", []], ["カカオバター", []], ["全粉乳", ["乳"]]], t: ["乳化剤（大豆由来）", "香料"], vol: "50g", k: "m", ym: true, cold: false, hz: "28℃以下で保存", o: null, n: ["1枚（50g）あたり", 282, 4.3, 19.6, 22.5, 0.02], mk: "ほしぞら製菓株式会社" },
    { id: "juice", nm: "100%りんごジュース", mei: "りんごジュース（濃縮還元）", g: [["りんご", ["りんご"]]], t: ["酸化防止剤（ビタミンC）"], vol: "1000ml", k: "m", cold: false, hz: "直射日光・高温を避けて保存", o: null, n: ["200mlあたり", 92, 0, 0, 22.8, 0.02], mk: "そよかぜ乳業株式会社" },
    { id: "gyoza", nm: "焼きぎょうざ（冷凍）", mei: "冷凍ぎょうざ", g: [["野菜（キャベツ・にら・たまねぎ）", []], ["皮", ["小麦", "大豆"]], ["豚肉", ["豚肉"]], ["ごま油", ["ごま"]], ["しょうゆ", ["小麦", "大豆"]]], t: ["調味料（アミノ酸等）", "加工でん粉"], vol: "12個（276g）", k: "m", ym: false, cold: false, frozen: true, hz: "-18℃以下で保存", o: null, n: ["1個（23g）あたり", 46, 1.6, 2.2, 5.1, 0.25], mk: "こもれび総菜株式会社" },
    { id: "natto", nm: "小粒納豆", mei: "納豆", g: [["大豆", ["大豆"]], ["納豆菌", []], ["たれ", ["小麦", "大豆"]], ["からし", []]], t: ["調味料（アミノ酸等）"], vol: "45g×3", k: "s", cold: true, hz: "10℃以下で保存", o: "アメリカ", n: ["1パック（45g）あたり", 90, 7.4, 4.5, 5.4, 0.6], mk: "こもれび食品株式会社" },
    { id: "takuan", nm: "たくあん漬け", mei: "ぬか漬け", g: [["だいこん", []], ["漬け原材料（米ぬか・食塩・砂糖）", []]], t: ["調味料（アミノ酸等）", "甘味料（ステビア）", "着色料（ウコン）"], vol: "200g", k: "m", cold: true, hz: "10℃以下で保存", o: "国産", n: ["100gあたり", 43, 0.6, 0.1, 10.8, 3.3], mk: "こもれび食品株式会社" },
    { id: "shoga", nm: "豚肉のしょうが焼き", mei: "そうざい", g: [["豚肉", ["豚肉"]], ["たまねぎ", []], ["しょうゆ", ["小麦", "大豆"]], ["砂糖", []], ["しょうが", []]], t: ["調味料（アミノ酸等）", "増粘剤（キサンタン）"], vol: "160g", k: "s", cold: true, hz: "10℃以下で保存", o: "国産", n: ["100gあたり", 210, 14.2, 13.1, 8.6, 1.4], mk: "こもれび総菜株式会社" },
    { id: "gomaae", nm: "ほうれん草のごまあえ", mei: "そうざい（あえ物）", g: [["ほうれん草", []], ["ごま", ["ごま"]], ["砂糖", []], ["しょうゆ", ["小麦", "大豆"]]], t: ["調味料（アミノ酸等）"], vol: "90g", k: "s", cold: true, hz: "10℃以下で保存", o: "国産", n: ["1パック（90g）あたり", 78, 3.1, 4.3, 7.0, 0.8], mk: "こもれび総菜株式会社" },
  ];
  const PD = Object.fromEntries(P.map((p) => [p.id, p]));
  const alOf = (p) => { const s = new Set([...p.g.flatMap((x) => x[1]), ...p.t.flatMap((x) => (/大豆由来/.test(x) ? ["大豆"] : []))]); return AL_ORDER.filter((a) => s.has(a)); };

  // ラベル（一括表示）の行を作る。date：期限の日（"2026.11.08" や "2027.03"）
  function label(p, date, extra) {
    const al = alOf(p), gen = p.g.map((x) => x[0]).join("、") + (al.length ? `（一部に${al.map(alName).join("・")}を含む）` : "");
    const rows = [["名称", p.mei], ["原材料名", (p.o && extra && extra.origin ? gen.replace(p.g[0][0], `${p.g[0][0]}（${p.o}）`) : gen) + (p.t.length ? " / " + p.t.join("、") : "")], ["内容量", p.vol],
      [p.k === "s" ? "消費期限" : "賞味期限", date], ["保存方法", p.hz], ["製造者", p.mk]];
    const c = { t: "label", nm: p.nm, rows };
    if (extra && extra.nut) c.nut = p.n;
    if (extra && extra.front) c.front = extra.front;
    if (extra && extra.now) c.now = extra.now;
    return c;
  }
  const dateOf = (p) => (p.ym ? "2027.06" : p.k === "s" ? "2026.11.08" : "2026.12.15");
  const plusDays = (s, n) => { const d = new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10) + n)); return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${String(d.getUTCDate()).padStart(2, "0")}`; };
  const fmt = (v) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100));

  const B = []; // BANK
  const add = (kind, id, q) => B.push({ key: kind + "|" + id, kind, ...q });

  // ---- やさしい ----
  // 消費期限を過ぎた（弁当・総菜など傷みやすいもの）→ 食べないほうがよい
  P.filter((p) => p.k === "s").forEach((p) => [1, 2, 3].forEach((n) => {
    const d = "2026.11.08";
    add("shohi", `${p.id}-${n}`, { scene: label(p, d, { now: `今日は ${plusDays(d, n)}` }), text: "この食品、食べてもいい？",
      opts: ["食べないほうがよい", "まだおいしく食べられる", "期限は気にしなくてよい"], ans: "食べないほうがよい", src: ["kigen", "loss"],
      why: "「消費期限」は、安全に食べられる期限です。傷みやすい食品に付きます。過ぎたら食べないほうがよいとされています。" });
  }));
  // 賞味期限を少し過ぎた（開けていない・保存方法を守った）→ すぐ食べられなくなるわけではない
  P.filter((p) => p.k === "m" && !p.cold && !p.ym).concat(P.filter((p) => p.k === "m" && p.ym)).forEach((p) => [3, 10].forEach((n) => {
    const d = p.ym ? "2026.10" : "2026.11.01", now = p.ym ? `今日は 2026.11.${String(n).padStart(2, "0")}（まだ開けていない）` : `今日は ${plusDays(d, n)}（まだ開けていない）`;
    add("shomi", `${p.id}-${n}`, { scene: label(p, d, { now }), text: "書いてある保存方法は守っていました。この食品は？",
      opts: ["すぐに食べられなくなるわけではない", "1日でも過ぎたら、必ず捨てる", "過ぎたら、すぐに傷むという意味"], ans: "すぐに食べられなくなるわけではない", src: ["kigen", "loss"],
      why: "「賞味期限」は、おいしく食べられる期限です。過ぎても、すぐに食べられなくなるわけではありません。見た目やにおいで確かめます。" });
  }));
  // いちばん多く使っている原材料（原材料は重さの多い順）
  P.filter((p) => p.g.length >= 3).forEach((p) => {
    const g = p.g.map((x) => x[0]);
    add("first", p.id, { scene: label(p, dateOf(p)), text: "この食品で、いちばん多く使っている原材料は？",
      opts: [g[0], g[1], g[g.length - 1]], ans: g[0], src: ["pam"], why: "原材料は、重さの多いものから順に書きます。いちばん前に書いてあるものが、いちばん多く使われています。" });
    add("first", p.id + "-2", { scene: label(p, dateOf(p)), text: "この食品で、2番目に多く使っている原材料は？",
      opts: [g[1], g[0], g[g.length - 1]], ans: g[1], src: ["pam"], why: "原材料は、重さの多いものから順に書きます。前から2番目のものが、2番目に多く使われています。" });
  });
  // アレルギー（一括表示の「一部に…を含む」を読む）
  P.forEach((p) => {
    const al = alOf(p), has = GIMU.filter((a) => al.includes(a)), not = GIMU.filter((a) => !al.includes(a));
    [...has.slice(0, 3), ...not.slice(0, 2)].forEach((a) => {
      const yes = al.includes(a);
      add("allergy", `${p.id}-${a}`, { scene: label(p, dateOf(p)), text: `${a}のアレルギーの人。この食品の表示に、${alName(a)}を使っていると書いてある？`,
        opts: ["書いてある", "書いていない"], ans: yes ? "書いてある" : "書いていない", src: ["al", "alhb"],
        why: yes ? `原材料の最後の「（一部に…を含む）」に、${alName(a)}が入っています。アレルギーの表示は、ここにまとめて書くことができます。`
          : `「（一部に…を含む）」に${alName(a)}はありません。${a}は表示が義務の品目なので、使っていれば必ず書かれます。` });
    });
  });
  // 栄養成分表示を読む（食塩相当量・熱量）
  P.forEach((p) => {
    const n = p.n;
    add("salt", p.id, { scene: label(p, dateOf(p), { nut: true }), text: `${n[0].replace("あたり", "")}の塩分（食塩相当量）は？`,
      opts: [`${fmt(n[5])}g`, `${fmt(n[2])}g`, `${fmt(n[3])}g`].filter((v, i, a) => a.indexOf(v) === i), ans: `${fmt(n[5])}g`, src: ["nut"],
      why: "塩分は、栄養成分表示の「食塩相当量」を見ます。熱量・たんぱく質・脂質・炭水化物・食塩相当量の順に並んでいます。" });
    add("salt", p.id + "-e", { scene: label(p, dateOf(p), { nut: true }), text: `${n[0].replace("あたり", "")}のエネルギー（熱量）は？`,
      opts: [`${n[1]}kcal`, `${Math.round(n[1] / 2)}kcal`, `${n[1] * 2}kcal`], ans: `${n[1]}kcal`, src: ["nut"],
      why: "エネルギーは、栄養成分表示のいちばん上の「熱量」です。どの量あたりの数かも一緒に見ます。" });
  });

  // ---- ふつう ----
  // 「100gあたり」の数を、1袋ぶんに直す
  P.filter((p) => /^100gあたり$/.test(p.n[0]) && /^\d+g$/.test(p.vol)).forEach((p) => {
    const v = parseInt(p.vol, 10), r = v / 100, e = Math.round(p.n[1] * r), s = Math.round(p.n[5] * r * 10) / 10;
    add("per", p.id + "-e", { scene: label(p, dateOf(p), { nut: true }), text: `この1パック（${p.vol}）を全部食べると、エネルギーはどれくらい？`,
      opts: [`約${e}kcal`, `約${p.n[1]}kcal`, `約${Math.round(p.n[1] / r)}kcal`].filter((x, i, a) => a.indexOf(x) === i), ans: `約${e}kcal`, src: ["nut"],
      why: `数は「100gあたり」です。内容量は${p.vol}なので、${fmt(r)}倍します。どの量あたりの数かを、先に見ます。` });
    add("per", p.id + "-s", { scene: label(p, dateOf(p), { nut: true }), text: `この1パック（${p.vol}）を全部食べると、塩分（食塩相当量）はどれくらい？`,
      opts: [`約${fmt(s)}g`, `約${fmt(p.n[5])}g`, `約${fmt(Math.round(p.n[5] / r * 10) / 10)}g`].filter((x, i, a) => a.indexOf(x) === i), ans: `約${fmt(s)}g`, src: ["nut"],
      why: `数は「100gあたり」です。内容量は${p.vol}なので、${fmt(r)}倍します。どの量あたりの数かを、先に見ます。` });
  });
  P.filter((p) => !/^(100g|1袋|1食|1缶|1包装)/.test(p.n[0])).forEach((p) => {
    const unit = p.n[0].replace("あたり", "");
    if (unit === p.vol || unit.includes(`（${p.vol}）`)) return; // 表示の量が内容量の全部と同じなら、どちらの選び肢も正しくなる
    add("per", p.id + "-u", { scene: label(p, dateOf(p), { nut: true }), text: `表示の熱量（${p.n[1]}kcal）は、どれだけ食べたときの数？`,
      opts: [unit, `内容量の全部（${p.vol}）`, "100g"].filter((x, i, a) => a.indexOf(x) === i), ans: unit, src: ["nut"],
      why: `栄養成分表示の上に「${p.n[0]}」と書いてあります。袋全部の数とは限らないので、まずここを見ます。` });
  });
  // 代わりの書き方（代替表記）
  const ALT = [["玉子", "卵"], ["たまご", "卵"], ["エッグ", "卵"], ["ミルク", "乳"], ["ピーナッツ", "落花生"], ["こむぎ", "小麦"]];
  const SNACK = ["パンケーキ", "焼き菓子", "ソース"];
  ALT.forEach(([w, a], i) => SNACK.forEach((s, j) => {
    const others = GIMU.filter((x) => x !== a), o2 = [others[(i + j) % others.length], others[(i + j + 3) % others.length]];
    add("alt", `${i}-${j}`, { scene: { t: "raw", nm: s, line: `原材料名：…、${w}、…` }, text: `原材料に「${w}」とあります。どのアレルギーの人が気をつける？`,
      opts: [a, ...o2], ans: a, src: ["alhb"], why: `「${w}」は「${a}」の代わりの書き方として認められています。名前がちがっても同じものです。` });
  }));
  // 広げた書き方（拡大表記）：名前の中にアレルゲンが分かる言葉があるもの
  const WIDE = [["バター", "乳"], ["チーズ", "乳"], ["牛乳", "乳"], ["乳糖", "乳"], ["アイスクリーム", "乳"], ["小麦粉", "小麦"], ["鶏卵", "卵"], ["うずら卵", "卵"], ["ハムエッグ", "卵"], ["ピーナッツバター", "落花生"]];
  WIDE.forEach(([w, a], i) => [0, 1].forEach((j) => {
    const others = GIMU.filter((x) => x !== a), o2 = [others[(i * 2 + j) % others.length], others[(i * 2 + j + 4) % others.length]];
    add("kakudai", `${i}-${j}`, { scene: { t: "raw", nm: SNACK[(i + j) % 3], line: `原材料名：…、${w}、…` }, text: `原材料の「${w}」。これはどのアレルゲンを含むと分かる？`,
      opts: [a, ...o2], ans: a, src: ["alhb"], why: `「${w}」は、名前から${alName(a)}を含むと分かる書き方（拡大表記）として、ハンドブックに載っています。` });
  }));
  // 添加物（「/」より後ろ）
  P.filter((p) => p.t.length).forEach((p) => p.t.slice(0, 2).forEach((t, i) => {
    const g = p.g.map((x) => x[0]);
    add("tenka", `${p.id}-${i}`, { scene: label(p, dateOf(p)), text: "この表示で、添加物（食品添加物）はどれ？",
      opts: [t, g[0], g[Math.min(1, g.length - 1)]].filter((x, k, a) => a.indexOf(x) === k), ans: t, src: ["tenka", "pam"],
      why: "添加物は、原材料と分けて書きます。「/」で区切ったり、行を変えたりします。「/」より後ろが添加物です。" });
  }));
  // 開けたあと
  P.filter((p) => p.k === "m" && !p.frozen).forEach((p) => [3, 7].forEach((n) => {
    add("open", `${p.id}-${n}`, { scene: label(p, p.ym ? "2027.06" : "2026.12.15", { now: `今日は 2026.11.${String(n + 2).padStart(2, "0")}・${n}日前に開けた` }), text: "賞味期限はまだ先です。この食品は？",
      opts: ["開けたら、期限に関係なく早めに食べる", "書いてある期限まで、いつでも大丈夫", "開けると期限がのびる"], ans: "開けたら、期限に関係なく早めに食べる", src: ["kigen", "loss"],
      why: "期限は、開ける前に、書いてある保存方法で保存したときのものです。開けたあとは当てはまらないので、早めに食べます。" });
  }));
  // 年月だけの賞味期限は、その月の終わりまで
  const LAST = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  P.filter((p) => p.ym).slice(0, 4).forEach((p, pi) => [2027, 2028].forEach((y) => [2, 3, 6, 9, 11].forEach((m, mi) => {
    if ((pi + mi + y) % 2) return;
    const mm = String(m).padStart(2, "0"), last = LAST(y, m);
    add("ym", `${p.id}-${y}${mm}`, { scene: label(p, `${y}.${mm}`), text: `賞味期限「${y}.${mm}」。いつまで、おいしく食べられる？`,
      opts: [`${y}年${m}月${last}日まで`, `${y}年${m}月1日まで`, `${y}年${m}月15日まで`], ans: `${y}年${m}月${last}日まで`, src: ["kigen"],
      why: `作ってから3か月を超える食品は、賞味期限を年月だけで書けます。そのときは、その月の終わり（${m}月${last}日）までと読みます。` });
  })));
  // 保存方法を守らなかったとき
  P.filter((p) => p.cold).forEach((p) => ["暖房の効いた部屋に半日出したままにした", "買い物のあと、車の中に3時間置いた"].forEach((w, i) => {
    add("hozon", `${p.id}-${i}`, { scene: label(p, p.k === "s" ? "2026.11.08" : "2026.11.20", { now: `今日は 2026.11.07・${w}` }), text: "この食品の期限はどうなる？",
      opts: ["書いてある期限は当てはまらない", "期限まで大丈夫", "期限が1日のびる"], ans: "書いてある期限は当てはまらない", src: ["kigen", "loss"],
      why: "期限は、書いてある保存方法を守ったときのものです。「10℃以下で保存」を守らなかったら、期限は当てはまりません。" });
  }));
  // 2つの商品の比べっこ（同じ「1袋あたり」でない数は、そろえてから比べる）
  const CMP = [["chips", "ebi"], ["udon", "curry"], ["saba", "curry"], ["chips", "choco"], ["ebi", "choco"], ["udon", "saba"], ["chips", "curry"], ["ebi", "saba"]];
  CMP.forEach(([a, b]) => ["s", "e"].forEach((w) => {
    const A = PD[a], Bp = PD[b], va = w === "s" ? A.n[5] : A.n[1], vb = w === "s" ? Bp.n[5] : Bp.n[1];
    if (va === vb) return;
    const less = va < vb ? A.nm : Bp.nm;
    add("compare", `${a}-${b}-${w}`, { scene: { t: "two", a: label(A, dateOf(A), { nut: true }), b: label(Bp, dateOf(Bp), { nut: true }) },
      text: `どちらも1袋（1缶・1食）全部食べるとき、${w === "s" ? "塩分（食塩相当量）" : "エネルギー（熱量）"}が少ないのは？`,
      opts: [A.nm, Bp.nm, "同じ"], ans: less, src: ["nut"],
      why: `どちらも1袋（1缶・1食）あたりの数なので、そのまま比べられます。${w === "s" ? `食塩相当量は ${fmt(A.n[5])}g と ${fmt(Bp.n[5])}g` : `熱量は ${A.n[1]}kcal と ${Bp.n[1]}kcal`} です。` });
  }));

  // ---- むずかしい ----
  // ナトリウムから食塩相当量へ（ナトリウム(mg)×2.54÷1000）
  [200, 300, 400, 500, 600, 700, 800, 900, 1000, 1200, 1400, 1500, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000].forEach((na, i) => {
    const s = Math.round(na * 2.54 / 100) / 10, w = Math.round(na / 100) / 10;
    const decoy = Math.round(na * 2.54 / 1000 * 2 * 10) / 10;
    add("natrium", "n" + na, { scene: { t: "raw", nm: ["スープの素", "せんべい", "ふりかけ", "たれ"][i % 4], line: `栄養成分表示（1袋あたり）… ナトリウム ${na}mg` }, text: "ナトリウムの量しか書いていません。塩分（食塩相当量）にすると、だいたい何g？",
      opts: [`約${fmt(s)}g`, `約${fmt(w)}g`, `約${fmt(decoy)}g`].filter((x, k, a) => a.indexOf(x) === k), ans: `約${fmt(s)}g`, src: ["nut"],
      why: `食塩相当量（g）は、ナトリウム（mg）×2.54÷1000 で出せます。${na}mg なら、約${fmt(s)}g です。` });
  });
  // 「乳」に見えて乳ではない言葉
  const MILK = ["バター", "チーズ", "牛乳", "乳糖", "アイスクリーム", "ミルク"], NOTMILK = ["乳化剤", "乳酸菌", "乳酸", "ココナッツミルク", "カカオバター"];
  MILK.forEach((m, i) => [0, 1, 2, 3, 4].forEach((j) => {
    const a = NOTMILK[j], b = NOTMILK[(j + 1 + i) % 5];
    if (a === b) return;
    add("nyuka", `${i}-${j}`, { scene: { t: "raw", nm: "乳のアレルギーの人が見る原材料", line: `${a}、${m}、${b}` }, text: "この3つのうち、乳を含むものはどれ？",
      opts: [m, a, b], ans: m, src: ["alhb"],
      why: `「${a}」「${b}」は乳ではありません。名前に「乳」「ミルク」「バター」があっても、乳と関係ないものがあります。` });
  }));
  // 表示が義務か、すすめか
  GIMU.forEach((g, i) => [0, 1, 2].forEach((j) => {
    const s1 = SUSUME[(i * 3 + j) % SUSUME.length], s2 = SUSUME[(i * 3 + j + 7) % SUSUME.length];
    add("gimu", `g${i}-${j}`, { scene: { t: "q", text: "アレルギーの表示で、使っていたら必ず書かないといけない（義務の）ものはどれ？" }, text: "",
      opts: [g, s1, s2], ans: g, src: ["al", "alhb"],
      why: `${g}は表示が義務の品目です。${s1}・${s2}は「なるべく書く」とされる品目で、書いていないこともあります。` });
  }));
  SUSUME.forEach((s, i) => {
    const g1 = GIMU[i % GIMU.length], g2 = GIMU[(i + 3) % GIMU.length];
    add("gimu", `s${i}`, { scene: { t: "q", text: "アレルギーの表示で、「なるべく書く」とされていて、書いていないこともあるのはどれ？" }, text: "",
      opts: [s, g1, g2], ans: s, src: ["al", "alhb"],
      why: `${s}は表示が義務ではなく「なるべく書く」品目です。表示に無くても、使っていないとは言い切れません。${g1}・${g2}は義務です。` });
  });
  // 「○○製造」「輸入」の意味
  const SEIZO = [["りんご果汁", "ドイツ", "りんご"], ["チョコレート", "ベルギー", "カカオ豆"], ["オレンジ果汁", "ブラジル", "オレンジ"], ["ぶどう果汁", "チリ", "ぶどう"], ["小麦粉", "国内", "小麦"], ["トマトペースト", "イタリア", "トマト"]];
  SEIZO.forEach(([g, c, raw], i) => {
    add("seizo", "z" + i, { scene: { t: "raw", nm: "原材料名のいちばん前", line: `${g}（${c}製造）、…` }, text: `「${g}（${c}製造）」の「${c}」は何を表している？`,
      opts: [`${g}を作った場所`, `${raw}を育てた場所`, "売っているお店の場所"], ans: `${g}を作った場所`, src: ["gen", "pam"],
      why: `「○○製造」は、その原材料（${g}）を作った場所です。${raw}の産地とは限りません。` });
  });
  [["牛肉", "輸入"], ["豚肉", "輸入"], ["えび", "輸入"], ["大豆", "輸入"]].forEach(([g, w], i) => {
    add("seizo", "y" + i, { scene: { t: "raw", nm: "原材料名のいちばん前", line: `${g}（${w}）、…` }, text: `「${g}（輸入）」の「輸入」は、どういう意味？`,
      opts: ["外国の産地（3か国以上）をまとめて書いた", "国産と外国産をまぜた", "産地が分からない"], ans: "外国の産地（3か国以上）をまとめて書いた", src: ["gen"],
      why: "3か国以上の外国から入れた原材料は、まとめて「輸入」と書くことができます。国産はふくみません。" });
  });
  // 原料原産地：書かれるのは重さ1位の原材料
  P.filter((p) => p.o && p.g.length >= 3 && !/製造/.test(p.o)).forEach((p) => {
    add("genzan", p.id, { scene: label(p, dateOf(p), { origin: true }), text: `原材料の中で、「${p.g[0][0]}」にだけ産地が書いてあります。なぜ？`,
      opts: ["いちばん多く使っている原材料だから", "いちばん高い原材料だから", "体によい原材料だから"], ans: "いちばん多く使っている原材料だから", src: ["gen", "pam"],
      why: "加工食品は、重さがいちばん多い原材料の産地を書く決まりです（原料原産地表示）。ほかの原材料は書かなくてもかまいません。" });
  });
  // 「不使用」「無添加」の読み方
  P.filter((p) => p.t.length && !p.t.some((t) => /保存料/.test(t))).forEach((p) => {
    add("mutenka", p.id, { scene: label(p, dateOf(p), { front: "保存料不使用" }), text: "表に「保存料不使用」と書いてあります。正しい読み方は？",
      opts: ["保存料は使っていない。ほかの添加物は使っていることがある", "添加物を1つも使っていない", "体によいと国が認めた"], ans: "保存料は使っていない。ほかの添加物は使っていることがある", src: ["fusiyo", "tenka"],
      why: "「保存料不使用」は保存料のことだけです。ほかの添加物は、原材料名の「/」より後ろで確かめます。" });
  });
  ["ジャム", "ドレッシング", "ソーセージ"].forEach((s, i) => {
    add("mutenka", "m" + i, { scene: { t: "q", text: `${s}の表に、大きく「無添加」とだけ書いてあり、何を使っていないかは書いていません。` }, text: "",
      opts: ["何を使っていないのか分からず、誤解をまねきやすい", "どんな添加物も使っていないと決まっている", "国が安全だと認めたしるし"], ans: "何を使っていないのか分からず、誤解をまねきやすい", src: ["fusiyo"],
      why: "国のガイドラインは、何を使っていないか書かない「無添加」を、誤解をまねくおそれがある表示としています。" });
  });

  // 種類：id・難しさ・帳に出す名前・見るところ（ヒント1）
  const KINDS = [
    { id: "shohi", lv: 0, name: "消費期限", look: "「消費期限」は、何の期限でしょう。" },
    { id: "shomi", lv: 0, name: "賞味期限", look: "「賞味」は、味わうという意味です。" },
    { id: "first", lv: 0, name: "原材料の順番", look: "原材料は、何の順番で並んでいるでしょう。" },
    { id: "allergy", lv: 0, name: "アレルギーの表示", look: "原材料の最後の（ ）の中を見ましょう。" },
    { id: "salt", lv: 0, name: "栄養成分を読む", look: "栄養成分表示の表の中から探しましょう。" },
    { id: "per", lv: 1, name: "どの量あたり？", look: "表の上の「○○あたり」を見ましょう。" },
    { id: "alt", lv: 1, name: "代わりの書き方", look: "ちがう書き方でも、同じものを指す言葉があります。" },
    { id: "kakudai", lv: 1, name: "名前に入った言葉", look: "その名前は、何から作られていますか。" },
    { id: "tenka", lv: 1, name: "添加物はどこ？", look: "原材料名の「/」より後ろを見ましょう。" },
    { id: "open", lv: 1, name: "開けたあと", look: "期限は、開ける前のものでしょうか。" },
    { id: "ym", lv: 1, name: "年月だけの期限", look: "日が書いていないとき、月のどこまででしょう。" },
    { id: "hozon", lv: 1, name: "保存方法と期限", look: "期限は、どんなふうに保存したときのものでしょう。" },
    { id: "compare", lv: 1, name: "2つを比べる", look: "どちらも「どの量あたり」の数か、先に見ましょう。" },
    { id: "natrium", lv: 2, name: "ナトリウムと塩分", look: "ナトリウムの量に2.54をかけて、mgをgに直します。" },
    { id: "nyuka", lv: 2, name: "乳に見える言葉", look: "牛のお乳から作るものは、どれでしょう。" },
    { id: "gimu", lv: 2, name: "義務と、すすめ", look: "必ず書く品目は9つです（2026年4月から）。" },
    { id: "seizo", lv: 2, name: "製造と輸入", look: "（ ）の中の言葉は、どこの何を表すでしょう。" },
    { id: "genzan", lv: 2, name: "産地の表示", look: "原材料は、多い順に並んでいます。" },
    { id: "mutenka", lv: 2, name: "不使用・無添加", look: "何を使っていないと書いてあるか、よく読みましょう。" },
  ];
  B.forEach((q) => { q.lv = KINDS.find((k) => k.id === q.kind).lv; });
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);
  const BANK = Object.fromEntries(B.map((q) => [q.key, q]));
  const keysOf = (kind) => B.filter((q) => q.kind === kind).map((q) => q.key);

  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const pickN = (R, arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };

  // 1問を作る。tag は key（「種類|中身」）。選び肢は key の種で並べ替える（「書いてある／書いていない」は並びのまま）
  function make(tag) {
    const q = BANK[tag]; if (!q) return null;
    const k = BY[q.kind], opts = q.opts.length === 2 ? q.opts.slice() : pickN(rng(seedOf(tag)), q.opts, q.opts.length);
    return { tag, kind: q.kind, lv: k.lv, name: k.name, look: k.look, scene: q.scene, text: q.text || q.scene.text || "", opts, ans: q.ans, why: q.why, src: q.src.map((s) => SRC[s]) };
  }
  const pickKey = (R, kind) => { const ks = keysOf(kind); return ks[Math.floor(R() * ks.length)]; };

  // 今日の5問（やさしい2・ふつう2・むずかしい1）。種類は重ねない
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id) => pickKey(R, id));
  }
  // 上級の3問（むずかしいだけ・今日の5問のむずかしいとは別の種類）
  function hardTags(date) {
    const dh = BANK[dailyTags(date)[4]].kind, R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id) => pickKey(R, id));
  }

  const G = { KINDS, BY, LV, SRC, GIMU, SUSUME, PRODUCTS: P, alOf, BANK, keysOf, kindsOf, seedOf, rng, make, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = G; else root.HYOJI = G;
})(typeof self !== "undefined" ? self : this);
