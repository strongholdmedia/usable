/**
 * Usable.js, version 0.2.0
 *
 * Copyright (c) 2020, Victor Csiky, Stronghold-Terra Nonprofit llc
 * All rights reserved.
 *
 * See LICENSE (BSD 3-clause) for details.
 */
const Usable = {
    install: function install(globalObject, options)
    {
        globalObject = globalObject || window || global || {};
        options = options || {};

        let enableDebugging = typeof options.enableDebugging === "boolean" && options.enableDebugging,
            attemptRemoveInvalid = typeof options.attemptRemoveInvalid === "boolean" && options.attemptRemoveInvalid,
            domObject = typeof options.dom === "object" && options.dom || globalObject,
            domDocument = typeof globalObject.document === "object" && globalObject.document || null;

        function debug(message)
        {
            if (enableDebugging && globalObject.console && globalObject.console.warn)
            {
                globalObject.console.warn(message);
            }
        }

        // this shim is based on Polymer Project's work; thanks!
        if (typeof WeakMap === "undefined")
        {
            let WeakMap = function WeakMap()
            {
                this.name = "_$$" + (Math.random() * 1e9 >>> 0) + (Date.now() % 1e9 + 1) + "$$";
            };

            WeakMap.prototype = {
                set: function setEntry(key, value)
                {
                    let entry = key[this.name];

                    if (entry && entry[0] === key)
                    {
                        entry[1] = value;
                    }
                    else
                    {
                        Object.defineProperty(key, this.name, { value: [ key, value ], writable: true });
                    }

                    return this;
                },
                get: function getEntry(key)
                {
                    let entry = key[this.name];

                    return entry && entry[0] === key
                        ? entry[1]
                        : undefined;
                },
                delete: function deleteEntry(key)
                {
                    let entry = key[this.name],
                        retVal = entry && entry[0] === key;

                    if (retVal) { entry[0] = entry[1] = undefined; }

                    return retVal;
                },
                has: function hasEntry(key)
                {
                    let entry = key[this.name];

                    return entry && entry[0] === key;
                }
            };

            globalObject.WeakMap = WeakMap;
        }

        let eventHandlerQueue = new WeakMap,
            eventNameCache = {},
            oldEventTargetAddEventListener = globalObject.EventTarget.prototype.addEventListener,
            oldEventTargetRemoveEventListener = globalObject.EventTarget.prototype.removeEventListener,
            oldHTMLElementFocus = null,
            oldNodeAppendChild = null,
            oldDocumentAppend = null,
            oldDocumentFragmentAppend = null,
            oldElementAppend = null,
            hasDOMSupport = domObject !== null
                && typeof domObject.Element === "function"
                && typeof domObject.Document === "function"
                && typeof domObject.DocumentFragment === "function"
                && typeof domObject.Node === "function"
                && typeof domObject.NodeFilter === "function"
                && typeof domObject.HTMLElement === "function";

        globalObject.EventTarget.prototype.addEventHandler = function addEventHandler(name, handler, options)
        {
            let targetQueue = eventHandlerQueue.get(this) || {},
                key = "E" + ((Math.random() * 1e9 >>> 0) - (Date.now() % 1e9 + 1));

            while (typeof eventNameCache[key] !== "undefined")
            {
                key = "E" + ((Math.random() * 1e9 >>> 0) - (Date.now() % 1e9 + 1));
            }

            eventNameCache[key] = name;
            targetQueue[key] = {
                handler: handler,
                options: options
            };

            eventHandlerQueue.set(this, targetQueue);

            oldEventTargetAddEventListener.call(this, name, handler, options);

            return key;
        };

        globalObject.EventTarget.prototype.addEventListener = function addEventListener(name, handler, options)
        {
            this.addEventHandler(name, handler, options);
        };

        globalObject.EventTarget.prototype.removeEventHandler = function removeEventHander(key)
        {
            if (typeof eventNameCache[key] === "undefined")
            {
                // this is a real error, should always be reported
                throw new ReferenceError("Key not found in event name cache");
            }

            let targetQueue = eventHandlerQueue.get(this) || {};

            oldEventTargetRemoveEventListener.call(
                this,
                eventNameCache[key],
                targetQueue[key].handler,
                targetQueue[key].options
            );

            delete targetQueue[key];
            delete eventNameCache[key];
        };

        globalObject.EventTarget.prototype.removeEventListener = function removeEventListener(name, handler, options)
        {
            let targetQueue = eventHandlerQueue.get(this),
                match = null;

            if (typeof targetQueue !== "object")
            {
                debug("No event handlers registered on this target");
            }
            else
            {
                let keys = Object.keys(targetQueue);

                for (let idx = 0; idx < keys.length; idx++)
                {
                    if (eventNameCache[keys[idx]] === name)
                    {
                        let candidate = targetQueue[keys[idx]];
                        if (candidate.handler === handler && candidate.options === options)
                        {
                            match = keys[idx];
                            break;
                        }
                    }
                }
            }

            if (match === null)
            {
                debug("Cannot remove event handler - no match found");

                if (attemptRemoveInvalid)
                {
                    debug("Attempting to remove event listener not accounted for");
                    oldEventTargetRemoveEventListener.call(this, name, handler, options);
                }
            }
            else
            {
                this.removeEventHandler(match);
            }
        };

        globalObject.EventTarget.prototype.hasEventListener = function hasEventListener(name, handler, options)
        {
            if (typeof name !== "string" && handler)
            {
                throw new TypeError("Event type must not be null when handler reference provided");
            }

            let targetQueue = eventHandlerQueue.get(this),
                retVal = false;

            if (typeof targetQueue === "object")
            {
                let keys = Object.keys(targetQueue);

                if (keys.length > 0)
                {
                    for (let idx = 0; idx < keys.length; idx++)
                    {
                        if (eventNameCache[keys[idx]] === name
                            && (!handler
                                || (handler === targetQueue[keys[idx]].handler
                                    && options === targetQueue[keys[idx]].options
                                )
                            )
                        )
                        {
                            retVal = true;
                            break;
                        }
                    }
                }
            }

            return retVal;
        };

        globalObject.EventTarget.prototype.getEventHandlers = function getEventHandlers(name)
        {
            let targetQueue = eventHandlerQueue.get(this),
                retVal = {};

            if (typeof targetQueue === "object")
            {
                let keys = Object.keys(targetQueue);

                for (let idx = 0; idx < keys.length; idx++)
                {
                    retVal[eventNameCache[keys[idx]]] = retVal[eventNameCache[keys[idx]]] || [];
                    retVal[eventNameCache[keys[idx]]].push(Object.assign(
                        {
                            key: keys[idx],
                            handler: targetQueue[keys[idx]].handler
                        },
                        typeof targetQueue[keys[idx]].options === "object"
                            ? { options: targetQueue[keys[idx]].options }
                            : { useCapture: targetQueue[keys[idx]].options }
                    ));
                }
            }

            return retVal;
        };

        if (hasDOMSupport) // make perhaps conditional
        {
            oldNodeAppendChild = domObject.Node.prototype.appendChild;
            oldDocumentAppend = domObject.Document.prototype.append;
            oldDocumentFragmentAppend = domObject.Document.prototype.append;
            oldElementAppend = domObject.Element.prototype.append;
            oldHTMLElementFocus = domObject.HTMLElement.prototype.focus;

            let focusableTags = ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA" ];

            globalObject.EventTarget.prototype.migrateEventHandlersTo = function migrateEventHandlersTo(newTarget, detachCurrent)
            {
                let retVal = false;

                if (! newTarget instanceof globalObject.EventTarget)
                {
                    throw new TypeError("'newTarget' must be an EventTarget instance");
                }

                let targetQueue = eventHandlerQueue.get(this);

                if (typeof targetQueue === "object")
                {
                    let keys = Object.keys(targetQueue);

                    for (let idx = 0; idx < keys.length; idx++)
                    {
                        let key = keys[idx];

                        if (typeof eventNameCache[key] === "undefined")
                        {
                            throw new InternalError("State corruption");
                        }

                        newTarget.addEventHandler(
                            eventNameCache[key],
                            targetQueue[key].handler,
                            targetQueue[key].options
                        );

                        if (detachCurrent) { this.removeEventHandler(key); }
                    }

                    retVal = true; // perhaps enhance this later
                }

                return retVal;
            };

            let getFocusedElement = function getFocusedElement(parentNode)
            {
                let retVal = null;

                if (parentNode.children.length > 0)
                {
                    for (let childIdx = 0; childIdx < parentNode.children.length; childIdx++)
                    {
                        let treeWalker = document.createTreeWalker(
                            parentNode.children.item(childIdx),
                            NodeFilter.SHOW_ELEMENT
                        );

                        do
                        {
                            let node = treeWalker.currentNode;

                            if (typeof node.autofocus === "boolean"
                                && node.autofocus
                                && focusableTags.indexOf(node.tagName) !== -1
                            )
                            {
                                retVal = node;
                            }
                        }
                        while (treeWalker.nextNode() !== null);
                    }
                }

                return retVal;
            };

            domObject.Node.prototype.appendChild = function appendChild(child)
            {
                let isFragment = child instanceof domObject.DocumentFragment,
                    focusedElement = isFragment
                        ? getFocusedElement(child)
                        : null;

                let retVal = oldNodeAppendChild.call(this, child);

                if (isFragment) { child.migrateEventHandlersTo(this); }

                if (focusedElement !== null) { focusedElement.focus(); }

                return retVal;
            };

            let newAppend = function append()
            {
                let sourceArgs = Array.from(arguments),
                    args = sourceArgs.slice(1),
                    eventHandlerSources = [];

                for (let idx = 0; idx < args.length; idx++)
                {
                    let isFragment = args[idx] instanceof domObject.DocumentFragment,
                        focusedElement = isFragment
                            ? getFocusedElement(args[idx])
                            : null;

                    // perhaps passing the whole argument set is faster,
                    // but unsure if any current or future events will not
                    // interfere with event handler order
                    sourceArgs[0].call(this, args[idx]);

                    if (isFragment) { args[idx].migrateEventHandlersTo(this); }

                    if (focusedElement !== null) { focusedElement.focus(); }
                }
            };

            // sadly, I found no more elegant but equally fast outcome
            globalObject.Document.prototype.append = function documentAppend()
            {
                newAppend.apply(this, [ oldDocumentAppend ].append(Array.from(arguments)));
            };

            globalObject.DocumentFragment.prototype.append = function documentFragmentAppend()
            {
                newAppend.apply(this, [ oldDocumentFragmentAppend ].append(Array.from(arguments)));
            };

            globalObject.Element.prototype.append = function elementAppend()
            {
                newAppend.apply(this, [ oldElementAppend ].append(Array.from(arguments)));
            };

            globalObject.HTMLElement.prototype.focus = function focus(options)
            {
                if (this.isConnected)
                {
                    oldHTMLElementFocus.call(this, options);
                }
                else
                {
                    this.autofocus = true;
                }
            };
        }
    }
}

module.exports = Usable;
