const router = require("express").Router();
const bcrypt = require ('bcryptjs')
const User = require('../models/User.model')
const jwt = require ('jsonwebtoken')
const isAuthenticated = require('../middlewares/jwt.middleware');
const Tournament = require("../models/Tournament.model");
const fileUploader = require("../config/cloudinary.config");
const Message = require("../models/Messages.model");

router.post("/signup", async (req, res, next) => {
    const { email, username } = req.body 
    const usernameLC = username.toLowerCase();

    try {
        const findUser = await User.find({usernameLC: usernameLC}) 
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
            usernameLC,
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
                const payload = {
                    _id: getUser[0]._id, 
                    email: getUser[0].email, 
                    username: getUser[0].username, 
                    status: getUser[0].status, 
                    tournaments: getUser[0].tournaments, 
                    interest: getUser[0].interest, 
                    slogan: getUser[0].slogan,
                    profileImage: getUser[0].profileImage,
                    profileBackgroundImage: getUser[0].profileBackgroundImage,
                    profileBackgroundColor: getUser[0].profileBackgroundColor,
                    profileTextColor: getUser[0].profileTextColor,
                    commentCount: getUser[0].commentCount,
                    messages: getUser[0].messages,
                    friendsList: getUser[0].friendsList
                }

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
        const getUser = await User.findOne({email: email})
        .populate({
            path: "friendsList",
            select: "username",
            model: "User",
        });
        if (getUser) {
            const payload = {
                _id: getUser._id, 
                email: getUser.email, 
                username: getUser.username, 
                status: getUser.status, 
                tournaments: getUser.tournaments, 
                interest: getUser.interest, 
                slogan: getUser.slogan,
                profileImage: getUser.profileImage,
                profileBackgroundImage: getUser.profileBackgroundImage,
                profileBackgroundColor: getUser.profileBackgroundColor,
                profileTextColor: getUser.profileTextColor,
                commentCount: getUser.commentCount,
                messages: getUser.messages,
                friendsList: getUser.friendsList
                }

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
});

router.get("/profile/find-user/:username", async (req, res, next) => {
    const { username } = req.params;
    const usernameLC = username.toLowerCase();
    try {
        const userProfile = await User.findOne({usernameLC: usernameLC})
        .populate({
            path: "tournaments",
            select: "name",
            model: "Tournament",
        })
        .populate({
            path: "friendsList",
            select: "profileImage username slogan",
            model: "User",
        });
        if (userProfile) {
            const userData = {
                _id: userProfile._id,
                username: userProfile.username,
                slogan: userProfile.slogan,
                status: userProfile.status,
                interest: userProfile.interest,
                friendsList: userProfile.friendsList,
                tournaments: userProfile.tournaments,
                profileImage: userProfile.profileImage,
                profileBackgroundImage: userProfile.profileBackgroundImage,
                profileTextColor: userProfile.profileTextColor,
            }
            res.status(200).json({userData: userData});
        } else {
            res.status(404).json({message: "User not found"});
        }
    } catch (error) {
        console.log("Error processing request: ", error);
        res.status(400).json({message: error});
    }
});

router.post("/profile/add-friend/:username", async (req, res, next) => {
    const { username } = req.params;
    const { currentUser } = req.body;
    try {
        const friend = await User.find({username: username});
        const requestingUser = await User.findOne({username: currentUser});
        let alreadyFriends = false;
        for (let i = 0; i < requestingUser.friendsList.length; i++) {
            if (JSON.stringify(friend[0]._id).split(`"`)[1] === JSON.stringify(requestingUser.friendsList[i]._id).split(`"`)[1]) {
                alreadyFriends = true;
                break;
            }
        }
        if (!alreadyFriends) {
            requestingUser.friendsList.push(friend[0]._id);
            await requestingUser.save();
            res.status(200).json({message: "Friend successfully added.", newFriendsList: requestingUser.friendsList});
        } else {
            res.status(403).json({message: "Error, already friends"});
        }
    } catch (error) {
        console.log("Error adding friend: ", error);
        res.status(400).json({message: error});
    }
});

router.post("/profile/remove-friend/:username", async (req, res, next) => {
    const { username } = req.params;
    const { currentUser } = req.body;
    try {
        const friend = await User.find({username: username});
        const requestingUser = await User.findOne({username: currentUser});
        let index = -1;
        for (let i = 0; i < requestingUser.friendsList.length; i++) {
            if (JSON.stringify(friend[0]._id).split(`"`)[1] === JSON.stringify(requestingUser.friendsList[i]._id).split(`"`)[1]) {
                index = i;
                break;
            }
        }
        if (index !== -1) {
            requestingUser.friendsList.splice(index, 1);
            await requestingUser.save();
            res.status(200).json({message: "Friend successfully removed.", newFriendsList: requestingUser.friendsList});
        } else {
            res.status(403).json({message: "Error, friend not found"});
        }
    } catch (error) {
        console.log("Error adding friend: ", error);
        res.status(400).json({message: error});
    }
    
});

router.post("/update-interests/:username", async (req, res, next) => {
    try {
        const updatedUser = await User.findOne({username: req.params.username});
        updatedUser.interest.splice(0, updatedUser.interest.length);
        for (let i = 0; i < req.body.updateInterestsInDb.length; i++) {
            updatedUser.interest.push(req.body.updateInterestsInDb[i]);
        }
        updatedUser.slogan = req.body.slogan
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

router.get("/profile/messages/:username", async (req, res, next) => {
    const username = req.params.username;
    try {
        const user = await User.findOne({username: username});
        const promiseArr = [];
        for (let i = 0; i < user.messages.length; i++) {
            promiseArr.push(await Message.findById(user.messages[i])            
            .populate({
                path: "from to",
                select: "username",
                model: "User",
            })
            .populate({
                path: "relatedTournament",
                select: "name",
                model: "Tournament"
            }))
        }
        const messageArr = await Promise.all(promiseArr);
        console.log(messageArr);
        res.status(200).json({message: "Here you go.", messages: messageArr});
    } catch (error) {
        console.log("Error retrieve messages: ", error);
        res.status(500).json({message: "Error retrieve messages."})
    }   
});

router.post("/profile/messages/delete/:messageId", async (req, res, next) => {
    const { messageId } = req.params;
    const { currentUser } = req.body;
    try {
        const user = await User.findOne({username: currentUser});
        let index = -1;
        for (let i = 0; i < user.messages.length; i++) {
            if (JSON.stringify(user.messages[i]).split(`"`)[1] === messageId) {
                index = i;
                break;
            }
        }
        if (index !== -1) {
            user.messages.splice(index, 1);
            await user.save();
            await Message.findByIdAndDelete(messageId);
            res.status(200).json({message: "Message deleted successfully.", messages: user.messages})
        } else {
            res.status(404).json({message: "Error, message not found."});
        }
    } catch (error) {
        console.log("Error deleting message: ", error);
        res.status(500).json({message: `Error deleting message: ${error}`})
    }
});


router.post('/profile/settings', async (req, res, next) => {
    const { email, username } = req.body 
    const usernameLC = username.toLowerCase();
    try { 
        if (req.body.currentUser.username !== req.body.username) {

            const findUser = await User.find({usernameLC: usernameLC})
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
        const currentUser = await User.find ({email: req.body.currentUser.email})
        const passwordMatch = bcrypt.compareSync(req.body.password, currentUser[0].passwordHash)
        if (passwordMatch) {
            let updatedUser = {} 
            if (req.body.updatedPassword !== '' && req.body.repeatUpdatedPassword !== '' ) {
                if (req.body.updatedPassword === req.body.repeatUpdatedPassword) {
                    const updatedPasswordHash = bcrypt.hashSync(req.body.updatedPassword, bcrypt.genSaltSync(14))
                    updatedUser = {
                        email: req.body.email,
                        username: req.body.username ,
                        usernameLC: usernameLC,
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
        const email = req.body.currentUser.email;
        const username = req.body.currentUser.username;
        const findUser = await User.findOne({email : email })
        
        const tournamentPromiseArr = []
        for (let i = 0 ; i< findUser.tournaments.length ; i++) {
            tournamentPromiseArr.push(await Tournament.findById(findUser.tournaments[i]).populate({
                path: "organizer",
                select: "username",
                model: "User"
              }))
        }
        const resolved = await Promise.all(tournamentPromiseArr);

        const tournamentsToDeletePromises = []; // Find and delete Organizer Tournaments
        const saveParticipantsPromises = []; // Find as participant in Tournaments and remove to make space
        
        for (let i = 0; i < resolved.length; i++) {
            if (resolved[i].organizer.username === username) {
                tournamentsToDeletePromises.push(await Tournament.findByIdAndDelete(resolved[i]._id));
            } else {
                let index = -1;
                for (let j = 0; j < resolved[i].participants.length; j++) {
                    if (JSON.stringify(resolved[i].participants[j]).split(`"`)[1] === JSON.stringify(findUser._id).split(`"`)[1]) {
                        index = j;
                        break;
                    }
                } 
                resolved[i].participants.splice(index, 1);
                saveParticipantsPromises.push(await resolved[i].save());
            }
        }
        await Promise.all(tournamentsToDeletePromises);
        await Promise.all(saveParticipantsPromises)

        await User.findOneAndDelete({email : email } )
        res.status(201).json({message : 'user account was Deleted'}); 
    }
    catch(err) {
        console.log(err)
    }
})

router.post("/uploadavatar/:username", fileUploader.single("imageUrl"), async (req, res, next) => {
    console.log(req.file);
    if (!req.file) {
        next(new Error("No file uploaded!"));
        return;
    }
    try {
        await User.findOneAndUpdate({username: req.params.username}, {profileImage: req.file.path});
        res.json({file: req.file.path})
    } catch (error) {
        
    }
});

router.post("/uploadbg/:username", fileUploader.single("imageUrl"), async (req, res, next) => {
    console.log(req.file);
    if (!req.file) {
        next(new Error("No file uploaded!"));
        return;
    }
    try {
        await User.findOneAndUpdate({username: req.params.username}, {profileBackgroundImage: req.file.path});
        res.json({file: req.file.path})
    } catch (error) {
        
    }
});


module.exports = router;

