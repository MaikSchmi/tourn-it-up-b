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
        additionalInfo: req.body.formDetails.additionalInfo,
        mapUrl: req.body.formDetails.mapUrl,
        updatePlatformUrl: req.body.formDetails.updatePlatformUrl,
        maxParticipants: req.body.formDetails.maxParticipants,
        minParticipants: req.body.formDetails.minParticipants,
        status: "Open",
        professionsRequired: req.body.formDetails.professionsRequired,
        professions: req.body.formDetails.professions,
        startDate: req.body.formDetails.startDate,
        endDate: req.body.formDetails.endDate
    }

    let today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    today = yyyy + "-" + mm + "-" + dd;

    if (newTournament.name === "" || newTournament.description === "" || newTournament.type === "" ||
    newTournament.challenge === "" || newTournament.organizer === "" || newTournament.locationCountry === "" ||
    !req.body.formDetails.tosChecked || newTournament.endDate < newTournament.startDate || newTournament.startDate <= today) {
      res.status(400).json("Please fill out all the required fields.");
    } else {
      const createdTournament = await Tournament.create(newTournament);
      res.status(200).json(createdTournament._id);
    }
  } catch (error) {
    res.status(400).json("Error creating the tournament: ", error);
  }
});

router.post("/update/:id", async(req, res, next) => {
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
        additionalInfo: req.body.formDetails.additionalInfo,
        mapUrl: req.body.formDetails.mapUrl,
        updatePlatformUrl: req.body.formDetails.updatePlatformUrl,
        maxParticipants: req.body.formDetails.maxParticipants,
        minParticipants: req.body.formDetails.minParticipants,
        status: "Open",
        professionsRequired: req.body.formDetails.professionsRequired,
        professions: req.body.formDetails.professions,
        startDate: req.body.formDetails.startDate,
        endDate: req.body.formDetails.endDate
    }

    let today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    today = yyyy + "-" + mm + "-" + dd;

    if (newTournament.name === "" || newTournament.description === "" || newTournament.type === "" ||
    newTournament.challenge === "" || newTournament.organizer === "" || newTournament.locationCountry === "" ||
    !req.body.formDetails.tosChecked || newTournament.endDate < newTournament.startDate || newTournament.startDate <= today) {
      res.status(400).json("Please fill out all the required fields.");
    } else {
      const createdTournament = await Tournament.create(newTournament);
      res.status(200).json(createdTournament._id);
    }
  } catch (error) {
    res.status(400).json("Error creating the tournament: ", error);
  }
});

router.post("/delete/:id", async (req, res, next) => {
  const tournamentId = req.params.id;
  const deletingUser = req.body.user.username;
  console.log(req.body)
  try {
    const tournament = await Tournament.findById(tournamentId);
    const organizer = await User.findById(tournament.organizer);
    if (deletingUser === organizer.username) {
      await Tournament.findByIdAndDelete(tournamentId);
      res.status(201).json("Tournament deleted successfully");
    } else {
      res.status(403).json("Not authorized to delete Tournament!");
    }
  } catch(error) {
    res.status(400).json("Error deleting the tournament: ", error);
  }
});

router.post("/updateparticipants/:id/", async (req, res, next) => {
  const tournamentId = req.params.id;
  const newParticipant = req.body.user
  try {
    const newParticipantInDb = await User.findOne({username: newParticipant.username});
    if (newParticipantInDb) {
      const updatedTournament = await Tournament.findById(tournamentId).populate("participants");
      let userRegistered = false;
      const newParticipantId = JSON.stringify(newParticipantInDb._id).split(`"`)[1]
      for (let i = 0; i < updatedTournament.participants.length; i++) {
        const currentParticipantId = JSON.stringify(updatedTournament.participants[i]).split(`"`)[1];
        if (currentParticipantId === newParticipantId) {
          userRegistered = true;
          break;
        }
      } 
      if (!userRegistered) {
        updatedTournament.participants.push(newParticipantInDb._id);
        await updatedTournament.save();
        res.status(201).json("Added new participant");
      } else {
        res.status(403).json("You are already registered for this tournament.");
      }
    }
  } catch (error) {
    res.status(400).json("Error adding participant: ", error);
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
    const promiseArr = [];
    promiseArr.push(await User.findById(oneTournament.organizer));
    for (let i = 0; i < oneTournament.participants.length; i++) {
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
