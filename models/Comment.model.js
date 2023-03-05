const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const commentSchema = new Schema(
  {
    comment: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true
    },
    upvotes: {
      type: Number,
      default: 1,
    }
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`    
    timestamps: true
  }
);

const Comment = model("Comment", commentSchema);

module.exports = Comment;
