const router = require("express").Router();
const fileUploader = require("../config/cloudinary.config");
const Tournament = require("../models/Tournament.model");

router.get("/", (req, res, next) => {
  res.json("All good in here");
});

module.exports = router;
