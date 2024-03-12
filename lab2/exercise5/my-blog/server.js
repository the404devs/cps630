const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());


mongoose.connect('mongodb://localhost:27017/blogDB', { useNewUrlParser: true, useUnifiedTopology: true }); 

const postSchema = new mongoose.Schema({ title: String, content: String }); 
const Post = mongoose.model('Post', postSchema); 

app.get('/api/posts', async (req, res) => {
    try { 
        const posts = await Post.find({}); 
        res.json(posts); 
    } catch (err) { 
        res.status(500).send(err); 
    } 
});

app.get('/api/homeData', (req, res) => {
    const homeData = {
        message: "Welcome!"
    };
    res.json(homeData);
});

app.post('/api/posts', (req, res) => {
    console.log(req.body);
    const {title, content} = req.body;

    if (!title || !content) {
        return res.status(400).json({error: "Title and content are required."});
    }
    const newPost = new Post({id: Date.now(), title, content});
    // posts.push(newPost);
    newPost.save().then(() => {
        res.status(201).json(newPost);
    })
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});