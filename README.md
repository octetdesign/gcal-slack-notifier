# gcal-slack-notifier

## 概要

Google カレンダーに登録されたイベント情報を Slack に通知する bot プログラムです。

新着情報とまとめを定期的に Slack に投稿します。

IT 系のセミナーや勉強会等のイベント情報をお知らせ・共有することを目的として作りましたが、他の用途にも使えるかも知れません。

## 機能

TODO: 🌸 機能について記述する

## 導入と設定手順

TODO: 🌸 導入と設定手順を記述する

- `System.SlackWebhookUrl` \*
- `System.GoogleCalendarId` \*
- `System.GoogleCalendarUrl`
- `System.ChatGptApiKey`
- `System.DebugMode`: 'true' | 'false'
- `System.Reset`: 'true' | 'false'

## 仕様

イベント情報が登録されている Google カレンダーから新着情報を収集し、設定した Slack のチャンネルに投稿します。

### 技術要素

- この bot プログラムは Google Apps Script(GAS)で実装します。
- Slack への通知には `Incoming-Webhook` を使用します。
- 通知の元データとなるイベントデータは Google カレンダーに登録します。
- イベントの要約作成に ChatGPT の API を使用します。

### イベントデータについて

Google カレンダーへのイベント登録はカレンダーの編集権限を持った人が手動で行います。

Google カレンダーには以下の要領でイベントデータを登録します。

- タイトル： セミナーやイベント名
- 日付： 開催日（時間まで入れるのが好ましい）
- 場所： 会場（オンライン開催であれば「オンライン」等）
- 詳細： イベントの詳細。URL を含めると要約作成の元データとなります。

例えば、[connpass - エンジニアをつなぐ IT 勉強会支援プラットフォーム](https://connpass.com/)ではイベントページにイベントを Google カレンダーに登録するためのボタンがあります。このボタンからイベントを登録すると上記のようにデータが登録されます。

### 通知について

#### 新着イベントの通知

- 新しく Google カレンダーに登録されたイベントをチェックして Slack に通知する。
- 通知する内容は、日付、タイトル、時間、会場、要約をコンパクトにまとめる。
- 要約は生成 AI（ChatGPT）を利用して作成する。
- 新着イベントのチェックを毎日 8 時、12 時、17 時に行う。
  - 定期実行には GAS のタイマー実行機能（時間手動型トリガー）の仕組みを使用する。
- 新着イベントがあったら Slack に通知する。但し、土日は通知しない。
- 通知が多くなり過ぎないよう１回の通知に含めるイベントは 3 件までに制限する。
  - 通知されなかった新着イベントは次回の通知に繰り越す。
- 同じイベントが重複登録されていた場合、通知を行う際に重複して通知されないようにする。

#### 週次のイベント通知

- 週に一度、一週間のイベントリストを通知する。
- 新着通知はイベントの開催日とは関係なく、登録した日かその翌日に通知されるため、実際にイベントが開催される日が近づいてきた際にリマインドするために一週間分のイベントリストを通知する。
- 通知は毎週金曜日の 12 時 〜 13 時の間に行う。
  - 週末から翌週にかけてのイベントをまとめて通知する。
  - 定期実行には GAS のタイマー実行機能（時間手動型トリガー）の仕組みを使用する。
- 要約は入れない。（投稿メッセージが長くなってしまうので）

### 通知メッセージについて

- イベントの通知は架空のキャラクターが投稿しているようにする。
- 通知する時間毎に担当のキャラクターを切り替える。
- キャラクター毎の違いはアイコンとイベントの要約に表れるようにする。
- アイコンは絵文字で設定する。
  - [🎁 Emoji cheat sheet for GitHub, Basecamp, Slack & more](https://www.webfx.com/tools/emoji-cheat-sheet/)
- 要約の作成は生成 AI（ChatGPT）で行うため、要約作成依頼のプロンプトでキャラクター毎の性格や口調、要約の編集スタイルを指示する。
- 毎回同じような要約では退屈なため、ちょっとした遊び心として、たまにキャラクターが創作した意味のない格言やネガティブな本音が漏れるようにする。
- イベントがオンラインでの開催か対面開催かを一目で分かるようにする。
  - 会場のテキストから判断してマークを変える。
  - 🔸：オンライン開催
  - 🔹：対面開催

## 開発について

### clasp

アプリケーションを直接 [Google Apps Script(GAS)](https://script.google.com/u/1/home) 内で開発しても良いのですが、`clasp`（Command Line Apps Script Projects）を使うとローカルで開発、コマンドで GAS にデプロイができます。

ローカルで開発できるのでアプリケーションのソースを git で管理することもできるようになります。

- [clasp を使って GAS を GitHub 管理する](https://zenn.dev/icck/articles/3192294a262959)
- [【GAS】clasp を使用して GAS の開発環境を構築してみた - 株式会社ライトコード](https://rightcode.co.jp/blogs/45222)
- [Google App Script を自分のマシンで開発できる google clasp を使ってみる・前編 #JavaScript - Qiita](https://qiita.com/yuskesuzki/items/4ffd0ea941a57638135f)

#### command

```shell
cd gcal-slack-notifier
clasp login
clasp create --type standalone --rootDir ./src --title GCalSlackNotifier
```

```shell
clasp push
```

```shell
clasp open
```

🌸`.clasp.json` の場所に注意

### ソースファイル概要

本アプリケーションを構成するプログラムのソースファイルは以下の通りです。

```plain
/
  src/
    config/
      notification.js : 通知メッセージに関する設定
      prompt.js : ChatGPTに送信するプロンプトに関する設定
    modules/
      *.js : 各種モジュール
    appsscript.json : アプリケーション定義ファイル
    notifyNewEvents.js : 新着イベント通知機能
    notifyWeeklyEvents.js : 週次イベント通知機能
  .clasp.json : claspの設定ファイル
  README.md : このファイル
```
