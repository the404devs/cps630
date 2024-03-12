const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

let posts = [
    {id: 1, title: 'First Post', content: "This is the first post."},   {id: 2, title: 'Second Post', content: "This is the second post."} 
];

app.get('/api/posts', (req, res) => {
    res.json(posts);
});

app.get('/api/homeData', (req, res) => {
    const homeData = {
        message: "zdfsgxhcgfvbhjn"
    };
    res.json(homeData);
});

app.post('/api/posts', (req, res) => {
    console.log(req.body);
    const {title, content} = req.body;

    if (!title || !content) {
        return res.status(400).json({error: "Title and content are required."});
    }
    const newPost = {id: Date.now(), title, content};
    posts.push(newPost);
    res.status(201).json(newPost);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});