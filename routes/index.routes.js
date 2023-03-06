const router = require("express").Router();
const fileUploader = require("../config/cloudinary.config");
const Tournament = require("../models/Tournament.model");

router.get("/", (req, res, next) => {
  res.json("All good in here");
});

router.post("/upload/:tournamentId", fileUploader.single("imageUrl"), async (req, res, next) => {
  if (!req.file) {
    next(new Error("No file uploaded!"));
    return;
  }
  await Tournament.findByIdAndUpdate(req.params.tournamentId, {backgroundImage: req.file.path})
  res.json({ fileUrl: req.file.path });
});

module.exports = router;
