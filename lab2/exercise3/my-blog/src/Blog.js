import react, {useEffect, useState} from 'react';

function Blog() {
    const [posts, setPosts] = useState([
        {id: 1, title: 'First Post', content: "This is the first post."},
        {id: 2, title: 'Second Post', content: "This is the second post."}
    ]);   
    

    return (
        <div>
            <h2>Blog Posts</h2>
            {
                posts.map((post) => (
                    <div key={post.id}>
                        <h3>{post.title}</h3>
                        <p>{post.content}</p>
                    </div>
                ))
            }
        </div>
    );
}

export default Blog;