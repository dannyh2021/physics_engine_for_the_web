import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./NavBar/NavBar";
import Home from "./Home/Home";
import Playground from "./Playgrounds/Playground";
import Playground2 from "./Playgrounds/Playground2";
import Playground3 from "./Playgrounds/Playground3";
import Playground4 from "./Playgrounds/Playground4";
import Playground5 from "./Playgrounds/Playground5";
import Playground6 from "./Playgrounds/Playground6";

function App() {
  return (
    <div className="App">
      <div className="site-title-box">
        <h1>Physics Engine for the Web</h1>
      </div>
      <div className="horizontal-container">
        <NavBar />
        <div id="main_page">
          <Routes>
            <Route path="/home" element={<Home />}></Route>
            <Route path="/playground" element={<Playground />}></Route>
            <Route path="/playground2" element={<Playground2 />}></Route>
            <Route path="/playground3" element={<Playground3 />}></Route>
            <Route path="/playground4" element={<Playground4 />}></Route>
            <Route path="/playground5" element={<Playground5 />}></Route>
            <Route path="/playground6" element={<Playground6 />}></Route>

            <Route path="/" element={<Navigate to="/home" />}></Route>
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
