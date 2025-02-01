/**  テキストからURLを抽出 */
const extractUrl = (text) => {
  const urlRegex = /https?:\/\/[^\s/$.?#].[^\s"']*/g
  const matches = text.match(urlRegex)
  return matches ? matches[0] : null
}
/** フォーマッタ */
const format = {
  /** 日付のフォーマット */
  date: (date, format = 'long') => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1) //.padStart(2, '0')
    const day = String(date.getDate()) //.padStart(2, '0')
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    const weekday = weekdays[date.getDay()]
    switch (format) {
      default:
      case 'long':
        return `${year}/${month}/${day}(${weekday})`
      case 'short':
        return `${month}/${day}(${weekday})`
    }
  },
  /** 時刻のフォーマット */
  time: (date) => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${hours}:${minutes}`
  },
  /** 日時のフォーマット */
  dateTime: (date) => {
    return `${format.date(date)} ${format.time(date)}`
  },
}
