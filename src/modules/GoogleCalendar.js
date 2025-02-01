/** Googleカレンダークラス */
class GoogleCalendar {
  /** 初期化 */
  constructor(settings) {
    /** 設定 */
    this.settings = { ...GoogleCalendar.DefaultSettings, ...settings }
  }
  /**
   * Googleカレンダーのイベントを取得
   * @param {Date} startDate 開始日時
   * @param {Date} endDate 終了日時
   * @return {GoogleAppsScript.Calendar.CalendarEvent[]} イベントリスト
   * */
  getEvents(startDate, endDate) {
    // カレンダーの取得
    const calendar = CalendarApp.getCalendarById(this.settings.calendarId)
    // startDate〜endDateのイベントを取得
    return calendar.getEvents(startDate, endDate)
  }
}
/** デフォルト設定 */
GoogleCalendar.DefaultSettings = {
  /** カレンダーID */
  calendarId: '',
}
