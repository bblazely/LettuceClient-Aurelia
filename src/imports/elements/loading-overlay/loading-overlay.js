import {bindable, bindingMode} from 'aurelia-framework'

export class LoadingOverlay {
    @bindable({attribute: 'overlay-spinner-path', defaultBindingMode: bindingMode.oneTime})
    spinnerPath = '/dist/elements/loading-overlay/images/loading-ring.svg';

    @bindable({attribute: 'overlay-theme', defaultBindingMode: bindingMode.oneTime})
    theme = 'light';

    @bindable({attribute: 'overlay-show', defaultBindingMode: bindingMode.oneWay})
    show = 0;
}