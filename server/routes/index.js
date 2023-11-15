const express = require("express");
const router = express.Router();

const redisController = require("../controllers/redis");

router.use("/redis", redisController);

router.post("/testReqRes", async (req, res) => {
  const { low } = req.body;

  if (low) {
    setTimeout(() => {
      return res.status(200).json(1);
    }, 5000);
  } else {
    return res.status(200).json(1);
  }
});

module.exports = router;
