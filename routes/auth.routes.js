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
    const email = req.body.email
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
                    expiresIn: "8h"
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

router.post("/update-token", async (req, res, next) => {
    const email = req.body.email;
    try {
        const getUser = await User.find({email})
        if (getUser.length) {
            const payload = {_id: getUser[0]._id, email: getUser[0].email, username: getUser[0].username, status: getUser[0].status, tournaments: getUser[0].tournaments, interest: getUser[0].interest }
                const token = jwt.sign(
                    payload,
                    process.env.TOKEN_SECRET,
                    { 
                        algorithm: "HS256",
                        expiresIn: "8h"
                    }) 
                res.status(200).json({token})
        } else {
            res.status(403).json({message: "User not found."})
        }
    } catch (error) {
        console.log(error);
        res.status(403).json({message: "Unable to create a new token."});
    }
})

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

router.post("/update-membership-plan", async (req, res, next) => {
    try {
      await User.findOne({username: req.body.user})
      let newStatus = "";
      if (req.body.plan === "free") {
        newStatus = "Member";
      } else if (req.body.plan === "paid") {
        newStatus = "Paid Member";
      } else if (req.body.plan === "premium") {
        newStatus = "Premium Member";
      }
      await User.findOneAndUpdate({username: req.body.user}, {status: newStatus}, {new: true})
      res.status(201).json({message: "User updated successfully", newStatus});
    } catch (error) {
      console.log("Error updating the user status: ", error),
      res.status(400).json({message: "Error updating user: "}, error);
    }
  });




router.post('/profile/settings', async (req, res, next) => {
    const { email, username } = req.body 
    try { 
        if (req.body.currentUser.username !== req.body.username) {
            const findUser = await User.find({username})
            if (findUser.length) {
                res.status(400).json({message: "Username already registered"})
                return
            }
        }
        if (req.body.currentUser.email !== req.body.email) {
            const findEmail = await User.find({email})
            if (findEmail.length) {
                res.status(400).json({message: "email already registered"})
                return
            }
        }
        const currentUser = await User.find ({email : req.body.currentUser.email})
        console.log(currentUser);
        const passwordMatch = bcrypt.compareSync(req.body.password, currentUser[0].passwordHash)
        if (passwordMatch) {
            let updatedUser = {} 
            if (req.body.updatedPassword !== '' && req.body.repeatUpdatedPassword !== '' ) {
                if (req.body.updatedPassword === req.body.repeatUpdatedPassword) {
                    const updatedPasswordHash = bcrypt.hashSync(req.body.updatedPassword, bcrypt.genSaltSync(14))
                    updatedUser = {
                        email: req.body.email,
                        username: req.body.username ,
                        passwordHash : updatedPasswordHash
                    }
                    const updatedUserDB = await User.findOneAndUpdate({email :req.body.currentUser.email }, updatedUser , {new : true} )
                    res.status(201).json({message : 'user was updated', email :updatedUserDB.email , username : updatedUserDB.username , password : req.body.updatedPassword })
                } else { 
                    res.status(400).json({message: "The passwords do not match."})
                    return
                }
            } else { 
                updatedUser = {
                    email: req.body.email,
                    username: req.body.username 
                }
                const updatedUserDB = await User.findOneAndUpdate({email :req.body.currentUser.email }, updatedUser , {new : true});
                res.status(201).json({message : 'user was updated', email :updatedUserDB.email , username : updatedUserDB.username });
            }
        } else {
            res.status(403).json({message: "incorrect Password."})
            return
        }
    } catch (error) {
        console.log("Error updating user:" , error);
        res.status(500).json({message: "Server error"})
    }
});

router.post('/profile/delete' , async (req, res , next) => {

try {
    const  email = req.body.currentUser.email
    const findUser = await User.findOne({email : email }).populate('tournaments')
  
    for (let i =0 ; i< findUser.tournaments.length ; i++) {
const affectedTournament = findUser.tournaments[i] 
console.log(affectedTournament)
    if (affectedTournament.organizer._id === findUser._id){
            await Tournament.findByIdAndDelete(affectedTournament._id )}
     else {
const removeUser =  affectedTournament.indexOf(affectedTournament.organizer._id)
        affectedTournament.splice(removeUser)}}
// const deleteUser =  await User.findOneAndDelete({email : email } )
   // res.status(201).json({message : 'user account was Deleted'});    
}
catch(err){console.log(err)}
})


module.exports = router;

