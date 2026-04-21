import logo from "../assets/logo.png";

function Navbar() {
  return (
    <nav className="navbar">
      <img src={logo} alt="GBN Logo" className="navbar-logo" />
    </nav>
  );
}

export default Navbar;
