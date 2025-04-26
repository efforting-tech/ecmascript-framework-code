export function sequence_in_place_replacement(match, ...replacement) {
	match.sequence_reference.splice(match.sequence_start, match.sequence_length, ...replacement);
}