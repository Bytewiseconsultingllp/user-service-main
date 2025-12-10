const express = require("express");
const dotenv = require("dotenv");
const userRoutes = require("./routes/user.routes");
const dbConnect = require("./database/mongo.database");

const app = express();
dotenv.config();
app.use(express.json());

dbConnect();

const port = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.use("/", userRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
