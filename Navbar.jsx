import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/">Home</Link>
      <Link to="/add-item">Add Item</Link>
      <Link to="/login">Login</Link>
    </nav>
  );
};

export default Navbar;
