import {bindable, bindingMode} from 'aurelia-framework';

export class NotificationList {
    @bindable({attribute: 'entries', defaultBindingMode: bindingMode.oneWay})
    entries = [];

    @bindable({attribute: 'display-limit', defaultBindingMode: bindingMode.oneWay})
    displayLimit = 5;


    static SEVERITY = {
        'INFO': 0,
        'WARN': 1,
        'ERROR': 2
    };

    _severityClassLookup = {
        0: 'success',
        1: 'warn',
        2: 'danger'
    };

    add(text, severity = 0, closeable = true, timer = null, translate = true) {
        if (Number.isInteger(severity) && this._severityClassLookup[severity]) {
            severity = this._severityClassLookup[severity];
        }
        let idx = this.entries.push({
            text: text,
            severity: severity,
            translate: translate,
            closeable: closeable
        }) - 1;

        if (timer) {
            this.entries[idx].timer = setTimeout(() => {this.remove(idx);}, timer * 1000);
        }

        return idx;
    }

    remove(idx) {
        if (this.entries[idx].timer) {
            clearTimeout(this.entries[idx].timer);
        }
        this.entries.splice(idx, 1);
    }

    clear() {
        this.entries = [];
    }
}