/** 設定キー */
const ScriptPropertyKeys = {
  /** [System] 開発モードか */
  DevelopmentMode: 'System.DevelopmentMode',
  /** [System] 通知済みイベントをリセットするか（開発時のみ有効） */
  ResetNotifiedEvents: 'System.ResetNotifiedEvents',
  /** [System] GoogleカレンダーID */
  GoogleCalendarId: 'System.GoogleCalendarId',
  /** [System] GoogleカレンダーのURL */
  GoogleCalendarUrl: 'System.GoogleCalendarUrl',
  /** [System] ChatGPTのAPIキー */
  ChatGptApiKey: 'System.ChatGptApiKey',
  /** [System] SlackのWebhook URL */
  SlackWebhookUrl: 'System.SlackWebhookUrl',
  /** [Application] イベントの通知済みリスト */
  NotifiedEvents: 'Application.NotifiedEvents',
}

/** スクリプトプロパティクラス */
class ScriptProperties {
  /** 値の読み込み */
  static load({ key, defaultValue, type = 'string' }) {
    // スクリプトプロパティの取得
    const properties = PropertiesService.getScriptProperties()
    // 値の取得
    const value = properties.getProperty(key)
    // 値の型によって返却値を変更
    if (type === 'json') {
      return value ? JSON.parse(value) : defaultValue
    } else {
      return value || defaultValue
    }
  }
  /** 値の保存 */
  static save({ key, value, type = 'string' }) {
    // スクリプトプロパティの取得
    const properties = PropertiesService.getScriptProperties()
    // 値の型によって変換
    if (type === 'json') {
      value = JSON.stringify(value)
    }
    // 値の保存
    properties.setProperty(key, value)
  }
}
