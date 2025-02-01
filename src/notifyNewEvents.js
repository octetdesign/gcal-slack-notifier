/**
 * メイン処理：新着イベント情報をSlackに通知する
 * NOTE: 新着イベント通知はGASのトリガー機能で定期的に実行する。（1時間毎に実行。実際に通知をするかどうかは最初の処理で判定。）
 */
function notifyNewEventsToSlack() {
  /** 動作モード（dev: 開発 / prod: 本番稼働） */
  const mode = ScriptProperties.load({ key: ScriptPropertyKeys.DevelopmentMode }) === 'true' ? 'dev' : 'prod'
  /** 通知済みイベントのリセット */
  const reset = ScriptProperties.load({ key: ScriptPropertyKeys.ResetNotifiedEvents }) === 'true'
  // 通知するかどうかの判定
  if (!shouldSendNewNotification()) {
    console.log('通知対象外の時間帯または曜日です。')
    // 処理を抜ける（本番運用時）
    if (mode === 'prod') {
      return
    }
  }
  /** 通知済みイベントIDリスト */
  let notifiedEvents = ScriptProperties.load({
    key: `${ScriptPropertyKeys.NotifiedEvents}.${mode}`,
    defaultValue: [],
    type: 'json',
  })
  // 通知済みデータをリセットするか（リセットは開発時のみ）
  if (mode === 'dev' && !!reset) {
    notifiedEvents = []
  }
  // console.log('notifiedEvents', notifiedEvents)

  /** 現在日時 */
  const now = new Date()
  /** キャラクター */
  const dailySettings = NotificationSettings.filter((setting) => setting.type === 'daily')
  let character
  if (mode === 'prod') {
    // 時間によってキャラクターを固定（本番運用時）
    character = dailySettings.find((setting) => setting.hour === now.getHours())
    if (!character) {
      // ランダムに選択
      character = dailySettings[Math.floor(Math.random() * dailySettings.length)]
    }
  } else {
    // ランダムに選択（開発テスト時）
    character = dailySettings[Math.floor(Math.random() * dailySettings.length)]
  }
  /** GoogleカレンダーID */
  const calendarId = ScriptProperties.load({ key: ScriptPropertyKeys.GoogleCalendarId })
  /** Googleカレンダーのイベント（現在〜100日後のイベント） */
  const events = new GoogleCalendar({ calendarId }).getEvents(now, new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000))
  /** Slack通知するメッセージのリスト */
  let eventItemList = []
  /** イベントカウンター */
  let counter = 0

  // 取得したイベントでループ
  events.forEach((event) => {
    // イベントカウンターが上限に達したら終了
    if (counter >= MaxNewEventCount) {
      return
    }
    const eventItem = new EventItem(event)
    // 通知済みイベントはスキップ
    if (notifiedEvents.find((e) => e.eventId === eventItem.eventId)) {
      return
    }
    // 通知済みイベントとして記録
    notifiedEvents.push({ eventId: eventItem.eventId, startTime: eventItem.startTime.getTime() })
    // 同じタイトルのイベントがある場合はスキップ
    if (eventItemList.find((e) => e.title === eventItem.title)) {
      return
    }
    // イベントアイテムのインデックスを設定
    eventItem.index = counter + 1
    console.log('eventItem', eventItem)
    // イベントアイテムの生成
    eventItemList.push(eventItem)
    // カウントアップ
    counter++
  })

  if (eventItemList.length == 0) {
    console.log('新着イベントはありません。')
    return
  }

  // Chat GPTで各イベントのサマリーを作成
  try {
    /** ChatGPTのAPIキー */
    const chatGptApiKey = ScriptProperties.load({ key: ScriptPropertyKeys.ChatGptApiKey })
    if (chatGptApiKey) {
      // APIキーが設定されている場合
      const prompt = GetPrompt(
        character,
        eventItemList.map((item) => item.prompt)
      )
      console.log('prompt', prompt)
      // ChatGPTの初期化
      const chatGpt = new ChatGpt({
        apiKey: chatGptApiKey,
      })
      // ChatGPTにリクエストを送信
      const json = chatGpt.call(prompt)
      console.log('ChatGPTからの返答: ', json)
      const response = JSON.parse(json)
      console.log('response', response)
      // 要約等をイベントアイテムに設定
      eventItemList.map((item, index) => {
        const summary = response.list.find((s) => s.index === index + 1)
        if (summary) {
          item.summary = summary.text
          item.epigram = summary.epigram
          item.bluntTruth = summary.bluntTruth
        }
      })
    }
  } catch (error) {
    console.warn(error)
  }

  // Slackに通知
  try {
    /** GoogleCalendar URL */
    const googleCalendarUrl = ScriptProperties.load({ key: ScriptPropertyKeys.GoogleCalendarUrl })
    // メッセージの生成
    const text = NewEventsMessageHeader.replace('%NewEventCount%', eventItemList.length).replace(
      '%GoogleCalendarUrl%',
      googleCalendarUrl
    )
    const textList = [text, ...eventItemList.map((item) => item.text)]
    // const textList = [text, eventItemList.map((item) => item.text).join('\n')]
    if (NewEventsMessageFooter) {
      textList.push(NewEventsMessageFooter)
    }
    console.log('textList', textList)

    /** SlackのWebhook URL */
    const slackWebhookUrl = ScriptProperties.load({ key: ScriptPropertyKeys.SlackWebhookUrl })
    // Slackの初期化
    const slack = new Slack({
      webhookUrl: slackWebhookUrl,
      username: character.name,
      icon_emoji: character.emoji,
    })
    // Slack通知
    slack.post({ text, textList })

    // 現在以降のイベントで通知済みイベントリストを作成
    const newNotifiedEvents = notifiedEvents.filter((e) => e.startTime > now.getTime())
    // 通知済みイベントリストを保存
    ScriptProperties.save({
      key: `${ScriptPropertyKeys.NotifiedEvents}.${mode}`,
      value: newNotifiedEvents,
      type: 'json',
    })
  } catch (e) {
    Logger.log(e)
  }
}

/** 新着イベントを通知するかどうかの判定 */
const shouldSendNewNotification = () => {
  const now = new Date()
  // 指定時間かどうか
  if (
    !NotificationSettings.filter((setting) => setting.type === 'daily')
      .map((setting) => setting.hour)
      .includes(now.getHours())
  ) {
    return false
  }
  // 通知しない曜日かどうか
  if (NotNotificationDays.includes(now.getDay())) {
    return false
  }
  return true
}
