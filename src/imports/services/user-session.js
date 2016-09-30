import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Restful} from 'services/restful';

@inject(Restful, EventAggregator)
export class UserSession {
    _rest = null;
    _ea = null;

    _session = null;

    EVENT_CHANGE_STATE = 'UserSession.ChangeState';

    constructor(rest, ea) {
        this._rest = rest;
        this._ea = ea;

        if (false) { // replace this with "does current route contain an action=login param"... not sure how to in aurelia yet
            this.remove();  // a new login was requested, remove any existing ones from client and server.
        } else {
            this.get('existing');   //
        }
    }

    isPresent() {
        return (this._session) ? true : false;
    }

    get(persist, new_login) {
        persist = persist !== undefined ? persist : 'existing';
        if (this._session === null || new_login) {
            this._session = new Promise(function(resolve, reject) {
                this._rest.get(`user_session/${persist}`).then(response => {
// Still learning how to leverage ES6 promises, this may be incorrect and needs testing (see return this._session) below
// ie: can this 'get' be called multiple times, returning a valid promise with a .then each time?

                    response.obj['new_login'] = (new_login) ? true : false;

                    this._ea.publish(this.EVENT_CHANGE_STATE, response.obj);
                    resolve(response.obj);
                }).catch(response => {
                    reject(response.errorCode);
                });
            }.bind(this));
        }
        return this._session;
    }

    remove() {
        this._rest.delete('user_session').then(response => {
            if (this._session != null) {
                this._ea.publish(this.EVENT_CHANGE_STATE, null);
            }
            this._session = null;
        });

        /*if (mobile) {
            // Hacky method to remove any session cookies left over in the InAppBrowser
            window.open('placeholder.html', 'RemoveSession', 'hidden=yes,clearcache=yes,clearsessioncache=yes').close();
        }*/
    }
}