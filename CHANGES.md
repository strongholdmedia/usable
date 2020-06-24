# Release Notes

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
