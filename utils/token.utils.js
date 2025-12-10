const jwt = require("jsonwebtoken");
require("dotenv").config();

const secret = process.env.JWT_SECRET;
console.log("JWT Secret:", secret);

exports.generateAccessToken = (user) => {
  return jwt.sign({ userId: user._id, role: user.role }, secret, {
    expiresIn: "30d",
  });
};

exports.generateRefreshToken = (user) => {
  return jwt.sign({ userId: user._id }, secret, {
    expiresIn: "30d",
  });
};
