const express = require('express')
const expressWs = require('express-ws')

const app = express()
expressWs(app)

const port = process.env.PORT || 3001
let connects = []
//入室しているユーザー管理(重複を許さない)(カワグチ)
let players = new Set()
let chatHistory = [];

app.use(express.static('public'))

app.ws('/ws', (ws, req) => {
  connects.push(ws)

  ws.on('message', (message) => {
    //メッセージJSONに変換(カワグチ)
    const msg = JSON.parse(message)
    console.log('Received:', message)

    //参加したら(カワグチ)
    if (msg.type === 'join') {
      players.add(msg.id)

      // 新しく入室した人に、履歴をまとめて送信(カワグチ)
      ws.send(JSON.stringify({
        type: 'init',
        players: Array.from(players),
        chatHistory: chatHistory
      }));

      // 全クライアントに現在の参加者リストを送信(カワグチ)
      const playersMsg = JSON.stringify({
        type: 'players',
        players: Array.from(players),
      })

      connects.forEach((socket) => {
        if (socket.readyState === 1) {
          socket.send(playersMsg)
        }
      })

      // 他のクライアントに入室通知も送る(カワグチ)
      const joinMsg = JSON.stringify({ type: 'join', id: msg.id })
      connects.forEach((socket) => {
        if (socket.readyState === 1) {
          socket.send(joinMsg)
        }
      })
      return
    }

    if (msg.type === 'start') {
      // ひらがな1文字をランダムに選ぶ
      const firstChar = getRandomHiragana();
      const shuffledPlayers = Array.from(players).sort(() => Math.random() - 0.5);

      // 全接続にゲーム開始通知を送る(カワグチ)
      connects.forEach((socket) => {
        if (socket.readyState === 1) {
          socket.send(JSON.stringify({ type: 'start', firstChar: firstChar, turnOrder: shuffledPlayers, }))
        }
      });
      return;
    }

    //ひらがな　一文字を選ぶ関数(カワグチ)
    function getRandomHiragana() {
      const hira = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
      return hira[Math.floor(Math.random() * hira.length)];
    }


    connects.forEach((socket) => {
      if (socket.readyState === 1) {
        // Check if the connection is open
        socket.send(message)
      }
    })
  })

  ws.on('close', () => {
    connects = connects.filter((conn) => conn !== ws)
  })
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
