const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required.']
    },
    username: {
      type: String,
      unique: true,
      required: [true, 'Username is required.']
    },
    status: {
      type: String,
      enum: ["Member", "Paid Member", "Premium Member", "Inactive"],
      default: "Member"
    },
    slogan: {
      type: String,
    },
    interest: {
      type: [String],
    },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`    
    timestamps: true
  }
);

const User = model("User", userSchema);

module.exports = User;
