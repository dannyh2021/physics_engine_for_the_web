import { World } from "../src/physics_engine/physics_engine";
import { Sphere } from "../src/physics_engine/Sphere";
import { Box } from "../src/physics_engine/Box";
import { Vector3 } from "three";
import { isExportDeclaration } from "typescript";

describe("testing sphere collision", () => {
    const s1 = new Sphere(new Vector3(0, 0, 0), 3);
    const s2 = new Sphere(new Vector3(0, 3, 0), 2);
    const s3 = new Sphere(new Vector3(5, 5), 1);

    const w = new World();

    test("s1 and s2 should collide", () => {
        expect(w.checkCollisionSpheres(s1, s2)).toBe(true);
    })
    test("s1 and s3 shouldn't collide", () => {
        expect(w.checkCollisionSpheres(s1, s3)).toBe(false);
    })
})