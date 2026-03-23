import React from "react";
import { Link } from "react-router-dom";

const NavItems = ({ items }) => {
  return items.map((f, i) => (
    <li key={i} className="nav-item">
      <Link to={f.urls[0].url} className="nav-link">
        <i className={"nav-icon " + f.icono} />
        <p>{f.nombre}</p>
      </Link>
    </li>
  ));
};

export default NavItems;