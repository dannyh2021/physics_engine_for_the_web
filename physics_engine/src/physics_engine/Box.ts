import * as THREE from "three";
import { Vector3 } from "three";

export class Box {
    constructor(public position: Vector3, public velocity: Vector3, public acceleration: Vector3,
                public width: number, public length: number, public height: number) { }
}