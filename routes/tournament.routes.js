const Tournament = require("../models/Tournament.model");

const router = require("express").Router();


router.post("/create", async (req, res, next) => {
    const newTournament = {
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        field: req.body.field,
        organizer: req.body.organizer,
        participants: req.body.participants,
        reward: req.body.reward,
        location: req.body.location,
        media: req.body.media,
        additionalInformation: req.body.additionalInformation
    }
  
    res.json("All good in here");
});

module.exports = router;
