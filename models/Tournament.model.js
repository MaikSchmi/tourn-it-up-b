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
      enum: ["Cooperative", "Competition"],
      required: true,
    },
    challenge: {
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
    locationCountry: {
      type: String,
      required: true,
    },
    locationCity: {
      type: String,
    },
    minParticipants: {
      type: Number,
    },
    maxParticipants: {
      type: Number,
    },
    additionalInfo: {
      type: String,
    },
    mapUrl: {
      type: String,
    },
    updatePlatformUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Open", "Closed", "Ended"],
      default: "Open",
    },
    professionsRequired: {
      type: Boolean,
      default: false
    },
    professions: {
      type: [String],
    },
    participantSlots: {
      type: [String]
    },
    startDate: {
      type: String,
    }, 
    endDate: {
      type: String
    },
    comments: {
      type: [Schema.Types.ObjectId],
    },
    backgroundImage: {
      type: String,
    },
    backgroundColor: {
      type: String,
      default: "#00000000",
    },
    textColor: {
      type: String,
      default: "#FFFFFF",
    },
    media: {
      type: [String],
    }
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`    
    timestamps: true
  }
);

const Tournament = model("Tournament", tournamentSchema);

module.exports = Tournament;
