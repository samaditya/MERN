const express = require('express');
const router = express.Router();

//@route    GET api/profiles
//@desc     Test route
//@access   public

router.get('/' ,(req , res) =>{
    res.send("profile route");
})
module.exports = router;