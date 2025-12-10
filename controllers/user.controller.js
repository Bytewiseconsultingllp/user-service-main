const mongoose = require("mongoose");
const User = require("../models/user.model");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/token.utils");
const dotenv = require("dotenv");
dotenv.config();

exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, email, role, address, otp } =
      req.body;

    if (!phoneNumber) {
      return res
        .status(400)
        .json({ status: "error", error: "Phone number is required" });
    }
    if (!otp) {
      return res.status(400).json({ error: "OTP is required" });
    }

    const authResp = await axios.post(
      `${process.env.AUTH_SERVICE_URL}/verify-otp`,
      {
        phoneNumber,
        otp,
      },
    );

    if (authResp.data.status !== "success") {
      return res.status(400).json({
        status: "error",
        error: authResp.data.message,
      });
    }
    const existingUser = await User.findOne({ phoneNumber });

    if (existingUser) {
      return res.status(200).json({
        status: "success",
        message: "User Exists .....",
        user: existingUser,
      });
    }

    //  Create and save user
    const newUser = new User({
      firstName,
      lastName,
      phoneNumber,
      email,
      role,
      address,
    });

    const savedUser = await newUser.save();

    // ✅ Generate tokens
    const accessToken = generateAccessToken(savedUser);
    const refreshToken = generateRefreshToken(savedUser);

    // ✅ Save refresh token in DB
    savedUser.refreshToken = refreshToken;
    savedUser.accessToken = accessToken; // Save access token
    await savedUser.save();

    return res.status(201).json({
      status: "success",
      user: savedUser,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal server error" });
  }
};

//login user via otp and phone number

exports.loginUser = async (req, res) => {
  try {
    let { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res
        .status(400)
        .json({ error: "Phone number, OTP and country code are required" });
    }

    // ✅ Verify OTP
    const authResp = await axios.post(
      `${process.env.AUTH_SERVICE_URL}/verify-otp`,
      {
        phoneNumber,
        otp,
      },
    );

    if (authResp.data.status !== "success") {
      return res.status(400).json({ error: "OTP verification failed" });
    }

    // ✅ Find user by phone number
    const user = await User.findOne({ phoneNumber }); // fixed
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // ✅ Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      status: "success",
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal server error" });
  }
};

// Get user profile via phone number
exports.getUserProfile = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ status: "success", user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal server error" });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { phoneNumber, firstName, lastName, email, address } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }
    const user = await User.findOneAndUpdate(
      { phoneNumber },
      { firstName, lastName, email, address, isNewUser: false },
      { new: true },
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ status: "success", user });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal server error" });
  }
};

exports.refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ error: "No refresh token provided" });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken; // rotate token
    await user.save();

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

//get user details by ID
exports.getUserById = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ status: "success", user });
  } catch (err) {
    console.error("Get User Error:", err.message);
    return res.status(500).json({ error: "Failed to get user" });
  }
};

// In logout controller

exports.logoutUser = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.refreshToken = null;
  await user.save();

  return res.status(200).json({ status: "success", message: "Logged out" });
};

// update user information by id

exports.updateUserById = async (req, res) => {
  const { userId, productId, amount } = req.body;

  if (!userId || !productId || !amount) {
    return res
      .status(400)
      .json({ error: "User ID, Product ID and Amount are required" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  // Update user's bids
  const bidIndex = user.bids.findIndex((bid) => bid.productId === productId);
  if (bidIndex !== -1) {
    user.bids[bidIndex].amount = amount; // Update existing bid amount
  } else {
    user.bids.push({ productId, amount }); // Add new bid
  }
  await user.save();
  return res.status(200).json({ status: "success", user });
};

//add adress to user profile
exports.addAddress = async (req, res) => {
  try {
    const { userId, address } = req.body;
    if (!userId || !address) {
      return res
        .status(400)
        .json({ error: "User ID and address are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.address.push(address); // Add new address
    await user.save();

    return res.status(200).json({ status: "success", addresses: user.address });
  } catch (error) {
    console.error("Error adding address:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// editing a address in user profile
exports.editAddress = async (req, res) => {
  try {
    const { userId, addressId, updatedAddress } = req.body;
    // addressId = user.address array _id of that address
    if (!userId || !addressId) {
      return res
        .status(400)
        .json({ error: "User ID and Address ID are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const index = user.address.findIndex(
      (addr) => addr._id.toString() === addressId,
    );
    if (index === -1) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Update the address
    user.address[index] = { ...user.address[index]._doc, ...updatedAddress };
    await user.save();

    return res.status(200).json({ status: "success", addresses: user.address });
  } catch (error) {
    console.error("Error editing address:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// fetching all addresses of a user
exports.getAllAddresses = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ status: "success", addresses: user.address });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//delete address from user profile
exports.deleteAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.body;
    if (!userId || !addressId) {
      return res
        .status(400)
        .json({ error: "User ID and Address ID are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Filter out the address with matching ID
    user.address = user.address.filter(
      (addr) => addr._id.toString() !== addressId,
    );
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Address removed",
      addresses: user.address,
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
