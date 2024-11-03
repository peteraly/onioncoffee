import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css'; // Assuming you have a Header CSS file for styling

const Header = () => {
  return (
    <header className="header">
      <nav className="navbar">
        <ul className="nav-list">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/login">Login</Link> {/* Add Login link */}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
