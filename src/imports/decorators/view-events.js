export function viewEvents(target) {
    let hookEvents = ['onBind', 'onUnbind', 'onDetached', 'onAttached'];

    for (let event of hookEvents) {
        let hook = event.substr(2).toLowerCase();

        // target.prototype needs all hooks not present in the class itself to be defined early or
        // the wrappers for the hooks won't be triggered at all (but why?)
        if (!target.prototype[hook]) {
            target.prototype[hook] = ()=>{};
        }

        // Add onEvent handlers to target prototype
        target.prototype[event] = function (...fn) {
            // Check for instance storage, create it if missing
            if (!this._auViewEvents) {
                this._auViewEvents = {
                    hooks: {},
                    on: {}
                }
            }

            if (!(hook in this._auViewEvents.on)) {
                this._auViewEvents.on[hook] = [];
            }

            // Add Listeners contained in 'fn' for this hook
            for (let i = 0; i < fn.length; i++) {
                this._auViewEvents.on[hook].push(fn[i]);
            }

            // Make sure the hook is only wrapped the first time...
            if (!(hook in this._auViewEvents.hooks)) {
                this._auViewEvents.hooks[hook] = this[hook];    // this[hook] is either the placeholder above, or an actual hook in the class
                this[hook] = function() {
                    // Call listeners
                    for (let i = 0; i < this._auViewEvents.on[hook].length; i++) {
                        this._auViewEvents.on[hook][i].apply(this);
                    }
                    // Call wrapped hook
                    if (this._auViewEvents.hooks[hook]) {
                        this._auViewEvents.hooks[hook].apply(this);
                    }
                }.bind(this);
            }
        };
    }
}
