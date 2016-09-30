import {customAttribute, inject, bindingMode} from 'aurelia-framework';

@customAttribute('auto-focus', bindingMode.oneWay)
@inject(Element)
export class AutoFocusAttribute {
    constructor(element) {
        this.element = element;
    }

    valueChanged(focus) {
        if (focus) {
            setTimeout(() => {
                this.element.focus();
            }, 0);
        }
    }
}