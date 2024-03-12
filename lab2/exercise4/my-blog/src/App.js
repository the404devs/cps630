import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Blog from './Blog';
import Home from './Home';
import NewPost from './NewPost';
import Nav from './Nav';

import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Nav />}>
          <Route index element={<Home />} />
          <Route path="blog" element={<Blog />} />
          <Route path="new-post" element={<NewPost />} />
        </Route>
      </Routes>
    </BrowserRouter>
      <header className="App-header">
        {/* <Home /> */}
      </header>
    </div>
  );
}

export default App;
