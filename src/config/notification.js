/** 新着イベント通知で一度に投稿するイベント数（この数を超えるイベントが存在したら次回の通知に繰り越し） */
const MaxNewEventCount = 3

/** 週次イベント通知で通知するイベントの最大数 */
const MaxWeeklyEventCount = 14

/* 通知をしない曜日（0:日曜日、6:土曜日） */
const NotNotificationDays = [0, 6]

/** 通知スケジュール／キャラクター設定 */
const NotificationSettings = [
  /*
    🎁 Emoji cheat sheet for GitHub, Basecamp, Slack & more
    https://www.webfx.com/tools/emoji-cheat-sheet/
    Emoji codes used by GitHub, Basecamp, Slack and other services. Searchable. With emoji meanings.
  */
  {
    type: 'daily',
    hour: 8,
    name: '新着イベントのお知らせ🌅',
    emoji: ':dove_of_peace:',
    personality: '優しくフレンドリー。配慮や気遣いに長けている。丁寧で柔らかい口調。',
    summaryStyle: '実務へのメリットや影響を強調する要約を作成する。',
  },
  {
    type: 'daily',
    hour: 12,
    name: '新着イベントのお知らせ🏞️',
    emoji: ':hedgehog:',
    personality: '明るく元気で楽観的。好奇心が旺盛で他人を巻き込むタイプ。やや子供っぽい口調。',
    summaryStyle: '技術的興味を刺激する要約を作成する。',
  },
  {
    type: 'daily',
    hour: 17,
    name: '新着イベントのお知らせ🌆',
    emoji: ':owl:',
    personality:
      '知的で冷静。論理的な思考で実用性を重視する。感情よりも分かりやすく簡潔な表現を好み無駄を極力省いた口調。',
    summaryStyle: '問題解決、合理性、将来性を意識した要約を作成する。',
  },
  {
    type: 'weekly',
    name: '週末〜来週のイベント',
    emoji: ':dolphin:',
    personality: '丁寧で礼儀正しい。真面目で堅実。',
  },
]

/** コメントの出力確率(%) */
const CommentOutputProbability = 5

/** 新着イベント通知メッセージのヘッダ */
const NewEventsMessageHeader = `🗓️<%GoogleCalendarUrl%|セミナー・イベントカレンダー>の新着情報です。
_※要約はAI要約のため内容が不正確な場合があります。_`

/** 新着イベント通知メッセージのフッタ */
const NewEventsMessageFooter = `:sparkles:<https://github.com/octetdesign/gcal-slack-notifier|このbotについて>`

/** 週次イベント通知メッセージのヘッダ */
const WeeklyEventsMessageHeader = `この週末〜来週までのイベント情報です。（🔸:オンライン／🔹:対面）`

/** 週次イベント通知メッセージのフッタ */
const WeeklyEventsMessageFooter = NewEventsMessageFooter
