import React, { useState } from "react";

function NewPost({onAddPost}) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const newPost = {id: Date.now(), title, content};
        // onAddPost(newPost);
        console.log(JSON.stringify(newPost));
        fetch("http://localhost:3001/api/posts", {
            headers: {
                "Content-Type": "application/json"
            },
            method: 'POST', 
            body: JSON.stringify(newPost)
        });
        setTitle('');
        setContent('');
        alert("Post submitted successfully!");
    };

    return (
        <div>
            <h2>Add a new post:</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Title:</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                    <label>Content:</label>
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} />
                </div>
                <button type="submit">Add Post</button>
            </form>
        </div>
    )
}

export default NewPost;