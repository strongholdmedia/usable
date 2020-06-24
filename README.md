# usable.js

## Making the Web / DOM usable

### The problem

Since Google, Apple and a few others hold the Web / DOM hostage (mainly through "WHATWG"), blocking useful evolutions while deliberately introducing dumb or egotistic changes, the whole model "evolved" into the split personality of a dystopian nightmare on one hand and being stuck in the '00s at the other.

This project is an attempt at turning (parts of) the DOM API into things both _usable_ and _consistent_.

### Installation, usage

First,

`npm install @dorgaren/usable`

then

`require("@dorgaren/usable").install();`

`install()` accepts an optional argument for the global object.
If you run it in Node but have a `window` global for anything (else), or conversely, are using it in browser but having a `global` global reserved for something, you may hint at which global object to use, by choosing

`require("@dorgaren/usable").install(window); // browser`

or

`require("@dorgaren/usable").install(global); // Node`

explicitly.

### Current aims

* An `EventTarget` that is actually _reasonable_ in functionality
* Dynamic `HTMLCollection` and `NodeList`
* ... (more to come)

### Non-goals

There is stuff that would be great to make useful, but cannot really be touched from JS side.
Some of these:

* Useful CSS dimension units (like `ch`, `cw` for "content height", "content width", or `ph`/`pw` for "parent height, parent width", respectively)
* ... (will add stuff here)

### Do you have a basis for all this nonsense?

_Surely enough_, I will add details about the actual issues _as I will have time_, that is, _by 1.0_ hopefully.
Please stay tuned until then.
_In general_, however, apart from some rants, this project mainly tries to take its stance on the _scientific_, as opposed to the _guru_/_religious_ side; so if the _goals_ above don't tell you much, please don't bother.

### Caveats

**Please note that some implementations here may not be the most optimal approaches, either in general, or on the specific platform you use.**

This will definitely evolve over time, as long as the underlying proof-of-concept is viable.

### FAQ

1. Why is this not in pure ES5 / ES6 / whatever syntax?

Most of the stuff that needs to be accessible for this kind of matter to work is either _inaccessible_ or _discouraged_ in ES6.
Meanwhile, there are a lot of "syntactic sugars" that are generally useful in ES6, causing little to no ambiguity, and are supported 

This should work _natively_ in IE11 and anything from 2016 onwards.

_Should you have any issues, though, just run this through some "transpiler"._ I tested it extensively with `Buble`.

2. Why no minification / packaging?

Please consider all of this _experimental_ before 1.0.
That means that _the core goals are warranted_, but nothing else, neither expressed nor implied.
This latter includes things like payload size or computational performance.
