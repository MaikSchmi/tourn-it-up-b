const router = require("express").Router();
const bcrypt = require ('bcryptjs')
const User = require('../models/User.model')

router.post("/signup", async (req, res, next) => {
    const {email , username } = req.body 
    const passwordHash = bcrypt.hashSync(req.body.password , bcrypt.genSaltSync(14) )
 try {
  
     const user = await User.create({
        email,
        username,
        passwordHash: passwordHash
    })
const createdUser = {email : user.email, username : user.username}

    res.status(201).json({createdUser});
}catch(error) {console.log (error)}


});

module.exports = router;

