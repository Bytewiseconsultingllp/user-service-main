const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  getUserById,
  updateUserProfile,
  refreshAccessToken,
  logoutUser,
  updateUserById,
  addAddress,
  editAddress,
  getAllAddresses,
  deleteAddress,
} = require("../controllers/user.controller");

const { verifyAccessToken } = require("../middlewares/auth.middleware");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:userId", getUserById); // Get user by ID
router.post("/refresh-token", refreshAccessToken); //  Get new access token
router.post("/logout", logoutUser); //  Invalidate refresh token

// Protected routes (only if user is logged in)
router.post("/profile", verifyAccessToken, getUserProfile);
router.put("/update-profile", verifyAccessToken, updateUserProfile);

//bidding routes
router.put("/bid-update", updateUserById);

//adress routes
router.post("/add-address", addAddress); // Add a new address
router.put("/edit-address", editAddress); // Edit an
// existing address
router.get("/:userId/addresses", getAllAddresses); // Get all addresses
router.delete("/delete-address", deleteAddress); // Delete an address

module.exports = router;
