import * as O from 'efforting.tech-framework/data/operators.js';
import { POSIX_Tree_Directory } from 'efforting.tech-framework/data/object.js';
import { create_block_rule, create_named_definition_rule } from 'efforting.tech-framework/templates/rule-factories.js';
import { REQUIREMENT_STATE } from 'efforting.tech-framework/data/management.js';


import * as fs from 'node:fs';
import { inspect } from 'node:util';

function root_normalize(path) {
	if (path.at(0) === '/') {
		return path;
	} else {
		return `/${path}`;
	}
}

function resolve(base, relative) {
	return POSIX_Tree_Directory.resolve_path(base, relative).slice(0, -1);
}


const capture_anything = [REQUIREMENT_STATE.NOT_ALLOWED, REQUIREMENT_STATE.REQUIRED, REQUIREMENT_STATE.NOT_ALLOWED, true, /.+/];

class List_of_Requirements {
	constructor(requirements) {
		Object.assign(this, { requirements });
	}
}

class Requirement {
	constructor(path) {
		Object.assign(this, { path });
	}
}

class Brief {
	constructor(text) {
		Object.assign(this, { text });
	}
}

class Implementation_Version {
	constructor(version, implemented) {
		Object.assign(this, { version, implemented });
	}
}

class Plan {
	constructor(contents) {
		Object.assign(this, { contents });
	}

	*walk_components() {
		const { contents } = this;
		for (const item of contents) {
			for (const { path, component } of item.walk_components()) {
				yield { path , component };
			}
		}
	}

	validate_components() {
		const result = new Map();
		for (const {path, component} of data_set.walk_components()) {
			const canonical_path = root_normalize(path);
			if (result.has(canonical_path)) {
				throw new Error(canonical_path);
			}
			result.set(canonical_path, component);
		}
	}

	get_components() {
		const result = new Map();
		for (const {path, component} of data_set.walk_components()) {
			const canonical_path = root_normalize(path);
			result.set(canonical_path, component);
		}
		return result;
	}

}

class Component {
	constructor(path, abstract=undefined, brief=undefined, requirements=[], sub_components=[], implementation_version=new Set()) {
		Object.assign(this, { path, abstract, brief, requirements, sub_components, implementation_version });
	}

	*walk_components() {
		const { sub_components } = this;
		yield { path: this.path, component: this };
		for (const item of sub_components) {
			for (const { path, component } of item.walk_components()) {
				yield { path: resolve(this.path, path), component };
			}
		}
	}

	get_requirements(path) {
		//HACK: Since component doesn't know where it sits in a tree we supply path here
		const result = new Set();
		for (const requirement of this.requirements) {
			const rq_path = root_normalize(resolve(path, requirement.path));
			result.add(rq_path);
		}
		return result;
	}

}



class Included_Tree {
	constructor(file_path, contents=[]) {
		Object.assign(this, { file_path, contents });
	}

	*walk_components() {
		const { contents } = this;
		for (const item of contents) {
			yield* item.walk_components();
		}
	}

}

class Group {
	constructor(path, members=[]) {
		Object.assign(this, { path, members });
	}

	*walk_components() {
		const { members } = this;
		for (const item of members) {
			for (const { path, component } of item.walk_components()) {
				yield { path: resolve(this.path, path), component };
			}
		}
	}

}


function handle_component(component, item) {

	for (const sub_component of component_parser.process_tree(item.body)) {
		switch (sub_component.constructor) {
			case Array:
				if (sub_component.length > 0) {
					throw new Error('Array');
				}
				break;

			case List_of_Requirements:
				component.requirements.push(...sub_component.requirements);
				break;

			case Brief:
				if (component.brief) {
					throw new Error('component has brief');
				}
				component.brief = sub_component;
				break;

			case Implementation_Version:
				component.implementation_version.add(sub_component);
				break;

			case Component:
				component.sub_components.push(sub_component);
				break;

			default:
				throw new Error(inspect(sub_component));
		}
	}
}


const common_parser = new O.Tree_Processor('common_parser', [
	create_block_rule('component', (resolver, item, match, group_args) => {
		const [component] = match.value.value.slice(1);
		const result = new Component(component);
		handle_component(result, item);
		return result;
	}, ...capture_anything),

	create_block_rule('concrete component', (resolver, item, match, group_args) => {
		const [component] = match.value.value.slice(1);
		const result = new Component(component, false);
		handle_component(result, item);
		return result;
	}, ...capture_anything),

	create_block_rule('abstract component', (resolver, item, match, group_args) => {
		const [component] = match.value.value.slice(1);
		const result = new Component(component, true);
		handle_component(result, item);
		return result;
	}, ...capture_anything),

	create_block_rule('include', (resolver, item, match, group_args) => {
		const [path] = match.value.value.slice(1);
		return new Included_Tree(path, resolver.process_text(fs.readFileSync(path, 'utf8')));
	}, ...capture_anything),


]);

const component_parser = new O.Tree_Processor('component_parser', [

	create_block_rule('brief', (resolver, item, match, group_args) => {
		const [text] = match.value.value.slice(1);
		return new Brief(text);
	}, ...capture_anything),

	create_block_rule('planned implementation for', (resolver, item, match, group_args) => {
		const [version] = match.value.value.slice(1);
		return new Implementation_Version(version, false);
	}, ...capture_anything),

	create_block_rule('implemented for', (resolver, item, match, group_args) => {
		const [version] = match.value.value.slice(1);
		return new Implementation_Version(version, true);
	}, ...capture_anything),

	create_block_rule('requires', (resolver, item, match, group_args) => {
		const result = [];
		for (const entry of item.body) {
			result.push(new Requirement(entry.title));
		}
		return new List_of_Requirements(result);
	}, ...capture_anything),

	...common_parser.rules,

]);


const plan_parser = new O.Tree_Processor('plan_parser', [
	create_block_rule('group', (resolver, item, match, group_args) => {
		const [group] = match.value.value.slice(1);
		const result = new Group(group);
		for (const group_member of resolver.process_tree(item.body)) {
			result.members.push(group_member);
		}
		return result;
	}, ...capture_anything),

	...common_parser.rules,

]);



const data_set = new Plan(plan_parser.process_text(fs.readFileSync('tree-language.treedef', 'utf8')))

data_set.validate_components();
const components = data_set.get_components();

const resolved = new Set(components.keys());
const required = new Set();
const implemented = new Map();

for (const [path, component] of components.entries()) {
	for (const iv of component.implementation_version) {
		if (iv) {
			if (implemented.has(iv.version)) {
				implemented.get(iv.version).add(component);
			} else {
				implemented.set(iv.version, new Set([component]));
			}
		}
	}
	for (const rq of component.get_requirements(path)) {
		required.add(rq);
	}
}

const unresolved = new Set(required);
for (const rq of resolved) {
	unresolved.delete(rq);
}

//NOTE: This doesn't look into whether these are implemented or abstract/concrete
console.log('resolved', resolved)
console.log('unresolved', unresolved)
console.log('implementations', implemented)


//console.log(inspect(data_set, { colors: true, depth: null} ));