const router = require("express").Router();
const User = require("../models/User.model");

router.post("/update-membership-plan", async (req, res, next) => {
  try {
    const updateUser = await User.findOne({username: req.body.user})
    if (req.body.plan === "free") {
      updateUser.status = "Member";
    } else if (req.body.plan === "paid") {
      updateUser.status = "Paid Member";
    } else if (req.body.plan === "premium") {
      updateUser.status = "Premium Member";
    }
    await updateUser.save();
    res.status(201).json("User updated successfully");
  } catch (error) {
    console.log("Error updating the user status: ", error),
    res.status(400).json("Error updating user: ", error);
  }
});


module.exports = router;
