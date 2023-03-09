const Comment = require("../models/Comment.model");
const Tournament = require("../models/Tournament.model");
const User = require("../models/User.model");
const fileUploader = require("../config/cloudinary.config");
const Message = require("../models/Messages.model");

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
    if (allTournaments[i].startDate <= today || ((allTournaments[i].maxParticipants > 0 && allTournaments[i].participants.length + 1 >= allTournaments[i].maxParticipants) && !allTournaments[i].professionsRequired)) {
      promiseArr.push(await Tournament.findByIdAndUpdate(allTournaments[i]._id, {status: "Closed"}))
    } 
    if (allTournaments[i].endDate < today) {
      promiseArr.push(await Tournament.findByIdAndUpdate(allTournaments[i]._id, {status: "Ended"}))
    }
  }
  if (promiseArr.length) Promise.all(promiseArr);
}


router.post("/create", async (req, res, next) => {
  let profArr = [];
  const profReq = req.body.formDetails.professionsRequired;
  if (profReq) {
    profArr = req.body.formDetails.professionsString.split(',');
  }

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
        professions: profArr,
        participantSlots: profArr,
        startDate: req.body.formDetails.startDate,
        endDate: req.body.formDetails.endDate,
    }

    let today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    today = yyyy + "-" + mm + "-" + dd;

    if (newTournament.name === "" || newTournament.description === "" || newTournament.type === "" ||
    newTournament.challenge === "" || newTournament.organizer === "" || newTournament.locationCountry === "" ||
    !req.body.formDetails.tosChecked || newTournament.endDate < newTournament.startDate || newTournament.startDate <= today ||
    ((newTournament.maxParticipants > 0 && newTournament.minParticipants > 0) && newTournament.maxParticipants < newTournament.minParticipants)) {
      res.status(400).json("Please fill out all the required fields.");
    } else {
      const createdTournament = await Tournament.create(newTournament);
      tournamentOrganizer.tournaments.push(createdTournament._id);
      await tournamentOrganizer.save();
      res.status(200).json({tournamentId: createdTournament._id});
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
    console.log(updatedTournamentDetails.maxParticipants, updatedTournamentDetails.minParticipants)
    if (updatedTournamentDetails.name === "" || updatedTournamentDetails.description === "" || updatedTournamentDetails.type === "" ||
    updatedTournamentDetails.challenge === "" || updatedTournamentDetails.organizer === "" || updatedTournamentDetails.locationCountry === "" ||
    !req.body.formDetails.tosChecked || updatedTournamentDetails.endDate < updatedTournamentDetails.startDate || updatedTournamentDetails.startDate <= today ||
    ((updatedTournamentDetails.maxParticipants > 0 && updatedTournamentDetails.minParticipants > 0) && updatedTournamentDetails.maxParticipants < updatedTournamentDetails.minParticipants)) {
      res.status(400).json("Please fill out all the required fields.");
    } else {
      await Tournament.findByIdAndUpdate(req.params.id, updatedTournamentDetails, {new: true});
      if (tournament.maxParticipants === tournament.participants.length + 1 && !tournament.professionsRequired) tournament.status = "Closed";
      if (tournament.professionsRequired) {
        let profTournamentFull = false;
        for (let i = 1; i < tournament.professions.length; i++) {
          if (tournament.professions[i] === tournament.participantSlots[i]) {
            break;
          }
          if (i === tournament.professions.length - 2 && tournament.professions[i] !== tournament.participantSlots[i]) {
            profTournamentFull = true;
          }
        }
        if (profTournamentFull) tournament.status = "Closed";
      }
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
  try {
    const tournament = await Tournament.findById(tournamentId);
    const organizer = await User.findById(tournament.organizer);
    // Delete for Organizer
    if (deletingUser === organizer.username) {
      let index = -1;
      for (let i = 0; i < organizer.tournaments.length; i++) {
        const checkTournamentId = JSON.stringify(organizer.tournaments[i]._id).split(`"`)[1]
        if (checkTournamentId === tournamentId) {
          index = i;
          break;
        }
      }
      organizer.tournaments.splice(index, 1);
      await organizer.save();

      // Delete for Participants
      const participantsPromiseArr = [];
      const notificationPromises = [];
      for (let i = 0; i < tournament.participants.length; i++) {
        participantsPromiseArr.push(await User.findById(tournament.participants[i]._id));
      }
      const participants = await Promise.all(participantsPromiseArr);
      const participantsRemoveTournament = [];
      for (let i = 0; i < participants.length; i++) {
        let pIndex = -1;
        for (let j = 0; j < participants[i].tournaments.length; j++) {
          if (JSON.stringify(participants[i].tournaments[j]._id).split(`"`)[1] === tournamentId) {
            pIndex = j;
            break;
          }
        }
        if (pIndex !== -1) {
          participants[i].tournaments.splice(pIndex, 1);
          participantsRemoveTournament.push(await participants[i].save());
        }
        notificationPromises.push(await Message.create({
          from: organizer._id,
          to: participants[i]._id,
          subject: "A Tournament you're participating in has been cancelled.",
          message: `${tournament.name} has been removed by ${organizer.username}`,
          type: "Message",
          status: "Unread"
        }));
      }
      const attachNotificationPromises = [];
      const allNotifications = await Promise.all(notificationPromises);
      for (let i = 0; i < participants.length; i++) {
        participants[i].messages.push(allNotifications[i]);
        attachNotificationPromises.push(await participants[i].save());
      }

      // Delete comments
      const commentPromises = [];
      for (let i = 0; i < tournament.comments.length; i++) {
        commentPromises.push(await Comment.findByIdAndDelete(tournament.comments[i]._id));
      }

      Promise.all(commentPromises);
      Promise.all(participantsRemoveTournament);

      await Tournament.findByIdAndDelete(tournamentId); 
      res.status(201).json({message: "Tournament deleted successfully"});
    } else {
      res.status(403).json({message: "Not authorized to delete Tournament!"});
    }
  } catch(error) {
    res.status(400).json("Error deleting the tournament: ", error);
  }
});

router.post("/updateparticipants/:id/", async (req, res, next) => {
  const tournamentId = req.params.id;
  const participant = req.body.user
  try {
    const participantInDb = await User.findOne({username: participant});
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
          if (updatedTournament.professionsRequired) {
            const profSlot = req.body.slot;
            updatedTournament.participantSlots[profSlot] = participantInDb.username;
          } 
          updatedTournament.participants.push(participantInDb._id);
          participantInDb.tournaments.push(updatedTournament._id);
          await participantInDb.save();
          if (updatedTournament.participants.length + 1 >= updatedTournament.maxParticipants && !updatedTournament.professionsRequired) {
            updatedTournament.status = "Closed";
          }
          if (updatedTournament.professionsRequired) {
            let profTournamentFull = false;
            for (let i = 0; i < updatedTournament.professions.length; i++) {
              if (i > 0 && updatedTournament.professions[i] === updatedTournament.participantSlots[i]) {
                break;
              }
              if (i > 0 && i === updatedTournament.professions.length - 2 && updatedTournament.professions[i] !== updatedTournament.participantSlots[i]) {
                profTournamentFull = true;
              }
            }
            if (profTournamentFull) updatedTournament.status = "Closed";
          }
          await updatedTournament.save();
          res.status(201).json({tournamentId: updatedTournament._id, user: participantInDb});
        } else {
          res.status(403).json("You are already registered for this tournament.");
        }
      } else if (req.body.resign) {
        let userRegistered = false;
        const currentParticipantId = JSON.stringify(participantInDb._id).split(`"`)[1];
        let participantIndex = -1;
        for (let i = 0; i < updatedTournament.participants.length; i++) {
          const checkParticipantId = JSON.stringify(updatedTournament.participants[i]).split(`"`)[1];
          if (checkParticipantId === currentParticipantId) {
            participantIndex = i;
            userRegistered = true;
            break;
          }
        }
        let tournamentIndex = -1;
        for (let i = 0; i < participantInDb.tournaments.length; i++) {
          const checkTournamentId = JSON.stringify(participantInDb.tournaments[i]).split(`"`)[1];
          if (checkTournamentId === tournamentId) {
            tournamentIndex = i;
            break;
          }
        }
        if (userRegistered) {
          if (updatedTournament.professionsRequired) {
            const profSlot = req.body.slot;
            updatedTournament.participantSlots[profSlot] = updatedTournament.professions[profSlot];
            if (updatedTournament.status === "Closed") updatedTournament.status = "Open";
          } 
          updatedTournament.participants.splice(participantIndex, 1);
          await updatedTournament.save();
          participantInDb.tournaments.splice(tournamentIndex, 1);
          await participantInDb.save();
          res.status(201).json({tournamentId: updatedTournament._id, user: participantInDb})
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
      model: "User",
    }).populate({
      path: "organizer",
      select: "username",
      model: "User",
    });

    res.status(201).json(allTournaments);
  } catch(error) {
    console.log("Error fetching tournaments: ", error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    // Get Tournament
    const oneTournament = await Tournament.findById(req.params.id)
    .populate({
      path: "participants organizer",
      select: "username profileImage",
      model: "User"
    })
    .populate({
      path:"comments",
      model: "Comment"
    })

    if (oneTournament === null) {
      res.status(404).json({message: "Tournament not found"});
      return;
    }

    const promiseArr = [];
    for (let i = 0; i < oneTournament.participants.length; i++) {
      promiseArr.push(await User.findById(oneTournament.participants[i]));
    }
    // Get Participants
    const participantArr = [];
    const participants = await Promise.all(promiseArr);
    for (i = 0; i < participants.length; i++) {
      participantArr.push({id: JSON.stringify(participants[i]._id).split(`"`)[1], username: participants[i].username, profileImage: participants[i].profileImage})
    }
  
    res.status(200).json({tournament: oneTournament, participants: participantArr});
  } catch (error) {
    console.log("Error fetching tournament: ", error);
  }
});

router.get("/search/find-name/:name", async (req, res, next) => {
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
      res.status(404).json({message: "Tournament not found"});
      return
    }

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
    res.status(404).json({message: "Tournament not found: ", error});
  }
});

router.post("/invite/:tournamentId", async (req, res, next) => {
  const { tournamentId } = req.params;
  const { from, to } = req.body;
  console.log(tournamentId, from, to)
  try {
    const sender = await User.find({username: from})
    const recipient = await User.find({username: to})
    const tournament = await Tournament.findById(tournamentId);

    if (sender.length && recipient.length) {
      const invitation = await Message.create({
        from: sender[0]._id,
        to: recipient[0]._id,
        subject: "You have been invited to a Tournament!",
        message: `"${from}" is inviting you to join Tournament: ${tournament.name}`,
        type: "Invitation",
        relatedTournament: tournament._id,
        status: "Unread"
      })
      console.log(recipient);
      recipient[0].messages.push(invitation._id);
      await recipient[0].save();
      res.status(201).json({message: "Invitation sent successfully."})
    } else {
      res.status(404).json({message: "User not found."})
    }
  } catch (error) {
    console.log("Error: ", error);
    res.status(400).json({message: `Error processing request: ${error}`})
  }
});

router.post("/comments/add", async (req, res, next) => {
  if (req.body.comment === "") {
    res.status(400).json({message: "Please write something before posting."});
    return
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

router.post("/upload/:tournamentId", fileUploader.single("imageUrl"), async (req, res, next) => {
  if (!req.file) {
    next(new Error("No file uploaded!"));
    return;
  }
  await Tournament.findByIdAndUpdate(req.params.tournamentId, {backgroundImage: req.file.path})
  res.json({ fileUrl: req.file.path });
});

router.post("/update-values/:tournamentId", async (req, res, next) => {
  try {
    await Tournament.findByIdAndUpdate(req.params.tournamentId, {textColor: req.body.textColor, backgroundColor: req.body.backgroundColor});
    res.status(200).json("Updated successfully");;
  } catch(error) {
    console.log(error);
    res.status(400).json("Unable to update: ", error);
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
