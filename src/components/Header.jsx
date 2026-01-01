import React from 'react';

function Header({ onExampleSearch }) {
  return (
    <header>
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <i className="fas fa-car"></i>
          </div>
          <h1>AutoParts Pro</h1>
          <p className="subtitle">Поиск автозапчастей по артикулу</p>
        </div>
      </div>
    </header>
  );
}

export default Header;