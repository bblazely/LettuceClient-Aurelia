import {inject, bindable}           from 'aurelia-framework';
import {bindingMode, BindingEngine} from 'aurelia-binding';
import {Restful}                    from 'services/restful';
import {viewEvents}                 from 'decorators/view-events';

@viewEvents
@inject(BindingEngine, Restful, Element)
export class SelectExternalProvider {
    // Attribute Bindings
    @bindable({attribute: 'allow-multi-select', defaultBindingMode: bindingMode.oneTime})
    allowMultiSelect = 0;

    @bindable({attribute: 'selected', defaultBindingMode: bindingMode.twoWay})
    selected = [];

    // View Template
    providers = null;

    constructor(bindingEngine, restful) {
        this.onBind(
            () => {
                // Get Provider List
                restful.get('external_provider/list', null, true)
                    .then(response => {
                        if (response.obj.length > 0) {
                            this.providers = new Map();
                            for (var p of response.obj) {
                                this.providers.set(p['provider_id'], Object.assign({}, p));    // Create local copy of the provider
                            }
                        }
                    })
                    .catch(err => {
                        this.providers = false;
                    });

                if (!this.selected) {
                    this.selected = this.allowMultiSelect ? [] : null;
                }

                // Observers
                let obs = null;
                if (Array.isArray(this.selected) && this.allowMultiSelect) {
                    obs = bindingEngine.collectionObserver(this.selected)
                        .subscribe(splice => {
                            if (splice[0]) {
                                if (splice[0].removed.length > 0) {
                                    for (let p of splice[0].removed) {
                                        if (p.selected && !p.locked) {
                                            p.selected = false;
                                        }
                                    }
                                }

                                if (splice[0].addedCount > 0) {
                                    for (let i = splice[0].index; i < splice[0].index + splice[0].addedCount; i++) {
                                        if (!this.selected[i].selected) {
                                            this.selected[i].selected = true;
                                        }
                                    }
                                }
                            }
                        });
                } else {
                    obs = bindingEngine.propertyObserver(this, 'selected')
                        .subscribe((newSelection, oldSelection) => {
                            if (oldSelection && (oldSelection.selected && !oldSelection.locked)) {
                                oldSelection.selected = false;
                            }
                        });
                }

                // Register disposal of Observer
                this.onUnbind(obs.dispose);
            }
        )
    }

    getProviderById(provider_id) {
        let search_attribute = (Number.isInteger(provider_id)) ? 'provider_id' : 'provider_id_str';
        for (let p of this.providers.values()) {
            if (p[search_attribute] == provider_id) {
                return p;
            }
        }
        return null;
    }

    setLockedStateAll(state = true) {
        this.setLockedState(Array.from(this.providers.values()), state);
    }

    setLockedState(provider, state) {
        if (Array.isArray(provider)) {
            for (let p of provider) {
                this.setLockedState(p, state);
            }
        }

        if (typeof provider != 'object') {
            provider = this.providers.get(provider);
            if (!provider) {
                return;
            }
        }

        provider.locked = state;
    }

    setDisabledStateAll(state = true) {
        this.setDisabledState(Array.from(this.providers.values()), state);
    }

    setDisabledState(provider, state = true) {
        if (Array.isArray(provider)) {
            for (let p of provider) {
                this.setDisabledState(p, state);
            }
        }

        if (typeof provider != 'object') {
            provider = this.providers.get(provider);
            if (!provider) {//TODO move this into private method
                return;
            }
        }

        provider.disabled = state;
    }

    toggleSelectedState(provider, overrideLock = false) {
        this.setSelectedState(provider, !provider.selected, overrideLock);
    }

    setSelectedStateAll(state = true, overrideLock = false) {
        this.setSelectedState(Array.from(this.providers.values()), state, overrideLock);
    }

    setSelectedState(provider, state = true, overrideLock = false) {
        if (Array.isArray(provider)) {
            for (let p of provider) {
                this.setSelectedState(p, state, overrideLock);
            }
        }

        if (typeof provider != 'object') {
            provider = this.providers.get(provider);
        }

        if (!provider || (provider.locked && !overrideLock)) {
            return;
        }

        if (this.allowMultiSelect == false) {
            if (this.selected) {
                if (!this.selected.locked) {
                    this.selected.selected = false;
                }
            }

            if (state) {
                this.selected = provider;
            } else {
                this.selected = null;
            }
        } else {
            if (state) {
                this.selected.push(provider);
            } else {
                this.selected.splice(this.selected.indexOf(provider), 1);
            }
        }
        provider.selected = state;
    }
}