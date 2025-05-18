import { Enum } from '../enum.js';

export const State_Function = new Enum('State_Function', {
	Get_State: Symbol,
	Get_Factory: Symbol,
	Get_Constructor: Symbol,
	From_State: Symbol,
});
