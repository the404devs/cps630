import react, {useEffect, useState} from 'react';

function Blog() {
    // const [posts, setPosts] = useState([
    //     {id: 1, title: 'First Post', content: "This is the first post."},
    //     {id: 2, title: 'Second Post', content: "This is the second post."}
    // ]);

    const [posts, setPosts] = useState([{}]);
    useEffect(() => {
        fetch("http://localhost:3001/api/posts").then(response => {
            if (response.ok) {
                console.log(response);
               return response.json();
            }
        }).then(data => {
            setPosts(data);
        });
    }, []);
    
    

    return (
        <div className='content'>
            <h2>Blog Posts</h2>
            {
                posts.map((post) => (
                    <div className='post' key={post.id}>
                        <h3>{post.title}</h3>
                        <p>{post.content}</p>
                    </div>
                ))
            }
        </div>
    );
}

export default Blog;