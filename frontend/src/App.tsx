import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./NavBar/NavBar";
import About from "./About/About";
import Demo1 from "./Demos/Demo1";
import Demo2 from "./Demos/Demo2";
import Demo3 from "./Demos/Demo3";

function App() {
  return (
    <div className="App">
      <div className="site-title box">
        <h1>Physics Engine for the Web</h1>
      </div>
      <div className="horizontal-container">
        <NavBar />
        <div id="main_page">
          <Routes>
            <Route path="/about" element={<About />}></Route>
            <Route path="/demo1" element={<Demo1 />}></Route>
            <Route path="/demo2" element={<Demo2 />}></Route>
            <Route path="/demo3" element={<Demo3 />}></Route>

            <Route path="/" element={<Navigate to="/about" />}></Route>
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
