const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Node.js Surya DevOps capstone EMC Project!");
});

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
