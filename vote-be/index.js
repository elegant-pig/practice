const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors=require('cors')

const app = express();
const port = 3000;
app.use(cors());

// 创建数据库连接
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'vote'
});

// 连接到数据库
db.connect(err => {
  if (err) {
    console.error('无法连接到数据库:', err);
    return;
  }
  console.log('已成功连接到数据库');
});

// 解析请求体
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 创建投票
app.post('/create-vote', (req, res) => {
  const { question, options } = req.body;
  console.log(req.body)
  // console.log(res.body)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 插入投票问题到数据库
  db.query('INSERT INTO votes (question) VALUES (?)', [question], (err, result) => {
    if (err) {
      console.error('创建投票失败:', err);
      res.status(500).json({ error: '创建投票失败' });
    } else {
      const voteId = result.insertId;

      // 插入投票选项到数据库
      const optionValues = options.map(option => [voteId, option]);
      db.query('INSERT INTO vote_option (vote_id, option_name) VALUES ?', [optionValues], (err, result) => {
        if (err) {
          console.error('创建投票选项失败:', err);
          res.status(500).json({ error: '创建投票选项失败' });
        } else {
          res.json({ message: '投票创建成功' });
        }
      });
    }
  });
  return;
});

// 添加路由来查询投票问题及选项
app.get('/get-vote/:voteId', (req, res) => {
    const voteId = req.params.voteId;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // 查询投票问题和相关选项
    const query = `
    SELECT v.vote_id, v.question, vo.option_id, vo.option_name
    FROM votes v
    LEFT JOIN vote_option vo ON v.vote_id = vo.vote_id
    WHERE v.vote_id = ?;    
    `;
  
    db.query(query, [voteId], (err, result) => {
      if (err) {
        console.error('查询投票问题及选项失败:', err);
        res.status(500).json({ error: '查询投票问题及选项失败' });
      } else {
        if (result.length === 0) {
          return res.status(404).json({ error: '投票问题不存在' });
        } else {
          const voteData = {
            question: result[0].question,
            options: result.map(row => row.option_name)
          };
          // console.log(res.json(voteData))
          return res.json(voteData); // 返回包含问题和选项的数据
        }
      }
    });
    return;
  });
  // Add a route to query all voting questions
app.get('/get-all-votes', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Query all voting questions
  const query = `
  SELECT vote_id, question
  FROM votes;
  `;

  db.query(query, (err, result) => {
      if (err) {
          console.error('查询所有投票问题失败:', err);
          res.status(500).json({ error: '查询所有投票问题失败' });
      } else {
          // Extract and send the questions
          const questions = result.map(row => row.question);
          res.json(questions); // Return an array of questions
      }
  });
  return;
});


// 记录投票
app.post('/vote', (req, res) => {
  const { voteId, optionId } = req.body;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // 插入投票记录到数据库
  db.query('INSERT INTO votes_record (vote_id, option_id) VALUES (?, ?)', [voteId, optionId], (err, result) => {
    if (err) {
      console.error('记录投票失败:', err);
      res.status(500).json({ error: '记录投票失败' });
    } else {
      res.json({ message: '投票记录成功' });
      console.log(result)
    }
  });
  return;
});

// 显示投票结果
app.get('/results/:voteId', (req, res) => {
  const voteId = req.params.voteId;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // 查询投票选项和投票记录
  const query = `
    SELECT vo.option_name, COUNT(vr.record_id) as vote_count
    FROM vote_option vo
    LEFT JOIN votes_record vr ON vo.option_id = vr.option_id
    WHERE vo.vote_id = ?
    GROUP BY vo.option_id
  `;

  db.query(query, [voteId], (err, result) => {
    if (err) {
      console.error('获取投票结果失败:', err);
      res.status(500).json({ error: '获取投票结果失败' });
    } else {
      res.json(result);
      console.log(result)
    }
  });
  return;
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});
