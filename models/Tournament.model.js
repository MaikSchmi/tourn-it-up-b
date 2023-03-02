const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const tournamentSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["Joint Effort", "Competition"],
      required: true,
    },
    field: {
      type: String,
      required: true,
    },
    organizer: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    participants: {
      type: [Schema.Types.ObjectId],
    },
    reward: {
      type: String,
    },
    location: {
      type: String,
    },
    media: {
      type: [String],
    },
    additionalInformation: {
      type: String,
    },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`    
    timestamps: true
  }
);

const Tournament = model("Tournament", tournamentSchema);

module.exports = Tournament;
