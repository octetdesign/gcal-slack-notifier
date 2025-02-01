/** オンライン開催かどうかの判定用の場所名 */
const OnlineLocations = ['オンライン', 'Online', 'Teams Online Meeting', 'Youtube Live', 'Zoom', 'Discord']

/** イベントアイテム */
class EventItem {
  /** コンストラクタ */
  constructor(event) {
    this.index = null
    this.eventId = event.getId()
    this.title = event.getTitle()
    this.startTime = event.getStartTime()
    this.endTime = event.getEndTime()
    this.location = event.getLocation()
    this.description = event.getDescription()
    this.url = extractUrl(this.description)
    this.subject = ''
    this.details = ''
    this.summary = '' // NOTE: ChatGPTで要約を生成してセットする
    this.epigram = '' // NOTE: ChatGPTでエピグラムを生成してセットする
    this.bluntTruth = '' // NOTE: ChatGPTで本音を生成してセットする
  }

  /** オンライン開催かどうかの判定 */
  get isOnline() {
    if (!this.location) {
      return false
    }
    // オンライン開催場所名が含まれているかどうか（部分一致で判定）
    return OnlineLocations.some((onlineLocation) => this.location.toUpperCase().includes(onlineLocation.toUpperCase()))
  }

  /** マーク */
  get mark() {
    return this.isOnline ? '🔸' : '🔹'
  }

  /** イベントの日付 */
  get eventDate() {
    return format.date(this.startTime, 'short')
  }

  /** 会場のテキスト */
  get locationText() {
    if (this.location) {
      // 会場名から郵便番号を除去
      let shortLocation = this.location.replace(/(〒?[\d\-ー]+\s*)/g, '')
      // 会場名が長い場合は省略
      shortLocation = shortLocation.length > 8 ? shortLocation.slice(0, 8) + '…' : shortLocation
      return ` @ ${shortLocation}`
    }
    return ''
  }

  /** プロンプト */
  get prompt() {
    return `#${this.index}\t${this.title}\t${format.date(this.startTime)}\t${this.description}`
  }

  /** 新着イベントのテキスト */
  get text() {
    const timeFrom = format.time(this.startTime)
    const timeTo = format.time(this.endTime)
    const timeText = timeFrom !== '00:00' && timeFrom !== timeTo ? `${timeFrom} - ${timeTo}` : ''
    const subject = `${this.mark}*${this.eventDate}* *${this.title}*`
    const details = timeText || this.locationText ? `${timeText}${this.locationText}` : ''

    const lines = []
    // 件名
    lines.push(subject)
    // 詳細
    if (details) {
      lines.push(`> ${details}`)
    }
    // URL
    if (this.url) {
      const maxLength = 80
      const urlShort = this.url.length > maxLength ? this.url.slice(0, maxLength) + '…' : this.url
      lines.push(`> <${this.url}|${urlShort}>`)
    }
    // 要約
    if (this.summary) {
      lines.push(`> ${this.summary}`)
    }
    // コメントの出力判定
    if (Math.random() < CommentOutputProbability / 100) {
      // 50%の確率でエピグラムまたは本音を表示
      if (Math.random() < 0.5) {
        // エピグラム
        if (this.epigram) {
          lines.push(`> :notebook:_“${this.epigram.replace(/。$/, '')}”_`)
        }
      } else {
        // 本音
        if (this.bluntTruth) {
          lines.push(`> :thought_balloon:_${this.bluntTruth}_`)
        }
      }
    }
    return lines.join('\n')
  }

  /** イベント一覧のテキスト */
  get listText() {
    // return `${this.mark}<${this.url}|${this.title}>${this.locationText}`
    return `${this.mark}<${this.url}|${this.title}>`
    // return `<${this.url}|${this.title}>`
  }
}
