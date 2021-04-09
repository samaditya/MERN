const express = require('express');
const router = express.Router();
const auth = require('../../config/middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const{check , validationResult} = require('express-validator');
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);


//@route    GET api/profiles/me
//@desc     get current user profile
//@access   private

router.get('/me',auth , async (req , res) =>{
    try{
        const profile = await Profile.findOne({ user: req.user.id})
        .populate('users' , ['name', 'avatar']);

        if(!profile){
            return res.status(400).json({msg : 'no profile for this user'})
        }

    }catch(err){
        console.error(err.message);
        return res.status(500).send("server error");
    }
})
// @route   POST api/profile
// @ desc   create or update user
// @access  private

router.post('/' , [auth ,[
    check('status' , 'status is reqd')
    .not()
    .isEmpty(),
    check('skills' , 'skills is reqd')
    .not()
    .isEmpty()
]
],
async(req , res) =>{
    
    
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()}); 
    }
    const{
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin } = req.body;

        //build profile object
        const profileFields = {}
            profileFields.user = req.user.id;
            if(company)
                profileFields.company = company;
            if(website)
                profileFields.website = website;
            if(location)
                profileFields.location = location;
            if(bio)
                profileFields.bio = bio;
            if(status)
                profileFields.status = status;
            if(githubusername)
                profileFields.githubusername = githubusername;
            if(skills){
                profileFields.skills = skills.split(',').map(skill => skill.trim());
            } 
            console.log(profileFields.skills);
            //return res.send('hello');
            
            //build social object
            profileFields.social ={}; 
            if(youtube)
                profileFields.social.youtube = youtube;
            if(twitter)
                profileFields.social.twitter = twitter;
            if(facebook)
                profileFields.social.facebook = facebook;
            if(linkedin)
                profileFields.social.linkedin = linkedin;
            if(instagram)
                profileFields.social.instagram = instagram;  
            try{
                let profile = await Profile.findOne({user : req.user.id});
                if(profile){
                    //update
                    profile = await Profile.findOneAndUpdate(
                        {user : req.user.id} ,
                        {$set : profileFields},
                        {new : true,
                        upsert : true}                       
                        );
                        return res.json(profile);
                }                
                //create
                profile = new Profile(profileFields);
                await profile.save();
               return res.json(profile);

            }catch(err){
                console.error(err.message);
                return res.status(500).send('server error')
            }
})

// @route   POST api/profile/user/:user_id
// @ desc   Get profile by userID
// @access Public

router.get('/user/:user_id' , async(req , res) =>{
    try {
        const profile = await Profile.findOne({user : req.params.user_id})
        .populate('users' , ['name' , 'avatar']);

        if(!profile){ 
            return res.status(400).json({msg  : 'There is no profile for this user'})
        }
        return res.json(profile);
        
    } catch (err) {
        console.error(err.message);
        if (err.kind == 'ObjectId') {
            return res.status(400).json({msg : 'Profile not Found'})
        }
        return res.status(500).send('server error');
    }
})

// @route   GET api/profiles
// @ desc   Get all profiles
// @access  Public

router.get('/' , async(req , res) =>{
    try {
        const profiles = await Profile.find().populate('users' , ['name' , 'avatar']);
         res.json(profiles);
    } catch (err) {
        console.error(err.messgage);
        return res.status(500).send('server error')
        
    }
})
module.exports = router;