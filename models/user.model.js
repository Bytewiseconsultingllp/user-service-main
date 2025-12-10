const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    address: [
      {
        name: { type: String },
        email: { type: String },
        phoneNumber: { type: String },
        alternateNumber: { type: String },
        lane: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        pincode: { type: Number },
      },
    ],

    order: {
      type: ["string"], // Array of order IDs
    },

    bids: [
      {
        productId: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    // only if admin
    adminDetails: {
      buisnessName: String,
      documents: ["String"], // Array of document URLs
    },
    accessToken: {
      type: String,
      default: null,
    },

    refreshToken: {
      type: String,
      default: null,
    },
    isNewUser: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
