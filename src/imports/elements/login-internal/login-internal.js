import {inject, bindable, bindingMode} from 'aurelia-framework';
import {computedFrom} from 'aurelia-binding';
import {LanguageLoader} from 'services/language-loader';
import {SimpleState} from 'services/simple-state';
import {viewEvents} from 'decorators/view-events';
//import {required, email, format, length, equality, ValidationRules} from 'aurelia-validatejs';
//import {validateTrigger} from 'aurelia-validation';

import {NewInstance} from "aurelia-dependency-injection";

//import {ValidationController} from 'aurelia-validation';

import {
    AccessMember
    ,
    AccessScope
    ,
    AccessKeyed
    ,
    BindingBehavior
    ,
    ValueConverter
}
    from
        'aurelia-binding';

function getObject(expression, objectExpression, source) {
    let value = objectExpression.evaluate(source);
    if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
        return value;
    }
    if (value === null) {
        value = 'null';
    } else if (value === undefined) {
        value = 'undefined';
    }
    throw new Error(`The '${objectExpression}' part of '${expression}' evaluates to ${value} instead of an object.`);
}

function getPropertyInfo(expression, source) {
    const originalExpression = expression;
    while (expression instanceof BindingBehavior || expression instanceof ValueConverter) {
        expression = expression.expression;
    }

    let object;
    let property;
    if (expression instanceof AccessScope) {
        object = source.bindingContext;
        property = expression.name;
    } else if (expression instanceof AccessMember) {
        object = getObject(originalExpression, expression.object, source);
        property = expression.name;
    } else if (expression instanceof AccessKeyed) {
        object = getObject(originalExpression, expression.object, source);
        property = expression.key.evaluate(source);
    } else {
        throw new Error(`Expression '${originalExpression}' is not compatible with the validate binding-behavior.`);
    }

    return {object, property};
}

ValidationController.prototype._updateErrors = function(errors, newErrors, target, targetValueUpdated) {
    let i = 0;
    while (i < errors.length) {
        const error = errors[i];
        const index = newErrors.findIndex(x => x.rule === error.rule);
        if (index === -1) {
            errors.splice(i, 1);
            this._unrenderError(error, target);
            continue;
        } else if (targetValueUpdated) {
            this._renderErrorUpdate(error, target);
        }
        newErrors.splice(index, 1);
        i++;
    }

    i = 0;
    while (i < newErrors.length) {
        const error = newErrors[i];
        errors.push(error);
        this._renderError(error, target);
        i++;
    }
};

ValidationController.prototype._renderErrorUpdate = function(error, target) {
    var renderers = this.renderers;
    var i = renderers.length;
    while (i--) {
        if (renderers[i].update) {
            renderers[i].update(error, target);
        } else {
            renderers[i].unrender(error,target);
            renderers[i].render(error, target);
        }
    }
};


ValidationController.prototype._validateBinding = function(binding) {
    let updated = false;
    const { target, rules, errors } = this.bindings.get(binding);
    const { object, property } = getPropertyInfo(binding.sourceExpression, binding.source);
    const newErrors = this.validator.validateProperty(object, property, rules);

    if (binding.last_version === undefined || binding.last_version < binding._version) {
        binding.last_version = binding._version;
        updated = true;
    }

    this._updateErrors(errors, newErrors, target, updated);
    return errors;
};


@viewEvents
@inject(NewInstance.of(ValidationController), LanguageLoader, Element)
export class LoginInternal {
    @required({message: '^Required'})
        @email
 //   @length({message: 'Length Required!', minimum: 5})
 //   @email({custom: 'did this work?', message: '^Nope! ${email & oneTime} is not a valid address <a click.delegate="test()" t7e="login-internal:LOGIN"></a>'})
    email;

    @required({i18n: 'login-internal:ERR_PW_REQUIRED'})
    @length({i18n: 'login-internal:ERR_PW_SHORT', minimum: 8})
    password;

    @equality({attribute: 'email', i18n: 'login-internal:ERR_EMAIL_MISMATCH'})
    @required
    emailConfirm;

    view = null;
    action = null;
    errors = [];

    test() {
        alert('delegate fired!');
    }

    constructor(controller, languageLoader, element) {
        this.view = new SimpleState([
            'log_in', 'sign_up',
            'forgot_password', 'reset_password',
            'verify_online', 'verify_offline', 'verify_resend'
        ]);

        this.onBind(
            () => {
                this.onUnbind(
                    languageLoader.get('login-internal', element, true)
                );
            }
        );

        setTimeout(() => { this.view.is = this.view.verify_online;}, 0);

        this.controller = controller;
        this.controller.validateTrigger = validateTrigger.blur;
    }

    attached() {
        this.buttonText = 'login-internal:LOGIN';
    }

    submit() {
        console.log('submitted!');
        let errors = this.controller.validate();
        console.log('errors: ', errors, this.errors);
    }

}