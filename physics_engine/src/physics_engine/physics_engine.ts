import { Vector3 } from "three";
import * as THREE from "three";
import { Sphere } from "./Sphere";
import { Box } from "./Box";
// import { Sphere } from "three";

const dt = 1/60; // time step in seconds

export class World {
    private objects: any[] = [];
    private currentLoopInterval: any = null;

    private characterForce: Vector3;

    constructor() {
        this.objects = [];

        this.characterForce = new Vector3(0, 0, 0);
    }

    startLoop(): void {
        const currentInstance = this;

        // stop current loop if it exits
        this.stopCurrentLoop();

        //let lastTimeCalled = performance.now();
        //let fps = 0;
        //let times: any[] = [];

        function step() {
            // calculate fps
            /*const now = performance.now();
            while (times.length > 0 && times[0] <= now - 1000) {
                times.shift();
            }
            times.push(now);
            fps = times.length;*/
            // console.log("fps: ", fps);

            for (let i = 0; i < currentInstance.objects.length; i++) {
                currentInstance.objects[i].integrate(dt);
            }
        }

        this.currentLoopInterval = setInterval(step, dt * 1000);
    }

    /** Stops current loop if it exists. */
    stopCurrentLoop(): void {
        if (this.currentLoopInterval) {
            clearInterval(this.currentLoopInterval);
        }
    }

    addObject(obj: any): void {
        this.objects.push(obj);
    }

    getObjects(): any[] {
        return this.objects;
    }

    updateCharacterForce(f: Vector3) {
        this.characterForce = f;
    }

    detectCollisions(): void {

    }

    checkCollisionSpheres(s1: Sphere, s2: Sphere) {
        const d = (s1.position.clone().sub(s2.position)).length(); // distance between centers

        // collision if distance between spheres is smaller than sub of radiuses
        if (d < (s1.radius + s2.radius)) {
            return true;
        }
        return false;
    }

    resolveCollisionSpheres(s1: Sphere, s2: Sphere) {
        // find unit vectors from s1 to s2 and s2 to s1
        const u12 = (s2.position.clone().sub(s1.position)).normalize();
        const u21 = u12.clone().multiplyScalar(-1);

        // find components of v1 and v2 along and perpendicular to u
        const v1_along_u12 = u12.clone().multiplyScalar(u12.dot(s1.velocity));
        const v2_along_u21 = u21.clone().multiplyScalar(u21.dot(s2.velocity));

        const v1_perp_u12 = s1.velocity.clone().sub(v1_along_u12);
        const v2_perp_u21 = s2.velocity.clone().sub(v2_along_u21);

        // calculate new velocities along u, assuming elastic collision
        const m1 = 1/s1.inverseMass;
        const m2 = 1/s2.inverseMass;
        const v1_along_u_new = (v1_along_u12.clone().multiplyScalar((m1-m2)/(m1+m2))).addScaledVector(v2_along_u21, (2*m2)/(m1+m2));
        const v2_along_u_new = (v1_along_u12.clone().multiplyScalar((2*m1)/(m1+m2))).addScaledVector(v2_along_u21, -(m1-m2)/(m1+m2));

        // calculate and set new velocities
        const v1_new = v1_along_u_new.clone().add(v1_perp_u12);
        const v2_new = v2_along_u_new.clone().add(v2_perp_u21);

        console.log("u: ", u12);
        console.log("v1_new: ", v1_new);
        console.log("v2_new", v2_new);
    }

    clearCurrentLoop(): void {
        clearInterval(this.currentLoopInterval);
    }
}