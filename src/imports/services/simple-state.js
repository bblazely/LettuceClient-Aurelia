import {Container} from 'aurelia-dependency-injection';
import {BindingEngine, computedFrom} from 'aurelia-binding';

export class SimpleState {
    _is = 1;
    _listeners = [];
    states = {};

    constructor(stateTable, initialState = null) {
        if (stateTable) {
            let state_id;
            for (let s = 0; s < stateTable.length; s++) {
                if (!this[stateTable[s]] && !SimpleState.prototype[stateTable[s]]) {
                    state_id = Math.pow(2, s);
                    this[stateTable[s]] = state_id;
                    this.states[state_id] = stateTable[s];
                    if (initialState === stateTable[s]) {
                        this.is = this[stateTable[s]];
                    }
                } else {
                    console.error('Rejecting Reserved State:', stateTable[s]);
                }
            }
        }
    }

    @computedFrom('_is')
    get is() {
        console.log('getter returning', this._is);
        return this._is;
    }

    set is(newState) {
        this.change(newState);
    }

    change(newState) {
        let oldState = this._is;
        this._is = newState;

        for (let l of this._listeners) {
            l(newState, oldState);
        }
    }

    onChange(callback) {
        this._listeners.push(callback);
        return () => {
            this._listeners.splice(this._listeners.indexOf(callback), 1);
        };
    }
}
