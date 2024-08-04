const express = require("express");
const supabase = require("../supabaseclient");
const User = require("../models/users");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const session = require("../models/session");
const app = express();
app.use(express.json());
app.use(cors());

async function handlePostUserDetails(req, res) {
  const { email, password } = req.body;

  const { user, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).send(error.message);

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ email, password: hashedPassword });

  try {
    await newUser.save();
    res.status(201).send({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).send(err.message);
  }
}

async function handleUserLogin(req, res) {
  const { email, password } = req.body;
  console.log("Login attempt for email:", email);

  // Step 1: Supabase Authentication
  const { user, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    console.error("Supabase sign-in error:", error.message);
    return res.status(400).send(error.message);
  }
  console.log("Supabase user signed in:", user);

  // Step 2: Find User in MongoDB
  const dbUser = await User.findOne({ email });
  if (!dbUser) {
    console.error("User not found in MongoDB for email:", email);
    return res.status(400).send("User not found");
  }
  console.log("User found in MongoDB:", dbUser);

  // Step 3: Compare Passwords
  const isPasswordValid = await bcrypt.compare(password, dbUser.password);
  console.log("Password comparison result:", isPasswordValid);
  if (!isPasswordValid) {
    console.error("Invalid password for email:", email);
    return res.status(400).send("Invalid password");
  }

  // Step 4: Generate JWT Token
  const token = jwt.sign({ id: dbUser._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  console.log("JWT token generated:", token);
  res.status(200).send({ token });
}

async function handleLogout(req, res) {
  const token = req.headers.authorization.split(" ")[1];

  try {
    const { error } = await supabase.auth.api.signOut(token);
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(200).json({ message: "User logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  handlePostUserDetails,
  handleUserLogin,
  handleLogout,
};
