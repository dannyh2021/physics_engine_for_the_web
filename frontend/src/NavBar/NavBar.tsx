import React from "react";
import { NavLink } from "react-router-dom";
import s from "./NavBar.module.css";

function NavigationLink(props: any) {
    return (
        <div>
            <NavLink className={({ isActive }) => (isActive ? s.active_link : s.link)} to={props.url}>
                <h2>{props.name}</h2>
            </NavLink>
        </div>
    )
}

export default class NavBar extends React.Component {
    render() {
        return (
            <div className={s.navbar}>
                <NavigationLink name="About" url="/about"></NavigationLink>
                <NavigationLink name="Demo 1" url="/demo1"></NavigationLink>
                <NavigationLink name="Demo 2" url="/demo2"></NavigationLink>
                <NavigationLink name="Demo 3" url="/demo3"></NavigationLink>
            </div>
        )
    }
}