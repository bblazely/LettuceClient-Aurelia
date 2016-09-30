export class HeadValueConverter {
    toView(array, count) {
        return array.slice(0, count);
    }
}

export class TailValueConverter {
    toView(array, count) {
        return array.slice(Math.max((array.length - 1) - count, 0), count);
    }
}

export class SegmentValueConverter {
    toView(array, start, count) {
        return array.slice(start, count);
    };
}

export class InValueConverter {
    toView(needle, haystack, inclusive) {
        if (inclusive === undefined) {
            inclusive = true;
        }
        let found = (haystack.indexOf(needle) != -1);
        return (inclusive) ? found : !found;
    }
}