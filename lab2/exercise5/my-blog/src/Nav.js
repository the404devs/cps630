import { Outlet, Link } from "react-router-dom";

const Layout = () => {
  return (
    <>
      <nav>
            <Link to="/">Home</Link>
            <span className="spacer">⋄</span>
            <Link to="/blog">Blog</Link>
            <span className="spacer">⋄</span>
            <Link to="/new-post">Add New Post</Link>
      </nav>

      <Outlet />
    </>
  )
};

export default Layout;