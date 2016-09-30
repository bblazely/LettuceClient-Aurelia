import {CompositionTransaction, inject} from 'aurelia-framework';
import {BindingSignaler} from 'aurelia-templating-resources';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';

@inject(CompositionTransaction, EventAggregator, BindingSignaler, I18N)
export class LanguageLoader {
    _current_locale = null;
    _i18n = null;
    _composition = null;
    _ea = null;
    _signaler = null;

    constructor(composition, ea, signaler, i18n) {
        if (!this._current_locale) {
            this._current_locale = i18n.getLocale() || 'en-gb';
        }

        this._composition = composition;
        this._i18n = i18n;
        this._ea = ea;
        this._signaler = signaler;

        this._i18n.i18next.options.backend.loadPath =  `/dist/locales/{{lng}}/{{ns}}.json`;
    }

    change(lang) {
        this._i18n.setLocale(lang).then(() => {
            this._signaler.signal('i18n:locale:changed');
        });
    }

    get(ns, el = null, wait = true) {
        let notifier = (wait) ? this._composition.enlist() : null;

        this._i18n.i18next.loadNamespaces(ns, () => {
            if (el) {
                this._i18n.updateTranslations(el);
                this._signaler.signal('aurelia-translation-signal');
            }
            if (notifier) {
                notifier.done();
            }
        });


        if (el) {
            // Subscribe via EA to future locale changes and return the unsub function
            return this._ea.subscribe('i18n:locale:changed', function () {
                this._i18n.updateTranslations(el);
                this._signaler.signal('aurelia-translation-signal');
            }.bind(this)).dispose;
        }
    }
}