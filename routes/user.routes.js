const router = require("express").Router();
const User = require("../models/User.model");

router.post("/update-membership-plan", async (req, res, next) => {
  try {
    const updateUser = await User.findOne({username: req.body.user})
    let newStatus = "";
    if (req.body.plan === "free") {
      newStatus = "Member";
    } else if (req.body.plan === "paid") {
      newStatus = "Paid Member";
    } else if (req.body.plan === "premium") {
      newStatus = "Premium Member";
    }
    const nowUpdatedUser = await User.findOneAndUpdate({username: req.body.user}, {status: newStatus}, {new: true})
    console.log(nowUpdatedUser);
    res.status(201).json("User updated successfully");
  } catch (error) {
    console.log("Error updating the user status: ", error),
    res.status(400).json("Error updating user: ", error);
  }
});


module.exports = router;
