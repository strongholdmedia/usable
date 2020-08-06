# Release Notes

### v0.2.0

* Fixed `ParentNode.append` behavior

It was completely broken. First, these so-called `interface`s are *virtual*.
That means, they *only exist in documentation* (and perhaps

This was something I was completely unaware of. As such, while `Node.appendChild`
worked a treat, `ParentNode.append` missed all the hooks, and thus apparently
did nothing.

Moreover, the MDN also refers to `ParentNode` as a *mixin* - something which is
seemingly not true either - at least for Firefox, the prototype methods for
`Document`, `DocumentFragment` and `Element` were quite distinct.

As such, these needed a separate implementation to their own.

* Added `.focus()` support

From now on, just set an element's `autofocus` attribute to `true`, and it will
automatically be focused on DOM insertion.

Supported elements are currently `a`, `button`, `input`, `select`, and `textarea`.

Please let me know if I'm missing something.

_Surely enough, from multiple elements to be focused, only the last one will
have it._

### v0.1.1

* Added support for options (as a second argument to `Usable.install()`

Just pass `null` as `globalObject` if you want to keep the autodetection, while
also providing options.

* Made attempts at removing non-existent event handlers just fail _silently_.

You _wouldn't believe_ how many libraries attempt to routinely remove event handlers
that they have never added..

So this is the new default.

* Added support to enable debug messages

bool `enableDebugging`: false

Set to `true` to see the previous error messages as warnings in the console.
Immensely useful to check random third party scripts (even major ones!) for consistency.

* Added option to attempt to remove _invalid_ (that is, not registered)

bool `attemptRemoveInvalid`: false

This may seem ridiculous, but I did actually believe there is something wrong
with `Useful.js` while I tried to locate suspicious issues.

Generally you should _never_ use this, because it should make _no difference
whatsoever_, **as long as `Useful.js` is the first script you load**.

If, however, this is something you can't do, you may _attempt_ to check if there are any inconsistencies.

**If you do load `Useful.js` first, and still see that this option is making a
difference, please report it as an issue, and possibly provide a test case.**

### v0.1.0

Initial release
