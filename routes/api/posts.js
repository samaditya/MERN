const express = require('express');
const{check , validationResult} = require('express-validator');
const router = express.Router();
const auth = require('../../config/middleware/auth');
const Post= require('../../models/Post');
const User = require('../../models/User');
const Profile = require('../../models/Profile');



//@route    POST api/posts
//@desc     create a post
//@access   Private

router.post('/' ,[auth ,[
    check('text' , 'text cannot be empty')
    .not()
    .isEmpty()
]],
async (req , res) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({erros:errors.array()});
    }
    try {
        const user = await User.findById(req.user.id).select('-password');

        const newPost = new Post( {
            text: req.body.text,
            name : user.name,
            avatar : user.avatar,
            user : req.user.id
        })

        const post = await newPost.save();
        return res.json(post);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Eror at post')
        
    }
})

//@route    GET api/posts
//@desc     get all post
//@access   Private

router.get('/' ,auth, async (req , res) =>{
    try {
        const posts = await Post.find().sort({date : -1});
        return res.json(posts);

    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Eror at post')
        
    }
})

//@route    GET api/posts/:id
//@desc     get post by id
//@access   Private

router.get('/:id' ,auth, async (req , res) =>{
    try {
        const post = await Post.findById(req.params.id);
        if(!post){
            return res.status(500).json('no post for this id')
        }

        return res.json(post);

    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            return res.status(404).json('Post not found')
        }
        return res.status(500).send('Server Eror at post by id')
        
    }
})


//@route    DELETE api/posts/:id
//@desc     delete post by id
//@access   Private

router.delete('/:id' ,auth, async (req , res) =>{
    try {
        
        const post = await Post.findById(req.params.id);
        if(!post){
            return res.status(404).json('Post not found')
        }
        //check user
        if(post.user.toString()!=req.user.id){
            return res.status(401).json({msg : 'User not authorised'})
        }
        await post.remove();

    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            return res.status(404).json('Post not found')
        }
        return res.status(500).send('Server Eror at post by id')
        
    }
})

//@route    PUT api/posts/like/:id
//@desc     like post by id
//@access   Private

router.put('/like/:id' , auth , async(req , res)=>{
    try {
        const post = await Post.findById(req.params.id);

        //Check if the post has been liked already
        if(post.likes.filter(like=>like.user.toString() === req.user.id).length > 0){
            return res.status(400).json({msg : 'Already Liked'})
        }
        post.likes.unshift({user : req.user.id});
        await post.save();
        return res.json(post.likes)
        
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('server error at like')
        
    }
})


//@route    PUT api/posts/unlike/:id
//@desc     unlike post by id
//@access   Private

router.put('/unlike/:id' , auth , async(req , res)=>{
    try {
        const post = await Post.findById(req.params.id);


        //Check if the post has been liked before unliking
        if(post.likes.filter(like=>like.user.toString() === req.user.id).length === 0){
            return res.status(400).json({msg : 'Post has not yet been liked'});
        }
        //get remove index
        const removeIndex = post.likes.map(like=>like.user.toString())
        .indexOf(req.user.id);
        post.likes.splice(removeIndex , 1);

        await post.save();
        return res.json(post.likes)
        
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('server error at like')
        
    }
})

//@route    POST api/posts/comment/:id
//@desc     comment on a post
//@access   Private

router.post('/comment/:id' ,[auth ,[
    check('text' , 'text cannot be empty')
    .not()
    .isEmpty()
]],
async (req , res) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({erros:errors.array()});
    }
    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);

        const newComment = {
            text: req.body.text,
            name : user.name,
            avatar : user.avatar,
            user : req.user.id
        };
        post.comments.unshift(newComment)

        await post.save();

        return res.json(post.comments);
        
        
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Eror at comment')
        
    }
})

//@route    DELETE api/posts/comment/:id/:comment_id
//@desc     delete comment on a post
//@access   Private

router.delete('/comment/:id/:comment_id' , auth , async ( req , res) =>{
    try {
        const post = await Post.findById(req.params.id);
    //pull out comment
    const comment = post.comments.find
    (comment=>comment.id === req.params.comment_id );

    if(!comment){
        return res.status(404).json({msg :'comment does not exist'});
    }
    if(comment.user.toString()!== req.user.id){
        return res.status(401).json({msg : "user not authorized"})
    }

     //get remove index
     const removeIndex = post.comments.map(comment => comment.user.toString())
     .indexOf(req.user.id);

     post.comments.splice(removeIndex , 1);
     await post.save()

    } catch (err) {
         console.error(err.message);
        return res.status(500).send('Server Eror at comment')
    }
    
})



module.exports = router;