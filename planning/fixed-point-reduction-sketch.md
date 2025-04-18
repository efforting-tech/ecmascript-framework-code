## Scanning

## State manager
> [!NOTE]
> The state manager here is for fixed point implementation.
> It is its own object that can be referenced from the scanner.


### Regarding serialized states
When we serialize a state we could make a hash and hope for no hash collisions.
I don't like that idea but we can use a hash to speed up matching since strings are matched left to right.
Even just prepending the last N bytes of a hash to the string could make a great performance difference for deep states that only differ deep down.

### function: initialize()
> The state manager itself might require a persistent state across calls.
> This function will initialize the state manager and state journal.

### function: maybe_initialize()
> Call initialize if is_initialized is false.

### function: is_initialized()
> Returns whether the state manager is initialized or not - typically used by the default `maybe_initialize()` function.

### function: gather_state(sequence)
> Typically deferred to some object that was created in initialize but for simpler types may just do some normalization step on sequence.

### function: seen_state(state)
> Returns whether a state exists in the state journal.

### function: log_state(state)
> Adds a state to the state journal.

### function: clear_state_journal()
> Clears state journal.




## Scanner
### function: transform(sequence)
> Runs perform_reduction() until the limit condition is hit.

### function: perform_reduction()
> Performs one reduction and increments the reduction counter which could be utilized in `is_limit_reached()`.

### function: update_limit_reached(value=true)
> Updates an explicit limit flag that is part of evaluating the `is_limit_reached()` function.

### function: is_limit_reached()
> Whether the limit has been reached or not.
> Could of course be overridden by a getter downstream.