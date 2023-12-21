
export type DebouncedFunction = () => Promise<any>;

export type Debouncer = {
    call: (queueName: string, fn: DebouncedFunction) => void;
}

/**
 * 
 * @returns This debouncer ensures that functions passed to call() are never called in parallel. Each call() is given a type for which calls
 *          are debounced, so calls of one type (as differentiated by type). The debouncer promises that the last call of a certain type is always
 *          executed once calls before it have been completed.
 */
export function debounceFactory() : Debouncer {

    const queue : { type: string, fn: DebouncedFunction }[] = [];

    const complete = () => {
        queue.shift();
        if (queue.length > 0) {
            queue[0].fn().then(complete).catch(e => {
                console.error('error in debounced function', e);
                complete();
            });
        }
    }

    const call = (type: string, fn : DebouncedFunction) => {
        if (queue.length === 0) {
            // Note: to reuse the logic in complete(), we need to add fn as element[1]
            queue[1] = { type, fn };
            complete();
        } else {
            const nextOfType = queue.find((obj, i) => i > 0 && obj.type === type);
            // if there is this type of call in the queue, replace that call
            if (nextOfType) {
                nextOfType.fn = fn;
            } else {
                queue.push({ type, fn });
            }
        }
    }

    return { call };
}
