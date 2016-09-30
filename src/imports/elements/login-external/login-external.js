import {inject, bindable, bindingMode} from 'aurelia-framework';
import {BindingEngine} from 'aurelia-binding';
import {NotificationList} from 'elements/notification-list';
import {LanguageLoader} from 'services/language-loader';
import {SimpleState} from 'services/simple-state';
import {viewEvents} from 'decorators/view-events';


@viewEvents
@inject(BindingEngine, LanguageLoader, Element)
export class LoginExternal {
    // View
    loginPending = false;
    selectedProvider = null;
    r_notificationList = null;        // ref
    r_selectExternalProvider = null;  // ref

    // Bindable
//    @bindable({attribute: 'action-state', defaultBindingMode: bindingMode.twoWay})
    action = null;

    // Private
    _loginWindow = null;
    _loginCallback = '__lsrc';
    _loginWindowCheckTimer = null;

    constructor(bindingEngine, languageLoader, element) {
        document.domain = 'blazely.com';
        this.action = new SimpleState(['idle', 'pending', 'success']);

        this.onAttached(
            () => {
                this.onDetached(
                    bindingEngine.propertyObserver(this, 'selectedProvider')
                        .subscribe(selectedProvider => {
                            if (selectedProvider) {
                                this.login(selectedProvider);
                            }
                        }).dispose
                );
            }
        );

        this.onBind(
            () => {
                this.onUnbind(
                    languageLoader.get('login-external', element)
                )
            }
        )
    }

    closeLoginWindow() {
        clearTimeout(this._loginWindowCheckTimer);
        window[this._loginCallback] = null;
        if (!this._loginWindow.closed) {
            this._loginWindow.close();
        }
        this._loginWindow = null;
    }

    loginCallback(code, payload, error_code, error_msg) {
        this.closeLoginWindow();

        this.selectedProvider.locked = true;

        console.log(code, payload, error_code, error_msg);

        /*        switch (code) {
         case 1:
         scope.state.change(C_SIMPLE_STATE.STATE.SUCCESS);
         scope.provider_state.disabled[active_provider[str_provider_id]] = true;
         login_external.set(active_provider[str_provider_id], true);
         break;
         case 2: // Intentional Fall Through
         case 3:
         // Switch
         scope.response(code, payload);
         break;
         default:
         scope.state.change(C_SIMPLE_STATE.STATE.IDLE);
         scope.provider_state.selected[active_provider[str_provider_id]] = false;

         switch (error_code) {
         case 'bb469206':        // ExternalProvider::EXCEPTION_PROVIDER_XSRF_CHECK_FAILED
         setError('ERR_EXTERNAL_LOGIN_XSRF');
         break;
         case '5a318839':        // ???
         setError('ERR_EXTERNAL_LOGIN_SYSTEM');
         break;
         case '9a74bb7d':        // ???
         setError('ERR_EXTERNAL_LOGIN_COOKIE');
         break;
         default:
         setError('ERR_EXTERNAL_LOGIN_UNKNOWN');
         break;
         }
         break;
         }*/

        this.endLoginAttempt(true);
    }

    checkLoginAttempt() {
        //console.log('checking login window...');
        if (this._loginWindow) {
            if (this._loginWindow.closed) {
                if (window[this._loginCallback]) {
                    //port scope.provider_state.selected[active_provider[str_provider_id]] = false;
                    //remote? active_provider.selected = null;
                    // port scope.state.change(C_SIMPLE_STATE.STATE.IDLE);
                    // port setError('ERR_EXTERNAL_LOGIN_INTERRUPT');
                    console.log('ouch');
                    this.r_notificationList.add('login-external:TEST_MESSAGE', NotificationList.SEVERITY.ERROR);
                    this.endLoginAttempt(false);
                }
            } else {
                this._loginWindowCheckTimer = setTimeout(this.checkLoginAttempt.bind(this), 250);    // Nothing on the scope updating, so suppress $apply
            }
        }
    }

    endLoginAttempt(success) {
        this.r_selectExternalProvider.setDisabledStateAll(false);
        this.loginPending = false;
        if (!success) {
            this.r_selectExternalProvider.setSelectedState(this.selectedProvider.provider_id, false);
        }
        this.action.is = success ? this.action.success : this.action.idle;
    }
    
    login(s) {
        // TODO: Fix (??) Cross domain (dev/prod) login on IE. It doesn't work due to window.opener being reset on redirect.
        this.r_notificationList.clear();
        this.r_selectExternalProvider.setDisabledStateAll(true);
        this.action.is = this.action.pending;
        window[this._loginCallback] = this.loginCallback.bind(this);    // Bind the callback to this class

        this._loginWindow = window.open(
            /* TODO Replace this with config or env var */
            `https://apps.blazely.com/sportscom/v1/user/login/external/${s.provider_id_str}`,
            'LoginPopUp',
            `top=${Math.floor(window.screenTop + (window.innerHeight / 2 - s.popup_height / 2))},
             left=${Math.floor(window.screenLeft + (window.innerWidth / 2 - s.popup_width / 2))},
             height=${s.popup_height},
             width=${s.popup_width}`
        );

        this._loginWindowCheckTimer = setTimeout(this.checkLoginAttempt.bind(this), 250);

    }
}