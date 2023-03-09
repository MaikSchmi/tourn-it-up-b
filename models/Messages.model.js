const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const messageSchema = new Schema(
  {
    from: {
      type: Schema.Types.ObjectId,
    },
    to: {
      type: Schema.Types.ObjectId,
    },
    subject: {
      type: String
    },
    message: {
      type: String
    },
    type: {
      type: String,
      enum: ["Invitation", "Message"]
    },
    relatedTournament: {
      type: Schema.Types.ObjectId,
    },
    status: {
      type: String,
      enum: ["Unread", "Read"],
      default: "Unread"
    }
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`    
    timestamps: true
  }
);

const Message = model("Message", messageSchema);

module.exports = Message;
