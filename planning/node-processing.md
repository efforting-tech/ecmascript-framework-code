# Node Processing

## Source tracking implementation

Currently we do not have source tracking as part of the abstract node system.

I initially let the node system bear this responsibility but later I figured this should be a separate concern that may depend on the context.

---

Here is a previously used snippet

```js

//TODO - decide if we should utilize this or not - the idea was that expression_node may have an expression as a title or maybe even body.
//class Expression_Node extends Template_Node {};
class Resolver_Match {
	constructor(resolver, item, match) {
		Object.assign(this, { resolver, item, match });
	}
}
```

This snippet was used in conjunction with this one

```js
const Template_TT_Resolver = new O.Tree_Processor('Template_TT_Resolver', [

	new R.Resolution_Rule(new C.Title_Condition(new C.Regex_Condition( /§\s*(.*)/ )),
		(resolver, item, match) => {
			const statement = match.value.value[1];
			const node = item.copy(statement);
			node[CONTEXT_SYMBOL] = DEFAULT_CONTEXT;
			return Template_Statement_Resolver.resolve(node);
		}
	),

	new R.Resolution_Rule(new C.Title_Condition(new C.Regex_Condition( /(.*)/ )),
		//TODO - actually parse the title using the template parser
		(resolver, item, match) => {
			const result = new T_AST.Template_Node(item.title, resolver.process_tree(item.body));
			//TODO: attach this source: new Resolver_Match(resolver, item, match)

			return result;
		}
	),
]);
```

The plan here is to run things through a filter that will attach the source, maybe something like

```js
return new attach_source_tracking(T_AST.Something(), some_source_info);
```

I do need to mind the language here. `attach_source_tracking` is not a filter, it is an operation that mutates its target and returns the same reference of what it mutated.
This is useful for inline operations but I do not know what we should call this. Let's call it `Inline Operation`