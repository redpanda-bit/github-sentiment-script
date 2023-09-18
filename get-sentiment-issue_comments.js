var mysql = require("mysql");
const fetch = require("node-fetch");
const util = require("util");

var con = mysql.createConnection({
  host: "127.0.0.1",
  user: "ghdbuser",
  password: "K)9jWIcY892}",
  charset: "utf8mb4",
});

const query = util.promisify(con.query).bind(con);

const addSentiment = async ({ id, negative, neutral, positive }) => {
  const q = await query(`
    UPDATE issue_comments 
      SET negative_sentiment=${negative}, neutral_sentiment=${neutral}, positive_sentiment=${positive}
      WHERE ID=${id};
  `);
};

con.connect(async function (err) {
  if (err) throw err;

  const q = await query(`
    USE github_supervision;
  `);
  const results = await query(`
    SELECT * FROM issue_comments LIMIT 10;
  `);
  const promArray = results.map(async ({ ID: id, text }) => {
    const r = await fetch("https://api.nlp-api.com/v1/sentiment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_token: "N1wXvyGrWsISvsDxsKIyRKSuVfKinNjBppRVhzPL",
        text,
      }),
    });
    const json = await r.json();
    await addSentiment({
      id,
      negative: json.data[0][0].score,
      neutral: json.data[0][1].score,
      positive: json.data[0][2].score,
    });
    return json;
  });
  const sentiments = await Promise.all(promArray);
  console.log("LOG - sentiment", sentiments);
  await con.end();
});
