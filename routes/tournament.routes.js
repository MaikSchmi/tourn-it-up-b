const Comment = require("../models/Comment.model");
const Tournament = require("../models/Tournament.model");
const User = require("../models/User.model");

const router = require("express").Router();


const syncTournamentEntries = async () => {
  // Update Tournament Statuses
  let today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();
  today = yyyy + "-" + mm + "-" + dd;

  const allTournaments = await Tournament.find();
  const promiseArr = [];
  for (let i = 0; i < allTournaments.length; i++) {
    if (allTournaments[i].startDate <= today || (allTournaments[i].maxParticipants > 0 && allTournaments[i].participants.length + 1 >= allTournaments[i].maxParticipants)) {
      promiseArr.push(await Tournament.findByIdAndUpdate(allTournaments[i]._id, {status: "Closed"}))
    } 
    if (allTournaments[i].endDate < today) {
      promiseArr.push(await Tournament.findByIdAndUpdate(allTournaments[i]._id, {status: "Ended"}))
    }
  }
  if (promiseArr.length) Promise.all(promiseArr);
}


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
    !req.body.formDetails.tosChecked || newTournament.endDate < newTournament.startDate || newTournament.startDate <= today ||
    newTournament.maxParticipants < newTournament.participants || ((newTournament.maxParticipants > 0 & newTournament.minParticipants > 0) && newTournament.maxParticipants < newTournament.minParticipants)) {
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
    const tournament = await Tournament.findById(req.params.id);
    const updatedTournamentDetails = {
        name: req.body.formDetails.name,
        description: req.body.formDetails.description,
        type: req.body.formDetails.type,
        challenge: req.body.formDetails.challenge,
        reward: req.body.formDetails.reward,
        locationCountry: req.body.formDetails.locationCountry,
        locationCity: req.body.formDetails.locationCity,
        additionalInfo: req.body.formDetails.additionalInfo,
        mapUrl: req.body.formDetails.mapUrl,
        updatePlatformUrl: req.body.formDetails.updatePlatformUrl,
        maxParticipants: req.body.formDetails.maxParticipants,
        minParticipants: req.body.formDetails.minParticipants,
        startDate: req.body.formDetails.startDate,
        endDate: req.body.formDetails.endDate
    }

    let today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    today = yyyy + "-" + mm + "-" + dd;

    if (updatedTournamentDetails.name === "" || updatedTournamentDetails.description === "" || updatedTournamentDetails.type === "" ||
    updatedTournamentDetails.challenge === "" || updatedTournamentDetails.organizer === "" || updatedTournamentDetails.locationCountry === "" ||
    !req.body.formDetails.tosChecked || updatedTournamentDetails.endDate < updatedTournamentDetails.startDate || updatedTournamentDetails.startDate <= today ||
    updatedTournamentDetails.maxParticipants < tournament.participants || ((updatedTournamentDetails.maxParticipants > 0 & updatedTournamentDetails.minParticipants > 0) && updatedTournamentDetails.maxParticipants < updatedTournamentDetails.minParticipants)) {
      res.status(400).json("Please fill out all the required fields.");
    } else {
      await Tournament.findByIdAndUpdate(req.params.id, updatedTournamentDetails, {new: true});
      if (tournament.maxParticipants === tournament.participants.length + 1) tournament.status = "Closed";
      await tournament.save();
      res.status(200).json(req.params.id);
    }
  } catch (error) {
    console.log("ERROR: ", error);
    res.status(400).json("Error updating the tournament: ", error);
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
  const participant = req.body.user
  try {
    const participantInDb = await User.findOne({username: participant.username});
    if (participantInDb) {
      const updatedTournament = await Tournament.findById(tournamentId).populate("participants");
      if (req.body.signup) {
        let userRegistered = false;
        const newParticipantId = JSON.stringify(participantInDb._id).split(`"`)[1]
        for (let i = 0; i < updatedTournament.participants.length; i++) {
          const currentParticipantId = JSON.stringify(updatedTournament.participants[i]).split(`"`)[1];
          if (currentParticipantId === newParticipantId) {
            userRegistered = true;
            break;
          }
        } 
        if (!userRegistered) {
          updatedTournament.participants.push(participantInDb._id);
          if (updatedTournament.participants.length + 1 >= updatedTournament.maxParticipants) updatedTournament.status = "Closed";
          await updatedTournament.save();
          res.status(201).json("Added new participant");
        } else {
          res.status(403).json("You are already registered for this tournament.");
        }
      } else if (req.body.resign) {
        let userRegistered = false;
        const currentParticipantId = JSON.stringify(participantInDb._id).split(`"`)[1];
        let index = -1;
        for (let i = 0; i < updatedTournament.participants.length; i++) {
          const checkParticipantId = JSON.stringify(updatedTournament.participants[i]).split(`"`)[1];
          if (checkParticipantId === currentParticipantId) {
            index = i;
            userRegistered = true;
            break;
          }
        }
        if (userRegistered) {
          updatedTournament.participants.splice(index, 1);
          await updatedTournament.save();
          res.status(201).json("Removed participant")
        } else {
          res.status(400).json("Error finding participant");
        }
      }
    }
  } catch (error) {
    res.status(400).json("Error: ", error);
  }
});


router.get("/all", async (req, res, next) => {
  syncTournamentEntries();
  try {
    const allTournaments = await Tournament.find().populate({
      path: "participants",
      select: "username",
      model: "User"
    }).populate({
      path: "organizer",
      select: "username",
      model: "User"
    });

    res.status(200).json(allTournaments);
  } catch(error) {
    console.log("Error fetching tournaments: ", error);
  }
});


router.get("/:id", async (req, res, next) => {
  try {
    // Get Tournament
    const oneTournament = await Tournament.findById(req.params.id)
    .populate({
      path: "participants",
      select: "username",
      model: "User"
    }).populate({
      path: "organizer",
      select: "username",
      model: "User"
    }).populate({
      path:"comments",
      model: "Comment"
    })
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


router.get("/name/:name", async (req, res, next) => {
  try {
    // Get Tournament
    const oneTournament = await Tournament.findOne({name: req.params.name})
    .populate({
      path: "participants",
      select: "username",
      model: "User"
    }).populate({
      path: "organizer",
      select: "username",
      model: "User"
    }).populate({
      path:"comments",
      model: "Comment"
    })
    if (oneTournament === null) {
      console.log("YA ITS NULL MAN")
      res.status(404).json("Tournament not found");
    } else {
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
    }
  } catch (error) {
    console.log("Error fetching tournament: ", error);
    res.status(404).json("Tournament not found: ", error);
  }
});


router.post("/comments/add", async (req, res, next) => {
  if (req.body.comment === "") {
    res.status(400).json("Please write something before posting.");
  } else {
    try {
      const tournament = await Tournament.findById(req.body.tournamentId);
      let newComment = {
        comment: req.body.comment,
        username: req.body.username
      }
      
      const newCommentInDb = await Comment.create(newComment);
      tournament.comments.push(newCommentInDb._id);
      await tournament.save();
      res.status(201).json("Added new comment successfully");
    } catch (error) {
      console.log("Error creating post: ", error);
      res.status(400).json("Error creating post: ", error);
    }
  }
});


router.post("/comments/delete/:id", async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const tournament = await Tournament.findById(req.body.tournamentId);
    let index = -1;
    for (let i = 0; i < tournament.comments.length; i++) {
      const comment = JSON.stringify(tournament.comments[i]).split(`"`)[1]
      if (comment === commentId) {
        index = i;
        break;
      }
    }
    tournament.comments.splice(index, 1);
    await tournament.save();
    await Comment.findByIdAndDelete(commentId);
    res.status(201).json("Post deleted successfully");
  } catch (error) {
    console.log("Error deleting post: ", error),
    res.status(400).json("Error deleting post: ", error)
  }
});

module.exports = router;
