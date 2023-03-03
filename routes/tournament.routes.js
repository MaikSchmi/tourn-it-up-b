const Tournament = require("../models/Tournament.model");
const User = require("../models/User.model");

const router = require("express").Router();


router.post("/create", async (req, res, next) => {
  try {
    const tournamentOrganizer = await User.findOne({username: req.body.formDetails.organizer});
    const newTournament = {
        name: req.body.formDetails.name,
        description: req.body.formDetails.description,
        type: req.body.formDetails.type,
        challenge: req.body.formDetails.challenge,
        organizer: tournamentOrganizer._id,
        reward: req.body.formDetails.reward,
        locationCountry: req.body.formDetails.locationCountry,
        locationCity: req.body.formDetails.locationCity,
        media: req.body.formDetails.media,
        additionalInfo: req.body.formDetails.additionalInfo,
        mapUrl: req.body.formDetails.mapUrl,
        updatePlatformUrl: req.body.formDetails.updatePlatformUrl
    }
    if (newTournament.name === "" || newTournament.description === "" || newTournament.type === "" ||
    newTournament.challenge === "" || newTournament.organizer === "" || newTournament.locationCountry === "" ||
    !req.body.formDetails.tosChecked) {
      res.status(400).json("Please fill out all the required fields.");
    } else {
      const createdTournament = await Tournament.create(newTournament);
      res.status(200).json(createdTournament._id);
    }
  } catch (error) {
    res.status(400).json("Error creating the tournament: ", error);
  }
});

router.get("/all", async (req, res, next) => {
  try {
    const allTournaments = await Tournament.find();
    res.status(200).json(allTournaments);
  } catch(error) {
    console.log("Error fetching tournaments: ", error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    // Get Tournament
    const oneTournament = await Tournament.findById(req.params.id);
    console.log(oneTournament)
    const promiseArr = [];
    promiseArr.push(await User.findById(oneTournament.organizer));
    for (let i = 0; i < oneTournament.participants.length; i++) {
      console.log(oneTournament.participants[i])
      promiseArr.push(await User.findById(oneTournament.participants[i]));
    }
    // Get Participants
    const participantArr = [];
    const participants = await Promise.all(promiseArr);
    for (i = 0; i < participants.length; i++) {
      participantArr.push({id: JSON.stringify(participants[i]._id).split(`"`)[1], username: participants[i].username})
    }

    res.status(200).json({tournament: oneTournament, participants: participantArr});
  } catch (error) {
    console.log("Error fetching tournament: ", error);
  }
});

module.exports = router;
