import { Matrix3, Vector3 } from "three";
import * as THREE from "three";
import { Sphere } from "./Sphere";
import { Box } from "./Box";
import { Plane } from "./Plane";

export class World {
    public objects: any[];
    public coefficient_of_restitution: number = 1; // 0 is fully inelastic, 1 is fully elastic
    public dt: number = 1/60; // time step in seconds

    constructor() {
        this.objects = [];
    }

    addObject(obj: any): void {
        this.objects.push(obj);
    }

    getAllBoundingBoxIntersections() {
        // for now just sort against x-axis. Slightly better is to update axis based on one with highest variance
        // worst case is still O(n^2)
    
        function compareBoundingBoxes(a: any, b: any) {
            const a_min = a.position.x - a.boundingBox.x/2;
            const b_min = b.position.x - b.boundingBox.x/2;
            return a_min - b_min;
        }
    
        // sort objects along x-axis
        const objectsCopy = [...this.objects];
        objectsCopy.sort(compareBoundingBoxes);
    
        // sweep the array for collisions
        const intersections = [];
        for(let i = 0; i < objectsCopy.length - 1; i++) {
            // test against all possible overlapping boxes following the current one.
            for(let j = i + 1; j < objectsCopy.length; j++) {
                // stop testing when AABBs are beyond the current AABB
                const i_max = objectsCopy[i].position.x + objectsCopy[i].boundingBox.x/2;
                const j_min = objectsCopy[j].position.x - objectsCopy[j].boundingBox.x/2;
                if (j_min > i_max) {
                    break;
                }
    
                if (checkBoundingBoxIntersection(objectsCopy[i], objectsCopy[j])) {
                    intersections.push({
                        a: objectsCopy[i],
                        b: objectsCopy[j]
                    });
                }
            }
        }
        return intersections;
    }

    // applies the forceAccum, detects and resolves collisions, and finally updates the positions of all objects.
    tick(duration: number): void {
        for (let object of this.objects) {
            if (object instanceof Plane) {
                continue;
            }

            object.integrateForceAccum(duration);
        }

        const boundingBoxIntersections = this.getAllBoundingBoxIntersections();
        const contacts = getAllContacts(boundingBoxIntersections);
        
        for (let contact of contacts) {
            resolveCollision(contact);
        }

        for (let object of this.objects) {
            if (object instanceof Plane) {
                continue;
            }

            object.integrate(duration);
        }
    }

    // integrates the forceAccum to update the velocity of each object
    integrateForceAccumObjects(duration: number): void {
        for(let object of this.objects) {
            if (object instanceof Plane) {
                continue;
            }

            object.integrateForceAccum(duration);
        }
    }

    // integrates the velocities to update the position of each object
    integrateObjects(duration: number): void {
        for (let object of this.objects) {
            if (object instanceof Plane) {
                continue;
            }

            object.integrate(duration);
        }
    }

    updateMeshes(): void {
        for (let object of this.objects) {
            if (object instanceof Plane) {
                continue;
            }

            object.updateMesh();
            object.updateBoundingBoxMesh();
        }
    }
}

/**
 * checks if the bounding box of two objects intersect
 * @param a the first object
 * @param b the other object
 */
export function checkBoundingBoxIntersection(a: any, b: any): boolean {
    // create intervals
    const a_x_min = a.position.x - a.boundingBox.x/2;
    const a_x_max = a.position.x + a.boundingBox.x/2;
    const a_y_min = a.position.y - a.boundingBox.y/2;
    const a_y_max = a.position.y + a.boundingBox.y/2;
    const a_z_min = a.position.z - a.boundingBox.z/2;
    const a_z_max = a.position.z + a.boundingBox.z/2;
    const b_x_min = b.position.x - b.boundingBox.x/2;
    const b_x_max = b.position.x + b.boundingBox.x/2;
    const b_y_min = b.position.y - b.boundingBox.y/2;
    const b_y_max = b.position.y + b.boundingBox.y/2;
    const b_z_min = b.position.z - b.boundingBox.z/2;
    const b_z_max = b.position.z + b.boundingBox.z/2;

    // intersecting if all intervals are intersecting
    if ((a_x_min < b_x_max && b_x_min < a_x_max) &&
        (a_y_min < b_y_max && b_y_min < a_y_max) &&
        (a_z_min < b_z_max && b_z_min < a_z_max)) {
        return true
    }
    return false;
}

// returns true if the two objects are intersecting
export function checkCollision(a: any, b: any): boolean {
    if (a instanceof Box && b instanceof Box) {
        return checkCollisionBoxes(a, b);
    } else if (a instanceof Box && b instanceof Sphere) {
        return checkCollisionBoxAndSphere(a, b);
    } else if (a instanceof Box && b instanceof Plane) {
        return checkCollisionBoxAndPlane(a, b);
    } else if (a instanceof Sphere && b instanceof Box) {
        return checkCollisionBoxAndSphere(b, a);
    } else if (a instanceof Sphere && b instanceof Sphere) {
        return checkCollisionSpheres(a, b);
    } else if (a instanceof Sphere && b instanceof Plane) {
        return checkCollisionSphereAndPlane(a, b);
    } else if (a instanceof Plane && b instanceof Box) {
        return checkCollisionBoxAndPlane(b, a);
    } else if (a instanceof Plane && b instanceof Sphere) {
        return checkCollisionSphereAndPlane(b, a);
    } else {
        console.error("checking collision between these types not implemented.");
    }
}

export function checkCollisionBoxes(a: Box, b: Box): boolean {
    // two convex objects don't collide iff there exists a separating plane between them

    // search for separating plane.
    // either its contain a face of one polyhedra or it contains an edge of one polyhedra and is parallel to the edge of the other polyhedra.

    const a_coordinateAxes = getCoordinateAxes(a);
    const b_coordinateAxes = getCoordinateAxes(b);

    // check the 6 face axes
    for (let faceAxis of a_coordinateAxes) {
        if (separatingAxisPenetration(a, b, faceAxis) < 0) {
            return false;
        }
    }
    for (let faceAxis of b_coordinateAxes) {
        if (separatingAxisPenetration(a, b, faceAxis) < 0) {
            return false;
        }
    }

    // check the 9 edge-edge axes
    for (let a_axis of a_coordinateAxes) {
        for (let b_axis of b_coordinateAxes) {
            let m = a_axis.clone().cross(b_axis).normalize();
            if (m.length() > 0) { // note to self: should use epsilon when checking for zero vector to  improve stability
                if (separatingAxisPenetration(a, b, m) < 0) {
                    return false;
                }
            } else {
                // for now, ignore case where the corresponding edges are parallel.
                continue;
            }
        }
    }

    return true;
}

export function checkCollisionSpheres(a: Sphere, b: Sphere): boolean {
    // two spheres intersect if the distance between their centers is not greater than the sum of their radii
    const d = a.position.clone().sub(b.position).length();
    return d <= a.radius + b.radius;
}

export function checkCollisionSphereAndPlane(sphere: Sphere, plane: Plane) {
    const relativePosition = sphere.position.clone().sub(plane.position);
    const d = relativePosition.dot(plane.normal); // distance to center of sphere, negative if center is below plane.
    return d <= sphere.radius;
}

export function checkCollisionBoxAndSphere(box: Box, sphere: Sphere): boolean {
    // convert sphere center to box coordinate space
    const inverseRotation = box.rotation.clone();
    let sphereCenter = sphere.position.clone().sub(box.position).applyQuaternion(inverseRotation);

    // Clamp each coordinate to the box.
    const closestPoint = sphereCenter.clone();
    closestPoint.x = Math.max(Math.min(closestPoint.x, box.width/2), -box.width/2);
    closestPoint.y = Math.max(Math.min(closestPoint.y, box.length/2), -box.length/2);
    closestPoint.z = Math.max(Math.min(closestPoint.z, box.height/2), -box.height/2);

    // check if they're in contact
    const distance = sphereCenter.clone().sub(closestPoint).length();
    return distance < sphere.radius;
}

export function checkCollisionBoxAndPlane(box: Box, plane: Plane): boolean {
    const vertices = getVertices(box);
    for (let v of vertices) {
        const relative_position = v.clone().sub(plane.position);
        const d = relative_position.dot(plane.normal);
        if (d < 0) {
            return true;
        }
    }
    return false;
}

export function getAllContacts(boundingBoxIntersections: any[]) {
    const contacts = [];
    for(let i = 0; i < boundingBoxIntersections.length; i++) {
        const a = boundingBoxIntersections[i].a;
        const b = boundingBoxIntersections[i].b;

        // check for collisions and color them
        if (checkCollision(a, b)) {
            const contact = getContactData(a, b);
            contacts.push(contact);
        }
    }

    return contacts;
}

// todo: refactor functions below

export function getContactData(a: any, b: any) {
    if (a instanceof Box && b instanceof Box) {
        return getContactDataBoxes(a, b);
    } else if (a instanceof Box && b instanceof Sphere) {
        return getContactDataBoxAndSphere(a, b);
    } else if (a instanceof Box && b instanceof Plane) {
        return getContactDataBoxAndPlane(a, b);
    } else if (a instanceof Sphere && b instanceof Box) {
        return getContactDataBoxAndSphere(b, a);
    } else if (a instanceof Sphere && b instanceof Sphere) {
        return getContactDataSpheres(a, b);
    } else if (a instanceof Sphere && b instanceof Plane) {
        return getContactDataSphereAndPlane(a, b);
    } else if (a instanceof Plane && b instanceof Box) {
        return getContactDataBoxAndPlane(b, a);
    } else if (a instanceof Plane && b instanceof Sphere) {
        return getContactDataSphereAndPlane(b, a);
    } else {
        console.error("getting contact data between these types not implemented.");
        return {
            a: a,
            b: b,
            type: "none",
            contactNormal: new Vector3(0, 0, 1),
            penetration: 0,
            contactPoint: new Vector3(0, 0, 0),
            edge_a: { a: new Vector3(0, 0, 0), b: new Vector3(0, 0, 0) },
            edge_b: { a: new Vector3(0, 0, 0), b: new Vector3(0, 0, 0) }
        };
    }
}

// note: all getContact functions assume the objects already intersect.

// convention: contact data is of format {a, b, type, contactNormal, penetration, contactPoint, ...} where contactNormal points from b to a
// get contact data for two colliding boxes, assuming collision
function getContactDataBoxes(a: Box, b: Box) {
    const vector_ab = b.position.clone().sub(a.position);
    const a_coordinateAxes = getCoordinateAxes(a);
    const b_coordinateAxes = getCoordinateAxes(b);
    let smallestOverlap = Infinity;
    let contact;

    for (let a_axis of a_coordinateAxes) {
        const overlap = separatingAxisPenetration(a, b, a_axis);
        if (overlap < smallestOverlap) {
            smallestOverlap = overlap;

            // set contact
            const axis = a_axis.clone();
            if (vector_ab.dot(axis) < 0) { // orient axis to normal of the correct face.
                axis.multiplyScalar(-1);
            }
            axis.normalize();
            const vertex = getClosestVertex(a, b, axis);
            contact = {
                a: b,
                b: a,
                type: "vertex-face",
                contactNormal: axis,
                penetration: smallestOverlap,
                contactPoint: vertex,
                edge_a: { a: new Vector3(0, 0, 0), b: new Vector3(0, 0, 0) },
                edge_b: { a: new Vector3(0, 0, 0), b: new Vector3(0, 0, 0) }
            };
        }
    }
    for (let b_axis of b_coordinateAxes) {
        const overlap = separatingAxisPenetration(a, b, b_axis);
        if (overlap < smallestOverlap) {
            smallestOverlap = overlap;

            // set contact
            const axis = b_axis.clone();
            if (vector_ab.clone().dot(axis) > 0) { // orient axis to normal of the correct face.
                axis.multiplyScalar(-1);
            }
            axis.normalize();
            const vertex = getClosestVertex(b, a, axis);
            contact = {
                a: a,
                b: b, 
                type: "vertex-face",
                contactNormal: axis,
                penetration: smallestOverlap,
                contactPoint: vertex,
                edge_a: { a: new Vector3(0, 0, 0), b: new Vector3(0, 0, 0) },
                edge_b: { a: new Vector3(0, 0, 0), b: new Vector3(0, 0, 0) }
            };
        }
    }

    for (let a_axis of a_coordinateAxes) {
        for (let b_axis of b_coordinateAxes) {
            let m = a_axis.clone().cross(b_axis).normalize();
            if (m.length() > 0.005) { // check parallel edges
                const overlap = separatingAxisPenetration(a, b, m);

                if (overlap < smallestOverlap) {
                    smallestOverlap = overlap;

                    // set contact
                    const axis = m.clone();
                    if (vector_ab.clone().dot(axis) > 0) {
                        axis.multiplyScalar(-1);
                    }
                    axis.normalize();
                    const edge_a = getClosestEdge(b, a, a_axis, m);
                    const edge_b = getClosestEdge(a, b, b_axis, m);
                    contact = {
                        a: a,
                        b: b,
                        type: "edge-edge",
                        contactNormal: axis,
                        penetration: smallestOverlap,
                        contactPoint: getClosestPointBetweenTwoEdges(edge_a, edge_b),
                        edge_a: edge_a,
                        edge_b: edge_b
                    };
                }
            } else {
                // for now, ignore case where the corresponding edges are parallel.
                continue;
            }
        }
    }
    
    return contact;
}

function getContactDataBoxAndSphere(box: Box, sphere: Sphere) {
    // convert sphere center to box coordinate space
    const inverseRotation = box.rotation.clone();
    let sphereCenter = sphere.position.clone().sub(box.position).applyQuaternion(inverseRotation);

    // Clamp each coordinate to the box.
    let closestPoint = sphereCenter.clone();
    closestPoint.x = Math.max(Math.min(closestPoint.x, box.width/2), -box.width/2);
    closestPoint.y = Math.max(Math.min(closestPoint.y, box.length/2), -box.length/2);
    closestPoint.z = Math.max(Math.min(closestPoint.z, box.height/2), -box.height/2);

    const distance = sphereCenter.clone().sub(closestPoint).length();
    const penetration = sphere.radius - distance;

    // convert back to world space
    closestPoint.applyQuaternion(box.rotation).add(box.position);

    const contactPoint = closestPoint;
    const contactNormal = closestPoint.clone().sub(sphere.position.clone()).normalize();

    const contact = {
        a: box,
        b: sphere,
        type: "vertex-face",
        contactNormal: contactNormal,
        penetration: penetration,
        contactPoint: contactPoint,
        edge_a: { a: new Vector3(0, 0, 0), b: new Vector3(0, 0, 0) },
        edge_b: { a: new Vector3(0, 0, 0), b: new Vector3(0, 0, 0) }
    }
    return contact;
}

function getContactDataSpheres(a: Sphere, b: Sphere) {
    const v_ab = b.position.clone().sub(a.position);
    const contactPoint = a.position.clone().add(v_ab.clone().multiplyScalar(a.radius).sub(v_ab.clone().multiplyScalar(b.radius)).multiplyScalar(0.5));
    const penetration = a.radius - b.radius - v_ab.length()
    const contactNormal = v_ab.clone().multiplyScalar(-1).normalize();
    const contact = {
        a: a,
        b: b,
        type: "vertex-face",
        contactNormal: contactNormal,
        penetration: penetration,
        contactPoint: contactPoint,
        edge_a: { a: new Vector3(0, 0, 0), b: new Vector3(0, 0, 0) },
        edge_b: { a: new Vector3(0, 0, 0), b: new Vector3(0, 0, 0) }
    }
    return contact;
}

function getContactDataBoxAndPlane(box: Box, plane: Plane) {
    const vertices = getVertices(box);
    let contactPoint = vertices[0];
    let penetration = 0;
    
    for (let v of vertices) {
        const relative_position = v.clone().sub(plane.position);
        const d = relative_position.dot(plane.normal);
        if (d < penetration) {
            contactPoint = v;
            penetration = d;
        }
    }

    const contact = {
        a: box,
        b: plane,
        type: "vertex-face",
        contactNormal: plane.normal.clone(),
        penetration: penetration,
        contactPoint: contactPoint,
        edge_a: { a: new Vector3(0, 0, 0), b: new Vector3(0, 0, 0) },
        edge_b: { a: new Vector3(0, 0, 0), b: new Vector3(0, 0, 0) }
    };
    return contact;
}

function getContactDataSphereAndPlane(sphere: Sphere, plane: Plane) {
    const relativePosition = sphere.position.clone().sub(plane.position);
    const d = relativePosition.dot(plane.normal); // distance to center of sphere, negative if center is below plane.
    const penetration = sphere.radius - d;

    const contactPoint = sphere.position.clone().addScaledVector(plane.normal, -sphere.radius);

    const contact = {
        a: sphere,
        b: plane,
        type: "vertex-face",
        contactNormal: plane.normal.clone(),
        penetration: penetration,
        contactPoint: contactPoint,
        edge_a: { a: new Vector3(0, 0, 0), b: new Vector3(0, 0, 0) },
        edge_b: { a: new Vector3(0, 0, 0), b: new Vector3(0, 0, 0) }
    };
    return contact;
}

const coefficient_of_restitution = 0.8;
export function resolveCollision(contactData: any) {
    const a = contactData.a;
    const b = contactData.b;
    const normal = contactData.contactNormal;
    if (contactData.type === "vertex-face") {
        console.log("resolving vertex-face contact");
        const vertex = contactData.contactPoint;
        const r_a = vertex.clone().sub(a.position);
        const r_b = vertex.clone().sub(b.position);
        const vertexVelocity_a = a.velocity.clone().add(a.getAngularVelocity().cross(r_a));
        const vertexVelocity_b = b.velocity.clone().add(b.getAngularVelocity().cross(r_b));
        const relativeVelocity = normal.dot(vertexVelocity_a.clone().sub(vertexVelocity_b));
        if (relativeVelocity < 0) {
            console.log("colliding contact");
            
            const I_inverse_a = a.getInertia().invert();
            const I_inverse_b = b.getInertia().invert();

            const term1 = normal.dot(r_a.clone().cross(normal).applyMatrix3(I_inverse_a).cross(r_a));
            const term2 = normal.dot(r_b.clone().cross(normal).applyMatrix3(I_inverse_b).cross(r_b));

            const j = -(1 + coefficient_of_restitution) * relativeVelocity / (a.inverseMass + b.inverseMass + term1 + term2);
            console.log("relative Velocity: ", relativeVelocity);

            const impulse = normal.clone().multiplyScalar(j);
            const impulse2 = normal.clone().multiplyScalar(-j);
            a.applyImpulse(vertex, impulse);
            b.applyImpulse(vertex, impulse2);
        } else if (relativeVelocity === 0) {
            console.log("resting contact");
        } else {
            // ignore
            console.log("leaving");
        }
    } else if (contactData.type === "edge-edge") {
        console.log("resolving edge-edge contact");
        console.log("edge_a", contactData.edge_a);
        console.log("edge_b", contactData.edge_b);
        console.log("contactNormal: ", contactData.contactNormal);

        const vertex = getClosestPointBetweenTwoEdges(contactData.edge_a, contactData.edge_b);
        const r_a = vertex.clone().sub(a.position);
        const r_b = vertex.clone().sub(b.position);
        const vertexVelocity_a = a.velocity.clone().add(a.getAngularVelocity().cross(r_a));
        const vertexVelocity_b = b.velocity.clone().add(b.getAngularVelocity().cross(r_b));
        const relativeVelocity = normal.dot(vertexVelocity_a.clone().sub(vertexVelocity_b));
        if (relativeVelocity < 0) {
            console.log("colliding contact");
            
            const I_inverse_a = a.getInertia().invert();
            let I_inverse_b = b.getInertia().invert();

            const term1 = normal.dot(r_a.clone().cross(normal).applyMatrix3(I_inverse_a).cross(r_a));
            const term2 = normal.dot(r_b.clone().cross(normal).applyMatrix3(I_inverse_b).cross(r_b));

            const j = -(1 + coefficient_of_restitution) * relativeVelocity / (a.inverseMass + b.inverseMass + term1 + term2);

            const impulse = normal.clone().multiplyScalar(j);
            const impulse2 = normal.clone().multiplyScalar(-j);
            a.applyImpulse(vertex, impulse);
            b.applyImpulse(vertex, impulse2);
        } else if (relativeVelocity === 0) {
            console.log("resting contact");
        } else {
            // ignore
            console.log("leaving");
        }
    } else {
        console.error("contactData type not recognized.");
        console.log("contact data: ", contactData);
    }
}

// returns closest edge of box b
// edge should be parallel to input edgeVector
function getClosestEdge(a: Box, b: Box, edgeVector: Vector3, separatingAxis: Vector3) {
    const x = separatingAxis.x;
    const y = separatingAxis.y;
    const z = separatingAxis.z;
    const projectionMatrix = new Matrix3();
    projectionMatrix.set(
        x*x, x*y, x*z,
        x*y, y*y, y*z,
        x*z, y*z, z*z
    );

    const a_center = a.position.clone().applyMatrix3(projectionMatrix);

    const b_edges = getEdges(b);
    const parallel_b_edges = [];
    for (let b_edge of b_edges) {
        const b_edgeVector = b_edge.b.clone().sub(b_edge.a);
        if (b_edgeVector.clone().cross(edgeVector).length() < 0.005) {
            parallel_b_edges.push(b_edge);
        }
    }

    let closestEdge = parallel_b_edges[0];
    let closestDistance = closestEdge.a.clone().sub(a_center).length();
    for (let b_edge of parallel_b_edges) {
        const d = b_edge.a.clone().sub(a_center).length();
        if (d < closestDistance) {
            closestDistance = d;
            closestEdge = b_edge;
        }
    }

    return closestEdge;
}

// returns closest vertex of box b to face of box a
function getClosestVertex(a: Box, b: Box, lineVector: Vector3): Vector3 {
    const a_vertices = getVertices(a);
    const b_vertices = getVertices(b);

    const x = lineVector.x;
    const y = lineVector.y;
    const z = lineVector.z;
    const projectionMatrix = new Matrix3();
    projectionMatrix.set(
        x*x, x*y, x*z,
        x*y, y*y, y*z,
        x*z, y*z, z*z
    );

    const a_center = a.position.clone().applyMatrix3(projectionMatrix);

    let a_radius = 0;

    for (let a_v of a_vertices) {
        const a_v_projection = a_v.clone().applyMatrix3(projectionMatrix);
        const r = a_v_projection.clone().sub(a_center).length();
        if (r > a_radius) {
            a_radius = r;
        }
    }

    const b_center = b.position.clone().applyMatrix3(projectionMatrix);
    let vertex = b_vertices[0];
    let smallestDistanceToA = b_center.clone().sub(a_center).length() - a_radius;

    for (let b_v of b_vertices) {
        const b_v_projection = b_v.clone().applyMatrix3(projectionMatrix);
        const d = b_v_projection.clone().sub(a_center).length() - a_radius;
        if (d < smallestDistanceToA) {
            smallestDistanceToA = d;
            vertex = b_v;
        }
    }

    return vertex;
}

function separatingAxisPenetration(a: Box, b: Box, lineVector: Vector3): number {
    const x = lineVector.x;
    const y = lineVector.y;
    const z = lineVector.z;
    const projectionMatrix = new Matrix3();
    projectionMatrix.set(
        x*x, x*y, x*z,
        x*y, y*y, y*z,
        x*z, y*z, z*z
    );

    const a_center = a.position.clone().applyMatrix3(projectionMatrix);
    const b_center = b.position.clone().applyMatrix3(projectionMatrix);
    const d = b_center.clone().sub(a_center).length();

    const a_vertices = getVertices(a);
    const b_vertices = getVertices(b);

    let r_a = 0, r_b = 0;
    for (let a_v of a_vertices) {
        const a_v_projection = a_v.applyMatrix3(projectionMatrix);
        const r = a_center.clone().sub(a_v_projection).length()
        if (r > r_a) {
            r_a = r;
        }
    }
    for (let b_v of b_vertices) {
        const b_v_projection = b_v.applyMatrix3(projectionMatrix);
        const r = b_center.clone().sub(b_v_projection).length()
        if (r > r_b) {
            r_b = r;
        }
    }

    // returns the overlap. positive indicates overlap, negative indicates separation.
    return r_a + r_b - d;
}

function getClosestPointBetweenTwoEdges(e1: any, e2: any) {
    const p1 = e1.a;
    const p2 = e1.b;
    const p3 = e2.a;
    const p4 = e2.b;

    const v12 = p2.clone().sub(p1);
    const v34 = p4.clone().sub(p3);
    const v13 = p3.clone().sub(p1);

    let s, t;

    // terms
    const R_1_squared = v12.dot(v12);
    const R_2_squared = v34.dot(v34);
    const D_4321 = v12.dot(v34);
    const D_3121 = v12.dot(v13);
    const D_4331 = v13.dot(v34);
    const denominator = D_4321*D_4321 - R_1_squared*R_2_squared;

    s = (D_4321*D_4331 - R_2_squared*D_3121) / denominator;
    t = (R_1_squared*D_4331 - D_4321*D_3121) / denominator;

    s = Math.max(Math.min(s, 1), 0);
    t = Math.max(Math.min(t, 1), 0);

    const point_a = e1.a.clone().add(v12.clone().multiplyScalar(s));
    const point_b = e2.a.clone().add(v34.clone().multiplyScalar(t));

    return point_a.clone().add(point_b).multiplyScalar(1/2);
}

function getCoordinateAxes(box: Box) {
    const x = new Vector3(1, 0, 0), y = new Vector3(0, 1, 0), z = new Vector3(0, 0, 1);

    const axes = [x, y, z];

    for (let axis of axes) {
        axis.applyQuaternion(box.rotation);
    }
    return axes;
}

function getVertices(box: Box) {
    const x = box.position.x;
    const y = box.position.y;
    const z = box.position.z;
    const v1 = new Vector3(x - box.width/2, y - box.length/2, z - box.height/2);
    const v2 = new Vector3(x - box.width/2, y + box.length/2, z - box.height/2);
    const v3 = new Vector3(x + box.width/2, y + box.length/2, z - box.height/2);
    const v4 = new Vector3(x + box.width/2, y - box.length/2, z - box.height/2);
    const v5 = new Vector3(x - box.width/2, y - box.length/2, z + box.height/2);
    const v6 = new Vector3(x - box.width/2, y + box.length/2, z + box.height/2);
    const v7 = new Vector3(x + box.width/2, y + box.length/2, z + box.height/2);
    const v8 = new Vector3(x + box.width/2, y - box.length/2, z + box.height/2);
    const vertices = [v1, v2, v3, v4, v5, v6, v7, v8];

    // rotate vertices
    for (let vertex of vertices) {
        // convert to body space, apply rotation, convert back to world space
        vertex.sub(box.position);
        vertex.applyQuaternion(box.rotation);
        vertex.add(box.position);
    }

    return vertices;
}

function getEdges(box: Box) {
    const x = box.position.x;
    const y = box.position.y;
    const z = box.position.z;
    const v1 = new Vector3(x - box.width/2, y - box.length/2, z - box.height/2);
    const v2 = new Vector3(x - box.width/2, y + box.length/2, z - box.height/2);
    const v3 = new Vector3(x + box.width/2, y + box.length/2, z - box.height/2);
    const v4 = new Vector3(x + box.width/2, y - box.length/2, z - box.height/2);
    const v5 = new Vector3(x - box.width/2, y - box.length/2, z + box.height/2);
    const v6 = new Vector3(x - box.width/2, y + box.length/2, z + box.height/2);
    const v7 = new Vector3(x + box.width/2, y + box.length/2, z + box.height/2);
    const v8 = new Vector3(x + box.width/2, y - box.length/2, z + box.height/2);
    const vertices = [v1, v2, v3, v4, v5, v6, v7, v8];

    // rotate vertices
    for (let vertex of vertices) {
        // convert to body space, apply rotation, convert back to world space
        vertex.sub(box.position);
        vertex.applyQuaternion(box.rotation);
        vertex.add(box.position);
    }

    const edges = [];
    edges.push({a: v1, b: v2});
    edges.push({a: v1, b: v4});
    edges.push({a: v1, b: v5});
    edges.push({a: v2, b: v3});
    edges.push({a: v2, b: v6});
    edges.push({a: v3, b: v4});
    edges.push({a: v3, b: v7});
    edges.push({a: v4, b: v8});
    edges.push({a: v5, b: v6});
    edges.push({a: v5, b: v8});
    edges.push({a: v6, b: v7});
    edges.push({a: v7, b: v8});

    return edges;
}

export function getAllBoundingBoxIntersections(objects: any[]) {
    // for now just sort against x-axis. Slightly better is to update axis based on one with highest variance
    // worst case is still O(n^2)

    function compareBoundingBoxes(a: any, b: any) {
        const a_min = a.position.x - a.boundingBox.x/2;
        const b_min = b.position.x - b.boundingBox.x/2;
        return a_min - b_min;
    }

    // sort objects along x-axis
    const objectsCopy = [...objects];
    objectsCopy.sort(compareBoundingBoxes);

    // sweep the array for collisions
    const intersections = [];
    for(let i = 0; i < objectsCopy.length - 1; i++) {
        // test against all possible overlapping boxes following the current one.
        for(let j = i + 1; j < objectsCopy.length; j++) {
            // stop testing when AABBs are beyond the current AABB
            const i_max = objectsCopy[i].position.x + objectsCopy[i].boundingBox.x/2;
            const j_min = objectsCopy[j].position.x - objectsCopy[j].boundingBox.x/2;
            if (j_min > i_max) {
                break;
            }

            if (checkBoundingBoxIntersection(objectsCopy[i], objectsCopy[j])) {
                intersections.push({
                    a: objectsCopy[i],
                    b: objectsCopy[j]
                });
            }
        }
    }
    return intersections;
}

/**
 * for symmetrical objects, valid separating axis iff sum the radii (half_widths) of the projected intervals is less than the distance between the centers
 * @param a 
 * @param b 
 * @param lineVector a unit vector describing the direction of the line
 * @returns true if the lineVector is a separating axis
 */
/*export function testSeparatingAxis(a: Box, b: Box, lineVector: Vector3): boolean {
    const x = lineVector.x;
    const y = lineVector.y;
    const z = lineVector.z;
    const projectionMatrix = new Matrix3();
    projectionMatrix.set(
        x*x, x*y, x*z,
        x*y, y*y, y*z,
        x*z, y*z, z*z
    );

    const a_center = a.position.clone().applyMatrix3(projectionMatrix);
    const b_center = b.position.clone().applyMatrix3(projectionMatrix);
    const d = b_center.clone().sub(a_center).length();

    const a_vertices = getVertices(a);
    const b_vertices = getVertices(b);
    
    let r_a = 0, r_b = 0;
    for (let a_v of a_vertices) {
        const a_v_projection = a_v.applyMatrix3(projectionMatrix);
        const r = a_center.clone().sub(a_v_projection).length()
        if (r > r_a) {
            r_a = r;
        }
    }
    for (let b_v of b_vertices) {
        const b_v_projection = b_v.applyMatrix3(projectionMatrix);
        const r = b_center.clone().sub(b_v_projection).length()
        if (r > r_b) {
            r_b = r;
        }
    }
    if (r_a + r_b < d) {
        return true;
    }

    return false;
}*/

/*
export function checkCollisionBoxes(a: Box, b: Box): boolean {
    // two convex objects don't collide iff there exists a separating plane between them

    // search for separating plane.
    // either its contain a face of one polyhedra or it contains an edge of one polyhedra and is parallel to the edge of the other polyhedra.
    
    const a_facePlanes = getFacePlanes(a);
    for (let facePlane of a_facePlanes) {
        if (testSeparatingAxis(a, b, facePlane.normal)) {
            return false;
        };
    }
    const b_facePlanes = getFacePlanes(b);
    for (let facePlane of b_facePlanes) {
        if (testSeparatingAxis(a, b, facePlane.normal)) {
            return false;
        }
    }

    const a_edges = getEdges(a);
    const b_edges = getEdges(b);

    for (let i = 0; i < a_edges.length; i++) {
        for (let j = 0; j < b_edges.length; j++) {
            const edge_i = a_edges[i].b.clone().sub(a_edges[i].a);
            const edge_j = b_edges[j].b.clone().sub(b_edges[j].a);
            let m = edge_i.clone().cross(edge_j);
            if (m.length() !== 0) { // note to self: should use epsilon when checking for zero vector to improve stability
                if (testSeparatingAxis(a, b, m)) {
                    return false;
                }
            } else {
                const edge_n = b_edges[j].b.clone().sub(a_edges[i].a);
                m = edge_i.clone().cross(edge_n);
                if (m.length() !== 0) {
                    testSeparatingAxis(a, b, m);
                } else {
                    return true; // since edge_i and edge_2 are colinear
                }
            }
        }
    }

    return true;
}*/

/*
function getFaces(box: Box) {
    const x = box.position.x;
    const y = box.position.y;
    const z = box.position.z;
    const v1 = new Vector3(x - box.width/2, y - box.length/2, z - box.height/2);
    const v2 = new Vector3(x - box.width/2, y + box.length/2, z - box.height/2);
    const v3 = new Vector3(x + box.width/2, y + box.length/2, z - box.height/2);
    const v4 = new Vector3(x + box.width/2, y - box.length/2, z - box.height/2);
    const v5 = new Vector3(x - box.width/2, y - box.length/2, z + box.height/2);
    const v6 = new Vector3(x - box.width/2, y + box.length/2, z + box.height/2);
    const v7 = new Vector3(x + box.width/2, y + box.length/2, z + box.height/2);
    const v8 = new Vector3(x + box.width/2, y - box.length/2, z + box.height/2);
    const vertices = [v1, v2, v3, v4, v5, v6, v7, v8];

    // rotate vertices
    for (let vertex of vertices) {
        // convert to body space, apply rotation, convert back to world space
        vertex.sub(box.position);
        vertex.applyQuaternion(box.rotation);
        vertex.add(box.position);
    }
    
    const f1 = { edges: [{a: v1, b: v2}, {a: v1, b: v4}, {a: v2, b: v3}, {a: v3, b: v4}] }; // bottom
    const f2 = { edges: [{a: v5, b: v6}, {a: v5, b: v8}, {a: v6, b: v7}, {a: v7, b: v8}] }; // top
    const f3 = { edges: [{a: v1, b: v2}, {a: v1, b: v5}, {a: v5, b: v6}, {a: v6, b: v2}] }; // left
    const f4 = { edges: [{a: v4, b: v8}, {a: v4, b: v3}, {a: v8, b: v7}, {a: v7, b: v3}] }; // right
    const f5 = { edges: [{a: v1, b: v4}, {a: v1, b: v5}, {a: v5, b: v8}, {a: v8, b: v4}] }; // front
    const f6 = { edges: [{a: v2, b: v3}, {a: v2, b: v6}, {a: v6, b: v7}, {a: v7, b: v3}] }; // back
    const faces = [f1, f2, f3, f4, f5, f6];
    return faces;
}*/

/*
export function getAllBoundingBoxIntersections(boxes: Box[]) {
    // create and sort intervals along x, y, and z
    const x_intervals = [];
    const y_intervals = [];
    const z_intervals = [];
    for(let box of boxes) {
        const x_min = box.position.x - box.boundingBox.x/2;
        const x_max = box.position.x + box.boundingBox.x/2;
        x_intervals.push({ type: "min", value: x_min, object: box});
        x_intervals.push({ type: "max", value: x_max, object: box});

        
        const y_min = box.position.y - box.boundingBox.y/2;
        const y_max = box.position.y + box.boundingBox.y/2;
        y_intervals.push({ type: "min", value: y_min, object: box});
        y_intervals.push({ type: "max", value: y_max, object: box});

        const z_min = box.position.z - box.boundingBox.z/2;
        const z_max = box.position.z + box.boundingBox.z/2;
        z_intervals.push({ type: "min", value: z_min, object: box});
        z_intervals.push({ type: "max", value: z_max, object: box});
    }
    // note to self: switch to insertion sort and use normal merge sort only during the initialization frame
    x_intervals.sort((a, b) => a.value - b.value);
    //y_intervals.sort((a, b) => a.value - b.value);
    //z_intervals.sort((a, b) => a.value - b.value);

    // create a list of active intervals
    const activeIntervals = [];
}*/

/*
export class World2 {
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

        let lastTimeCalled = performance.now();
        let fps = 0;
        let times: any[] = [];

        function step() {
            // calculate fps
            const now = performance.now();
            while (times.length > 0 && times[0] <= now - 1000) {
                times.shift();
            }
            times.push(now);
            fps = times.length;
            // console.log("fps: ", fps);

            for (let i = 0; i < currentInstance.objects.length; i++) {
                currentInstance.objects[i].integrate(dt);
            }
        }

        this.currentLoopInterval = setInterval(step, dt * 1000);
    }

    // Stops current loop if it exists.
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
}*/

/*
function getFacePlanes(box: Box) {
    const x = box.position.x;
    const y = box.position.y;
    const z = box.position.z;
    const v1 = new Vector3(x - box.width/2, y - box.length/2, z - box.height/2);
    const v2 = new Vector3(x - box.width/2, y + box.length/2, z - box.height/2);
    const v3 = new Vector3(x + box.width/2, y + box.length/2, z - box.height/2);
    const v4 = new Vector3(x + box.width/2, y - box.length/2, z - box.height/2);
    const v5 = new Vector3(x - box.width/2, y - box.length/2, z + box.height/2);
    const v6 = new Vector3(x - box.width/2, y + box.length/2, z + box.height/2);
    const v7 = new Vector3(x + box.width/2, y + box.length/2, z + box.height/2);
    const v8 = new Vector3(x + box.width/2, y - box.length/2, z + box.height/2);
    const vertices = [v1, v2, v3, v4, v5, v6, v7, v8];

    // rotate vertices
    for (let vertex of vertices) {
        // convert to body space, apply rotation, convert back to world space
        vertex.sub(box.position);
        vertex.applyQuaternion(box.rotation);
        vertex.add(box.position);
    }
    const face1 = { normal: ((v2.clone().sub(v1)).cross(v4.clone().sub(v1))).normalize(), point: v1 } // bottom plane
    const face2 = { normal: ((v8.clone().sub(v5)).cross(v6.clone().sub(v5))).normalize(), point: v5 } // top plane
    const face3 = { normal: ((v5.clone().sub(v1)).cross(v2.clone().sub(v1))).normalize(), point: v1 } // left plane
    const face4 = { normal: ((v3.clone().sub(v4)).cross(v8.clone().sub(v4))).normalize(), point: v4 } // top plane
    const face5 = { normal: ((v4.clone().sub(v1)).cross(v5.clone().sub(v1))).normalize(), point: v1 } // front plane
    const face6 = { normal: ((v2.clone().sub(v3)).cross(v7.clone().sub(v3))).normalize(), point: v3 } // back plane
    const facePlanes = [face1, face2, face3, face4, face5, face6];
    return facePlanes;
}*/