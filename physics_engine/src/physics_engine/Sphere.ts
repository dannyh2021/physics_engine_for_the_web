import * as THREE from "three";
import { Vector3 } from "three";

const DAMPING = 0.999;

export class Sphere {
    public position: Vector3;
    public velocity: Vector3;
    public acceleration: Vector3;

    // holds the accumulated force to be applied to the next simulation iteration only.
    public forceAccum: Vector3;

    public radius: number;
    public inverseMass: number;

    constructor(position: Vector3, radius: number) {
        this.position = position;
        this.velocity = new Vector3(0, 0, 0);
        this.acceleration = new Vector3(0, 0, 0);

        this.forceAccum = new Vector3(0, 0, 0);

        this.radius = radius;
        this.inverseMass = 1;
    }

    integrate(duration: number): void {
        // Don't integrate if mass is infinite or duration <= 0.
        if (this.inverseMass <= 0 || duration <= 0)
            return;

        // Work out the acceleration from the force.
        this.acceleration = this.forceAccum.clone().multiplyScalar(this.inverseMass);

        // Clear the forces.
        this.clearAccumulator();

        // impose drag.
        this.velocity.multiplyScalar(Math.pow(DAMPING, duration));

        // update the velocity from the acceleration.
        this.velocity.addScaledVector(this.acceleration, duration);

        // update the linear position.
        this.position.addScaledVector(this.velocity, duration);
    }

    // Clears the forces applied to the particle.
    clearAccumulator(): void {
        this.forceAccum = new Vector3(0, 0, 0);
    }

    getPosition(): Vector3 {
        return this.position.clone();
    }
}