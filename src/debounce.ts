
export type DebouncedFunction = () => Promise<any>;

export type Debouncer = {
    call: (fn: DebouncedFunction) => void;
}

/**
 * 
 * @returns a debouncer that can be called multiple times, calls are never executed in parallel and the debouncer promises to
 *          call the latest function call - if a call is debounced when one call is ongoing and there is already a queueud call,
 *          the previously queued function call is discarded.
 */
export function debounceFactory() : Debouncer {
    // Queue can have 0, 1, or 2 elements
    //  0 elements = no operations ongoing, any new call will be immediately executed (that call is inserted into the queue)
    //  1 elements = queue[0] is ongoing, any new call will be appended to queue
    //  2 elements = queue[0] is ongoing, queue[1] is next, any new call will replace queue[1]

    const queue : DebouncedFunction[] = []

    const complete = () => {
        queue.shift();
        if (queue.length > 0) {
            queue[0]().then(complete).catch(e => {
                console.error('error in debounced function', e);
                complete();
            });
        }
    }

    const call = (fn : DebouncedFunction) => {
        if (queue.length === 0) {
            // Note: to reuse the logic in complete(), we need to add fn as element[1]
            queue[1] = fn;
            complete();
        } else {
            queue[1] = fn;
        }
    }

    return { call };
}

