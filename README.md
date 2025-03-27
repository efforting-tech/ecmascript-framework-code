# TODO

- Populate repository
- Document the structure

- There are a bunch of JSON.stringify in comparisons in tests, we should probably use a comparison function of some kind.


## Working overview

This overview is for when planning out where to put different components in this library.

The library will have a hierarchy based on composition. There will be some very low level aspects that serves as the foundation.
These will typically live near the root directory and then more specific stuff can be deeper.

If we later want to have a some sort of factory based system we can just add that as a sub module near the root.


## Test implementation


| Filename                          | Tests implemented   |
| --------                          | -----------------   |
| iteration/switchable-iterator.js  | 1/1                 |
| formats/xml/processing.js         | 1/5                 |
| formats/xml/utils.js              | 0/4                 |
| data/matches.js                   | ?                   |
| data/stack.js                     | ?                   |
| data/conditions.js                | ?                   |
| data/rules.js                     | ?                   |
| data/operators.js                 | ?                   |
| parsing/generic-parser.js         | ?                   |
| enum.js                           | ?                   |
| formatting/ansi/simple-themes.js  | ?                   |
