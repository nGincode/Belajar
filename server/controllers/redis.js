const express = require("express");
const router = express.Router();
const redis = require("redis");
const config = {
  host: "localhost",
  port: 6379,
  socket_keepalive: true,
  socket_initdelay: 10,
};
const client = redis.createClient(config);
router.get("/status", async (req, res) => {
  const redisClient = client;

  redisClient.on("connect", () => {
    console.log("Connected to Redis");
  });

  redisClient.on("error", (err) => {
    console.log(err.message);
  });

  redisClient.on("ready", () => {
    console.log("Redis is ready");
  });

  redisClient.on("end", () => {
    console.log("Redis connection ended");
  });

  process.on("SIGINT", () => {
    redisClient.quit();
  });

  await redisClient
    .connect()
    .then(() => {
      res.json("Connected to Redis");
    })
    .catch((err) => {
      res.json(err.message);
    });

  redisClient.quit();
});
router.get("/all", async (req, res) => {
  await client.connect();
  const keys = await client.sendCommand(["keys", "*"]);
  let json = [];
  for (let index = 0; index < keys.length; index++) {
    let val = await client.get(keys[index]);
    json.push({ key: keys[index], value: val });
  }
  res.json(json);
  client.quit();
});
router.get("/", async (req, res) => {
  await client.connect();
  const data = await client.get("key1");
  res.json(data);
  client.quit();
});
router.post("/", async (req, res) => {
  await client.connect();
  const { value, key } = req.body;
  const response = await client.set(key, value);
  res.json(response);
  client.quit();
});
router.delete("/", async (req, res) => {
  await client.connect();
  const { key } = req.body;
  const response = await client.del(key);
  switch (response) {
    case 1:
      res.json("Delete Success");
      break;
    case 0:
      res.json("Key not found");
      break;
    default:
      res.json("Error");
      break;
  }
  client.quit();
});

module.exports = router;
