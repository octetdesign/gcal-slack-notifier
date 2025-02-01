/** Slack */
class Slack {
  /** コンストラクタ */
  constructor(settings) {
    /** 設定 */
    this.settings = { ...Slack.DefaultSettings, ...settings }
  }
  /**
   * セクションの取得
   *  Reference: blocks - Slack API
   *  https://api.slack.com/reference/block-kit/blocks#section
   */
  getSection(text) {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text,
      },
    }
  }
  /** メッセージの投稿 */
  post({ text, textList }) {
    console.log('slack.settings', this.settings)
    const { webhookUrl, username, icon_emoji } = this.settings

    // 送信データ
    const postData = {
      username,
      icon_emoji,
      text,
      blocks: textList && textList.map((text) => this.getSection(text)),
    }
    // console.log('postData', postData)
    console.log('postData', JSON.stringify(postData, null, 2))

    // POSTリクエスト
    UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(postData),
    })
  }
}
/** デフォルトの設定 */
Slack.DefaultSettings = {
  /** Webhook URL */
  webhookUrl: '',
  /** ユーザー名 */
  username: 'SlackWebhookBot',
  /** アイコン */
  icon_emoji: ':ghost:',
}
