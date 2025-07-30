// This pseudo code is for generating curved fan blades for building squirrel cage type fans.

// /usr/lib/qcad/scripts/Misc/MiscIO/DrawFromCSV/DrawFromCSV_Tests/DrawCSV_test.csv

//Pseudo language - if js knew vectors
//inputs: start, r1, r2, step_angle, radial_step_size, minimum_true_step_size
let dir = normalize(start);
const radial_distance = r2 - r1;
const step_count = radial_distance / radial_step_size;

const result = new PolyLine();

result.push_point(start);
for (const step of repeat(step_count)) {
	// Compute intersection of (positive ray situated at point "c" with direction "dir") and (circle situated at point "start" with radius "r")
	const c = result.last_point;
	const r = c.magnitude + radial_step_size;
	const b = c * dir;
	const k = c.square_magnitude - r**2;
	const local_step_size = (-b + Math.sqrt(b**2 - 4*k)) / 2;

	if (local_step_size < minimum_true_step_size) {
		throw new Error('Local step size too small, reduce step_angle');
	}
	result.push_point(c + dir * local_step_size);

	dir *= rotate2(step_angle);	//rotate2 would be a 2x2 rotation matrix
}
emit(result);