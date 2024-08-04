const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");

const app = express();
const userRouter = require("./routes/auth");
const todoRouter = require("./routes/todos");

const cors = require("cors");
app.use(cors());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("connected to database"));

app.use(express.json());

app.use("/", userRouter);
app.use("/todos", todoRouter);

app.listen(5000, () => {
  console.log("server is listening in 5000 port");
});
