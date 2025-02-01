/**
 * メイン処理：週次のイベント情報をSlackに通知する。
 * NOTE: 週次のイベント通知はGASのトリガー機能で定期的に実行。（例：毎週金曜日の12時〜13時に実行）
 */
function notifyWeeklyEventsToSlack() {
  /** 現在日時 */
  const now = new Date()
  /** キャラクター */
  const character = NotificationSettings.find((setting) => setting.type === 'weekly') // 週次のイベント通知用のキャラクター
  /** GoogleカレンダーID */
  const calendarId = ScriptProperties.load({ key: ScriptPropertyKeys.GoogleCalendarId })
  /** Googleカレンダーのイベント（現在〜7日後のイベント） */
  const events = new GoogleCalendar({ calendarId }).getEvents(now, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000))
  /** Slack通知するメッセージのリスト */
  let eventItemList = []
  /** イベントカウンター */
  let counter = 0

  // 取得したイベントでループ
  events.forEach((event) => {
    const eventItem = new EventItem(event)
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
    console.log('今後１週間の間にイベントはありません。')
    return
  }

  /*
    通知するイベント数の調整（最大数で打ち切る）
    ※後に出てくる曜日のイベント（配列の後ろの方）が切れないよう曜日ごと均等な数にして最大数と比較する。
    ※このコードを作成した時のプロンプト：eventItemListを曜日ごと均等なイベント数にして最大数で打ち切るようにして下さい
  */

  // 全てのイベントをコピー
  const eventItemListAll = [...eventItemList]
  // 曜日ごとにイベントを分類
  const eventsByDay = {}
  eventItemList.forEach((event) => {
    const day = new Date(event.eventDate).getDay()
    if (!eventsByDay[day]) {
      eventsByDay[day] = []
    }
    eventsByDay[day].push(event)
  })
  // 各曜日のイベント数を均等にする
  const balancedEventList = []
  let dayIndex = 0
  while (balancedEventList.length < MaxWeeklyEventCount && Object.keys(eventsByDay).length > 0) {
    const days = Object.keys(eventsByDay)
    const day = days[dayIndex % days.length]
    if (eventsByDay[day].length > 0) {
      balancedEventList.push(eventsByDay[day].shift())
    }
    if (eventsByDay[day].length === 0) {
      delete eventsByDay[day]
    }
    dayIndex++
  }
  eventItemList = balancedEventList

  // NOTE: 週次のイベント通知ではChatGPTを使用しない

  // Slackに通知
  try {
    /** GoogleCalendar URL */
    const googleCalendarUrl = ScriptProperties.load({ key: ScriptPropertyKeys.GoogleCalendarUrl })
    // 週次のイベント通知メッセージのヘッダ
    const text = WeeklyEventsMessageHeader.replace('%WeeklyEventCount%', eventItemList.length).replace(
      '%GoogleCalendarUrl%',
      googleCalendarUrl
    )
    // イベント日付のリスト
    const eventDateList = [...new Set(eventItemList.map((item) => item.eventDate))]
    // イベント日付ごとのイベントリスト
    const eventListByDate = eventDateList.map((eventDate) => {
      const events = eventItemList.filter((item) => item.eventDate === eventDate)
      const eventList = events.map((item) => `> ${item.listText}`).join('\n')
      const countByDay = eventItemListAll.filter((item) => item.eventDate === eventDate).length
      const otherCountText = countByDay > events.length ? ` ...他${countByDay - events.length}件` : ''
      return `*${eventDate}*\n${eventList}${otherCountText}`
    })
    // 日付でソートする
    eventListByDate.sort((a, b) => {
      const dateA = new Date(a.split('\n')[0].replace(/\*/g, ''))
      const dateB = new Date(b.split('\n')[0].replace(/\*/g, ''))
      return dateA - dateB
    })
    // テキストリスト
    // const textList = [text, ...eventListByDate]
    const textList = [text, eventListByDate.join('\n')]
    // メッセージフッターを付加
    if (WeeklyEventsMessageFooter) {
      textList.push(WeeklyEventsMessageFooter)
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
  } catch (e) {
    Logger.log(e)
  }
}
