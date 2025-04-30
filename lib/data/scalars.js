export function clamped_scalar(value, low=undefined, high=undefined) {
	if ((low !== undefined) && (value < low)) {
		return low;
	} else if ((high !== undefined) && (value > high)) {
		return high;
	} else {
		return value;
	}
}

