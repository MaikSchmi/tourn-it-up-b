const router = require("express").Router();
const bcrypt = require ('bcryptjs')
const User = require('../models/User.model')
const jwt = require ('jsonwebtoken')
const isAuthenticated = require('../middlewares/jwt.middleware')

router.post("/signup", async (req, res, next) => {
    console.log(req.body)
    const { email, username } = req.body 

    try {
        const findUser = await User.find({username: username}) 
        if (findUser.length) {
            res.status(400).json({message: "Username already registered"})
            return;
        }
    } catch (error) {
        console.log(error);
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
        res.status(400).json({message: "Please provide a valid email address."});
        return;
    }
    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    if (!passwordRegex.test(req.body.password)) {
        res.status(400).json({message: "The password must be at least 6 (six) characters long, contain at least 1 (one) number and one lowercase and uppercase letter."});
        return;
    }
    if (req.body.password !== req.body.repeatPassword) {
        res.status(400).json({message: "The passwords do not match."});
        return;
    }

    const passwordHash = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(14) )
    try {
        const user = await User.create({
            email,
            username,
            passwordHash: passwordHash
        });
        const createdUser = {email: user.email, username: user.username}
        res.status(201).json({createdUser});
    }catch(error) {
        console.log(error)
        res.status(403).json({message: "Server Error or user / email already registered."})
    }
});

router.post('/login', async (req, res, next) => {
    const  email = req.body.email
    try {
        const getUser = await User.find({email})
        if (getUser.length) {
            const passwordMatch = bcrypt.compareSync(req.body.password, getUser[0].passwordHash)
            if (passwordMatch) {
                const payload = {_id: getUser[0]._id, email: getUser[0].email, username: getUser[0].username, status: getUser[0].status, tournaments: getUser[0].tournaments, interest: getUser[0].interest }
                const token = jwt.sign(
                payload,
                process.env.TOKEN_SECRET,
                { 
                algorithm: "HS256",
                expiresIn: "24h"
                }) 
                res.status(200).json({token})
            } else {
                res.status(403).json({message : 'User not found or incorrect credentials.'})
            }
        } else {
            res.status(404).json({message: "User not found or incorrect credentials."})
        }
    } catch(error) {
        console.log (error)
        res.status(404).json({message: "User not found or incorrect credentials."})
    }
});

router.get('/verify', isAuthenticated, (req, res, next) => {
    if (req.payload) {
        res.json(req.payload)
    }
});

router.post("/update-interests/:username", async (req, res, next) => {
    console.log(req.body, req.params.username)
    try {
        const updatedUser = await User.findOne({username: req.params.username});
        for (let i = 0; i < req.body.updateInterestsInDb.length; i++) {
            updatedUser.interest.push(req.body.updateInterestsInDb[i]);
        }
        await updatedUser.save();
        res.status(201).json({message: "Updated interests", interest: updatedUser.interest})
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Server Error"});
    }
});


//updateUser
/*
router.post("/update", async (req, res, next) => {
    if (updatedPassword === repeatUpdatedPassword){
const unpdatedUser = {
    email: req.body.updatedEmail,
     username: req.body.updatenUserName ,
     passwordHash : req.body.updatedPassword
}
await User.findOneAndUpdate (req.body.currentUser.email , req, {new: true})
 
res.status(201).json({updatedUser});
} else {return 'Passwords dont match'}
 

}
  )*/


module.exports = router;

