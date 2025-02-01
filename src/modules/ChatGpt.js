/** ChatGPT */
class ChatGpt {
  /** コンストラクタ */
  constructor(settings) {
    /** 設定 */
    this.settings = { ...ChatGpt.DefaultSettings, ...settings }
  }
  /** ChatGPTにリクエストを送信 */
  call(prompt) {
    console.log('chatGpt.settings', this.settings)
    const { apiKey, url, model } = this.settings

    const payload = {
      model,
      response_format: { type: 'json_object' }, // レスポンスの形式をJSONに指定
      messages: [
        { role: 'system', content: prompt.system }, // システムメッセージ（任意）
        { role: 'user', content: prompt.user }, // ユーザーからの入力
      ],
    }

    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      payload: JSON.stringify(payload),
    }

    try {
      // ChatGPTにリクエストを送信
      const response = UrlFetchApp.fetch(url, options)
      // レスポンスをJSON形式に変換
      const json = JSON.parse(response.getContentText())
      // 回答を取得
      const reply = json.choices[0].message.content // ChatGPTの返答
      // console.log(reply)
      return reply
    } catch (e) {
      console.warn('Error: ' + e.message)
      return 'API呼び出しに失敗しました: ' + e.message
    }
  }
}
/** デフォルトの設定 */
ChatGpt.DefaultSettings = {
  /** ChatGPTのAPIキー */
  apiKey: null,
  /** ChatGPTのエンドポイントURL */
  url: 'https://api.openai.com/v1/chat/completions',
  /** 使用するモデル (例: 'gpt-3.5-turbo', 'gpt-4', 'gpt-4o', 'gpt-4o-mini'など) */
  // model: 'gpt-4o',
  model: 'gpt-4o-mini',
}
