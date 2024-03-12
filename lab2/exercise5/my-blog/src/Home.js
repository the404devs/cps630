import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';

function Home () {

    const [message, setMessage] = useState({});

    useEffect(() => {
        fetch("http://localhost:3001/api/homeData").then(response => {
            if (response.ok) {
                console.log(response);
               return response.json();
            }
        }).then(data => {
            setMessage(data);
        });
    }, []);

    return (
        <>
            {
                <div className='content'>
                    <h2>{message.header}</h2>
                    <p>{message.content}</p>
                </div>
            }
        </>
    );
}

export default Home;