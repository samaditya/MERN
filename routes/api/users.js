const express = require('express');
const router = express.Router();
const gravatar =require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require ('jsonwebtoken')

const{check , validationResult} = require('express-validator');
const User = require('../../models/User');
const config = require('config')

 
//@route    POST api/users
//@desc     Register user
//@access   public

router.post('/',[ 
    check('name' , 'Name is required')
    .not()
    .isEmpty(),
    check('email' , 'please enter a valid email')
    .isEmail(),
    check('password' , 'more than 6 chars')
    .isLength({min : 6})
],
async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    
    const {name , email ,password} = req.body;

    try{
        let user = await User.findOne({email});
        
        if(user){ 
            return res.status(400).json({errors : [{msg : 'User already exists'}]});
        }
        const avatar= gravatar.url(email,{
            s:'200', //size
            r : 'pg', //rating pg
            d:'mm' //default image for user icon
        })

        user = new User({
            name,
            email,
            avatar,
            password
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password ,salt);

        await user.save(); 
        const payload ={
            user:{
                id:user.id
            }
        }
        jwt.sign(
            payload,
            config.get('jwtSecret'),
            {expiresIn:3600000},
            (err ,token)=>{
                if(err) throw(err);
                res.json({token})

            }
        )  
    }catch(err){
    console.log(err.message);
    res.send (500).send('Server error');
    }
    
   
})

module.exports = router;