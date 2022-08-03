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
                <NavigationLink name="Home" url="/home"></NavigationLink>
                <NavigationLink name="Playground" url="/playground"></NavigationLink>
                <NavigationLink name="Playground 2" url="/playground2"></NavigationLink>
                <NavigationLink name="Playground 3" url="/playground3"></NavigationLink>
                <NavigationLink name="Playground 4" url="/playground4"></NavigationLink>
                <NavigationLink name="Playground 5" url="/playground5"></NavigationLink>
                <NavigationLink name="Playground 6" url="/playground6"></NavigationLink>
                <NavigationLink name="Playground 7" url="/playground7"></NavigationLink>
                <NavigationLink name="Playground 8" url="/playground8"></NavigationLink>
            </div>
        )
    }
}