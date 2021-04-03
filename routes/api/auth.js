const express = require('express');
const router = express.Router();
const auth =require('../../config/middleware/auth');
const User = require('../../models/User');
const config =require('config');
const{check , validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

//@route    GET api/auth
//@desc     Test route
//@access   public
router.get('/',auth ,async(req , res) =>{
    try{
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    }catch(err){
        console.error(err.message);
        res.status(500).send('server errror');
    }
})
// @route   POST api/auth
// @desc    Authenticate user and get token
// @access  public

router.post('/',[ 
   
    check('email' , 'please enter a valid email')
    .isEmail(),
    check('password' , 'password required')
    .exists()
],
async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    
    const {email ,password} = req.body;

    try{
        let user = await User.findOne({email});
        
        if(!user){ 
            return res.status(400).json({errors : [{msg : 'invalid credentials'}]});
        }
        const isMatch = await bcrypt.compare(password , user.password);

        if(!isMatch){
            return res.status(400).json({errors : [{msg : 'invalid credentials'}]});
        }
       
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
                res.json({token});
            })  
    }catch(err){
    console.log(err.message);
    res.send (500).send('Server error');
    }
    
   
})


module.exports = router;