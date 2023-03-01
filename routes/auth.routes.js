const router = require("express").Router();
const bcrypt = require ('bcryptjs')
const User = require('../models/User.model')
const jwt = require ('jsonwebtoken')
const isAuthenticated = require('../middleware/jwt.middleware')

router.post("/signup", async (req, res, next) => {
    const { email, username } = req.body 
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
        console.log (error)
    }
});

router.post('/login', async (req, res, next) => {
    const  email = req.body.email
    try {
        const getUser = await User.find({email})
        if (getUser.length) {
            const passwordMatch = bcrypt.compareSync(req.body.password, getUser[0].passwordHash)
            if (passwordMatch) {
                const payload = {_id: getUser[0]._id, email: getUser[0].email, username: getUser[0].username }
                const token = jwt.sign(
                payload,
                process.env.TOKEN_SECRET,
                { 
                algorithm: "HS256",
                expiresIn: "24h"
                }) 
                res.status(200).json({token})
            } else {
                res.status(403).json({message : 'invalid credentials'})
            }
        } else {
            res.status(404).json({message: "User not found"})
        }
    } catch(error) {
        console.log (error)
    }
});

router.get('/verify', isAuthenticated, (req, res, next) => {
    if (req.payload) res.json (req.payload.user)
})

module.exports = router;
