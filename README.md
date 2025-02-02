# gcal-slack-notifier

## 機能

Google カレンダーに登録されたイベント情報を Slack に通知する bot プログラムです。

新着イベントと一週間分のイベントまとめを定期的に Slack に投稿します。

- 新着イベントは、毎日 8, 12, 17 時にチェックし、新着があったら通知します。
- 一週間分のイベントまとめは、毎週金曜の 12〜13 時に通知します。
- 土日は通知を行いません。

通知内容は以下の通りです。

| 項目       | 新着イベント通知 | イベントまとめ | 備考                                      |
| ---------- | :--------------: | :------------: | ----------------------------------------- |
| 開催日     |        ○         |       ○        |                                           |
| イベント名 |        ○         |       ○        |                                           |
| 時間       |        ○         |       ○        |                                           |
| 会場       |        ○         |       ○        |                                           |
| 要約       |        ※         |       -        | ※：ChatGPT API Key を設定している場合のみ |

> IT 系のセミナーや勉強会等のイベント情報をお知らせ・共有することを目的として作りましたが、他の用途にも使えるかも知れません。

## 仕組み

この bot プログラムの動作の仕組みは以下の通りです。

- 通知の元データとなるイベントデータは Google カレンダーで管理します。
- Google カレンダーのイベントデータを Google Apps Script (GAS) のプログラムで定期的にチェックし、新着があったら Slack に投稿します。
- bot プログラムの定期的な実行には GAS のタイマー実行機能（時間手動型トリガー）の仕組みを使用します。
- イベントの要約作成には ChatGPT の API を使用します。
- Slack への通知には Incoming-Webhook を使用します。

> セットアップさえできてしまえば、後は Google カレンダーにイベントを登録するだけで自動的に Slack に通知がされるようになります。

## 導入と設定手順

### 設定の流れ

1. clasp のインストールと設定
1. GAS へプログラムのアップロード
1. GAS プロジェクトの設定
1. 実行スケジュールの設定

### clasp のインストールと設定

この bot プログラムは clasp (Command Line Apps Script Projects)を使用して開発されています。

clasp を使用することで GAS のプログラムをローカルで開発し、ソースファイルを git で管理することができます。（GAS へのプログラムのアップロードは clasp のコマンドで行います。詳しくは後述。）

_※以下の手順ではプロジェクトのディレクトリが `gcal-slack-notifier` であることを前提に説明をします。_

1. clasp のインストール
   ```shell
   npm install -g @google/clasp
   ```
   > global へのインストールなので nodenv を使用している場合は上記コマンド後に`nodenv rehash`を忘れずに。
1. ディレクトリの移動
   ```shell
   cd gcal-slack-notifier
   ```
1. GAS へのログイン
   ```shell
   clasp login
   ```
   - Web ブラウザが起動して GAS へのログインを要求されるので、ログインをして下さい。
1. プロジェクトの初期化
   ```shell
   clasp create --type standalone --rootDir ./src --title GCalSlackNotifier
   ```
   - clasp の設定ファイル`.clasp.json`が`src`ディレクトリに出力されます。ファイルの内容は以下のような感じです。
   ```json
   { "scriptId": "????_YOUR_SCRIPT_ID_????", "rootDir": "./src" }
   ```
1. `.clasp.json`ファイルの移動
   - `.clasp.json`が`src`ディレクトリにあると、後述の`push`や`open`が正常に動作しないので、このファイルを`gcal-slack-notifier`ディレクトリに移動して下さい。

### GAS へプログラムのアップロード

clasp を使用して GAS へプログラムのアップロードを行います。プロジェクトのディレクトリで実行します。

1. プログラムの GAS へのアップロード
   ```shell
   clasp push
   ```
   - `GCalSlackNotifier`というプロジェクト名で GAS にプログラムがアップロードされます。
1. GAS のページを開く
   ```shell
   clasp open
   ```
   - Web ブラウザでプロジェクトの GAS のページが開かれます。

> 設定やプログラムの修正の動作確認を行う際は、この 1 と 2 の手順を繰り返します。

### GAS プロジェクトの設定

GAS の「プロジェクトの設定」で以下のスクリプトプロパティを追加します。

| プロパティ                   | 説明                                                                     | 必須 |
| ---------------------------- | ------------------------------------------------------------------------ | :--: |
| `System.SlackWebhookUrl`     | Slack の Webhook URL                                                     |  ○   |
| `System.GoogleCalendarId`    | Google カレンダー ID                                                     |  ○   |
| `System.GoogleCalendarUrl`   | Google カレンダーの URL                                                  |      |
| `System.ChatGptApiKey`       | ChatGPT の API キー。未指定時は要約が出力されません。                    |      |
| `System.DevelopmentMode`     | 開発モードで動作させる場合は`true`を指定                                 |      |
| `System.ResetNotifiedEvents` | 通知済みイベントをリセットする場合は`true`を指定（開発モード時のみ有効） |      |

### 実行スケジュールの設定

GAS の「トリガー」で以下のトリガーを追加します。

1. 新着イベント通知向けスケジュール設定
   |設定項目|設定値|
   |-|-|
   |実行する関数|`notifyNewEventsToSlack`|
   |デプロイ時に実行|`Head`|
   |イベントのソース|時間主導型|
   |時間ベースのトリガーのタイプ|時間ベースのタイマー|
   |時間の間隔|1 時間おき|
1. 週次イベント通知向けスケジュール設定
   |設定項目|設定値|
   |-|-|
   |実行する関数|`notifyWeeklyEventsToSlack`|
   |デプロイ時に実行|`Head`|
   |イベントのソース|時間主導型|
   |時間ベースのトリガーのタイプ|週ベースのタイマー|
   |曜日|毎週金曜日|
   |時刻|午後 12〜1 時|

## 運用（イベントデータの登録）について

Google カレンダーへのイベント登録はカレンダーの編集権限を持った人が手動で行います。

Google カレンダーには以下の要領でイベントデータを登録します。

| 項目     | 説明                                                         |
| -------- | ------------------------------------------------------------ |
| タイトル | セミナーやイベントの名前                                     |
| 日付     | 開催日（時間まで入れるのが好ましい）                         |
| 場所     | 会場（オンライン開催であれば「オンライン」等）               |
| 詳細     | イベントの詳細。URL を含めると要約作成の元データとなります。 |

> 例えば、[connpass - エンジニアをつなぐ IT 勉強会支援プラットフォーム](https://connpass.com/)ではイベントページにイベントを Google カレンダーに登録するためのボタンがあります。このボタンからイベントを登録すると上記のようにデータが登録されます。

## 通知について

通知の細かな仕様について記載します。

通知の挙動やメッセージをカスタマイズする場合は、`src/config/notification.js`や`src/config/prompt.js`を編集して下さい。

### 新着イベントの通知

- 通知メッセージが長くなり過ぎないよう１回の通知に含めるイベントは 3 件までに制限しています。
  - 通知されなかった新着イベントは次回の通知に繰り越されます。
- 同じイベントが Google カレンダーに重複登録されていた場合、重複して通知されないようになっています。

### 週次のイベントまとめ通知

- 新着イベントの通知はイベントの開催日とは関係なく、登録した日かその翌日に通知されるため、実際にイベントが開催される日が近づいてきた時にリマインドするために一週間分のイベントリストを通知します。
- 通知は毎週金曜日の 12 時 〜 13 時の間に行います。
  - 週末から翌週にかけてのイベントをまとめて通知します。
  - スケジュールを変更したい場合は GAS のトリガーの設定を変更して下さい。
- イベントの要約は入れないようにしています。（投稿メッセージが長くなってしまうので）

### 通知メッセージ

- イベントの通知は架空のキャラクターが投稿しているようになっています。
- 通知する時間毎に担当のキャラクターが切り替わります。
- キャラクター毎の違いはアイコンとイベントの要約の言葉遣いに表れるようにしています。
- キャラクターのアイコンは絵文字です。
  - [🎁 Emoji cheat sheet for GitHub, Basecamp, Slack & more](https://www.webfx.com/tools/emoji-cheat-sheet/)
- 要約の作成は ChatGPT で行うため、要約作成依頼のプロンプトでキャラクター毎の性格や口調、要約の編集スタイルを指示しています。
- 毎回同じような要約では退屈なため、たまにキャラクターが創作した意味のない格言やネガティブな本音が漏れるようにしています。
- イベントがオンライン開催か対面開催かを一目で分かるようにしています。（会場のテキストから判断してマークを切り替え）
  - 🔸：オンライン開催
  - 🔹：対面開催

## ソースファイル概要

本 bot プログラムを構成するプログラムのソースファイルは以下の通りです。

```plain
gcal-slack-notifier/
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

## 参考

### clasp

- [clasp を使って GAS を GitHub 管理する](https://zenn.dev/icck/articles/3192294a262959)
- [【GAS】clasp を使用して GAS の開発環境を構築してみた - 株式会社ライトコード](https://rightcode.co.jp/blogs/45222)
- [Google App Script を自分のマシンで開発できる google clasp を使ってみる・前編 #JavaScript - Qiita](https://qiita.com/yuskesuzki/items/4ffd0ea941a57638135f)
