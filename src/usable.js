/**
 * Usable.js, version 0.1.1
 *
 * Copyright (c) 2020, Victor Csiky, Stronghold-Terra Nonprofit llc
 * All rights reserved.
 *
 * See LICENSE (BSD 3-clause) for details.
 */
const Usable = {
    install: function install(globalObject, options)
    {
        globalObject = globalObject || window || global;
        options = options || {};

        let enableDebugging = typeof options.enableDebugging === "boolean" && options.enableDebugging,
            attemptRemoveInvalid = typeof options.attemptRemoveInvalid === "boolean" && options.attemptRemoveInvalid;

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
            oldNodeAppendChild = null,
            oldParentNodeAppend = null;

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

        //
        if (typeof globalObject.DocumentFragment === "function")
        {
            oldNodeAppendChild = globalObject.Node.prototype.appendChild;
            oldParentNodeAppend = typeof globalObject.ParentNode === "function"
                ? globalObject.ParentNode.prototype.append
                : null;

            globalObject.EventTarget.prototype.migrateEventHandlersTo = function migrateEventHandlersTo(newTarget, detachCurrent)
            {
                let retVal = false;

                if (! newTarget instanceof EventTarget)
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

            globalObject.Node.prototype.appendChild = function appendChild(child)
            {
                let retVal = oldNodeAppendChild.call(this, child);

                if (child instanceof DocumentFragment)
                {
                    child.migrateEventHandlersTo(this);
                }

                return retVal;
            };

            if (oldParentNodeAppend !== null)
            {
                globalObject.ParentNode.prototype.append = function append()
                {
                    let args = Array.from(arguments),
                        eventHandlerSources = [];

                    for (let idx = 0; idx < args.length; idx++)
                    {
                        // perhaps passing the whole argument set is faster,
                        // but unsure if any current or future events will not
                        // interfere with event handler order
                        oldParentNodeAppend.call(this, args[idx]);

                        if (args[idx] instanceof DocumentFragment)
                        {
                            args[idx].migrateEventHandlersTo(this);
                        }
                    }
                }
            }
        }
    }
}

module.exports = Usable;
