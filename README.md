# 食品表示よみ

食品のラベル（一括表示）を見て、期限・アレルギー・原材料・添加物・栄養成分を読み取る1日5問のゲーム。押すだけ、時間制限なし。

- 遊ぶ: https://satou-aaaaa.github.io/shokuhin-hyoji/
- 今日の5問（やさしい2・ふつう2・むずかしい1）はだれでも同じで1日1回。上級（むずかしい3問・ヒントなし）、練習（何度でも）、とことん（まちがえても続く・一発で何問読みとれるか）、読みとった種類が集まる「ラベル帳」があります。
- まちがえても選び直せます。正解すると「なぜ」と出典が出ます。ヒントは「見るところ」→「選び肢を2つにしぼる」の2段です。
- 問題は513問（19種類）。チケット・回数制限はありません。
- 文字の大きさは3段から選べます。見やすさの設定（読みやすい文字・色の見分け・動きを減らす・読み上げ）もあります。
- 機種を変えるときは「引き継ぎ」で、記録をコードと QR にして移せます。

## 中身の出どころ

商品・会社の名前はすべて作りものです。表示のきまりは次の消費者庁の資料にもとづきます。アレルギーのある人は、実際の商品では必ずその商品の表示と、医師の指示に従ってください。

- [消費者庁「食品期限表示の設定のためのガイドライン」](https://www.caa.go.jp/policies/policy/food_labeling/food_labeling_act/assets/food_labeling_cms201_250328_1029.pdf)：消費期限と賞味期限・開ける前と書いてある保存方法を守ったときの期限
- [消費者庁「期限表示（消費期限と賞味期限）」の啓発資料](https://www.caa.go.jp/policies/policy/consumer_policy/information/food_loss/efforts/assets/consumer_education_cms201_260630_09.pdf)
- [消費者庁「食物アレルギー表示に関する情報」](https://www.caa.go.jp/policies/policy/food_labeling/food_sanitation/allergy/)・[加工食品の食物アレルギー表示ハンドブック（2026年4月版）](https://www.caa.go.jp/policies/policy/food_labeling/food_sanitation/allergy/assets/food_labeling_cms204_260401_02.pdf)：義務の9品目（カシューナッツは2026年4月から・経過措置あり）・推奨の20品目・代替表記と拡大表記・乳化剤や乳酸菌は乳ではない
- [消費者庁「食品添加物の表示」](https://www.caa.go.jp/policies/policy/food_labeling/food_sanitation/food_additive/assets/food_labeling_cms204_210408_01.pdf)：原材料と添加物を「/」などで分け、それぞれ重い順に書く
- [消費者庁「知っていますか？ 食品表示」](https://www.caa.go.jp/policies/policy/food_labeling/information/pamphlets/assets/food_labeling_cms201_250512_01.pdf)・[栄養成分表示を活用しよう](https://www.caa.go.jp/policies/policy/food_labeling/information/pamphlets/assets/food_labeling_cms201_250512_02.pdf)：栄養成分の5項目・食塩相当量＝ナトリウム(mg)×2.54÷1000
- [消費者庁「原料原産地表示 Q&A」](https://www.caa.go.jp/policies/policy/food_labeling/quality/country_of_origin/qa/)：いちばん重い原材料の産地・「○○製造」・「輸入」
- [消費者庁「食品添加物の不使用表示に関するガイドライン」(2022)](https://www.caa.go.jp/policies/policy/food_labeling/food_labeling_act/assets/food_labeling_cms201_220330_25.pdf)：「無添加」「不使用」の表示の読み方

食品表示の相談は、お住まいの消費生活センター（消費者ホットライン 188）へ。

## 記録と通信

記録は遊ぶ人のブラウザにだけ残り、ゲームから自動で外へ送ることはありません。例外は2つ：文字（Google Fonts）を読み込むとき、まだ端末に保存が無ければ Google に IP アドレスが届きます。「Xで投稿」「LINEで送る」「結果をシェア」を押したときだけ、結果の文が選んだ先に渡ります（問題と答えは入りません）。

## 開発

```bash
bash scripts/setup.sh   # 最初に一度
node qa/run.mjs         # 検査（CI と同じ）
```

問題は `gen.js`（決まりは AGENTS.md）。

感想は [Issue のフォーム](https://github.com/satou-aaaaa/shokuhin-hyoji/issues/new?template=feedback.yml) からどうぞ。
