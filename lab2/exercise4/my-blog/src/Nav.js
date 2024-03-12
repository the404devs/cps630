import { Outlet, Link } from "react-router-dom";

const Layout = () => {
  return (
    <>
      <nav>
            <Link to="/">Home</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/new-post">Add new post</Link>
      </nav>

      <Outlet />
    </>
  )
};

export default Layout;