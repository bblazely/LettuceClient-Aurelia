/*
 * Adapted for Aurelia from:
 *
 * RTLText
 * Copyright 2012 Twitter and other contributors
 * Released under the MIT license
 *
 * By Ben Blazely, 2016...
 */
import {customAttribute, inject, bindingMode} from 'aurelia-framework';

@customAttribute('auto-direction', bindingMode.oneTime)
@inject(Element)
export class AutoDirectionAttribute {
    /*
     * Right-to-left Unicode blocks for modern scripts are:
     *
     * Consecutive range of the main letters:
     * U+0590  to U+05FF  - Hebrew
     * U+0600  to U+06FF  - Arabic
     * U+0700  to U+074F  - Syriac
     * U+0750  to U+077F  - Arabic Supplement
     * U+0780  to U+07BF  - Thaana
     * U+07C0  to U+07FF  - N'Ko
     * U+0800  to U+083F  - Samaritan
     *
     * Arabic Extended:
     * U+08A0  to U+08FF  - Arabic Extended-A
     *
     * Consecutive presentation forms:
     * U+FB1D  to U+FB4F  - Hebrew presentation forms
     * U+FB50  to U+FDFF  - Arabic presentation forms A
     *
     * More Arabic presentation forms:
     * U+FE70  to U+FEFF  - Arabic presentation forms B
     */
    rtlChar = /[\u0590-\u083F]|[\u08A0-\u08FF]|[\uFB1D-\uFDFF]|[\uFE70-\uFEFF]/mg;
    dirMark = /\u200e|\u200f/mg;
    trimRegex = /^\s+|\s+$/g; // Can't use trim cause of IE. Regex from here: http://stackoverflow.com/questions/2308134/trim-in-javascript-not-working-in-ie
    originalText = "";
    originalDir = "";
    isRTL = false;
    setManually = false;
    rtlThreshold = 0.3;
    useCtrlKey = navigator.userAgent.indexOf('Mac') === -1;

    heldKeyCodes = {
        '91': false,
        '16': false,
        '88': false,
        '17': false
    };

    keyConstants = {
        BACKSPACE: 8,
        DELETE: 46
    };

    constructor(element) {
        // Bind this to *both* keydown & keyup
        element.addEventListener('keydown', (e) => {
            this.onTextChange(e);
        });
    }

    /* Private methods */

    // Caret manipulation
    elementHasFocus(el) {
        // Try/catch to fix a bug in IE that will cause 'unspecified error' if another frame has focus
        try {
            return document.activeElement === el;
        } catch (err) {
            return false;
        }
    }

    getCaretPosition(el) {
        if (!this.elementHasFocus(el)) {
            return 0;
        }

        var range;
        if (typeof el.selectionStart === "number") {
            return el.selectionStart;
        } else if (document.selection) {
            el.focus();
            range = document.selection.createRange();
            range.moveStart('character', -el.value.length);
            return range.text.length;
        }
    }

    setCaretPosition(el, position) {
        if (!this.elementHasFocus(el)) {
            return;
        }

        if (typeof el.selectionStart === "number") {
            el.selectionStart = position;
            el.selectionEnd = position;
        } else if (document.selection) {
            let range = el.createTextRange();
            range.collapse(true);
            range.moveEnd('character', position);
            range.moveStart('character', position);
            range.select();
        }
    }

    // End of caret methods


    // If a user deletes a hidden marker char, it will just get rewritten during
    // notifyTextUpdated. Special case this by continuing to delete in the same
    // direction until a normal char is consumed.
    erasePastMarkers(e) {
        var offset,
            textarea = (e.target) ? e.target : e.srcElement,
            key = (e.which) ? e.which : e.keyCode;

        if (key === this.keyConstants.BACKSPACE) { // backspace
            offset = -1;
        } else if (key === this.keyConstants.DELETE) { // delete forward
            offset = 0;
        } else {
            return;
        }

        let pos = this.getCaretPosition(textarea),
            text = textarea.value,
            numErased = 0,
            charToDelete;

        do {
            charToDelete = text.charAt(pos + offset) || '';
            // Delete characters until a non-marker is removed.
            if (charToDelete) {
                pos += offset;
                numErased++;
                text = text.slice(0, pos) + text.slice(pos + 1, text.length);
            }
        } while (charToDelete.match(this.dirMark));

        if (numErased > 1) {
            textarea.value = text;
            // If more than 1 needed to be removed, update the text
            // and caret manually and stop the event.
            this.setCaretPosition(textarea, pos);
            e.preventDefault ? e.preventDefault() : e.returnValue = false;
        }
    }

    removeMarkers(text) {
        return text ? text.replace(this.dirMark, '') : '';
    }

    shouldBeRTL(plainText) {
        let matchedRtlChars = plainText.match(this.rtlChar),
            trimmedText = plainText.replace(this.originalText, "").replace(this.trimRegex, '');

        if (!trimmedText || !trimmedText.replace(/#/g, '')) {
            return this.originalDir === 'rtl'; // No text, use default.
        }

        if (!matchedRtlChars) {
            return false; // No RTL chars, use LTR
        }

        return trimmedText.length > 0 && matchedRtlChars.length / trimmedText.length > this.rtlThreshold;
    }

    detectManualDirection(e) {
        let textarea = e.target || e.srcElement;
        if (e.type === "keydown" && (e.keyCode === 91 || e.keyCode === 16 || e.keyCode === 88 || e.keyCode === 17)) {
            this.heldKeyCodes[String(e.keyCode)] = true;
        } else if (e.type === "keyup" && (e.keyCode === 91 || e.keyCode === 16 || e.keyCode === 88 || e.keyCode === 17)) {
            this.heldKeyCodes[String(e.keyCode)] = false;
        }

        if (((!this.useCtrlKey && this.heldKeyCodes['91']) || (this.useCtrlKey && this.heldKeyCodes['17'])) && this.heldKeyCodes['16'] && this.heldKeyCodes['88']) {
            this.setManually = true;

            if (textarea.dir === 'rtl') {
                this.setTextDirection('ltr', textarea);
            } else {
                this.setTextDirection('rtl', textarea);
            }
        }
    }

    setTextDirection(dir, textarea) {
        textarea.setAttribute('dir', dir);
        textarea.style.direction = dir;
        textarea.style.textAlign = (dir === 'rtl' ? 'right' : 'left');
    }

    /* Public methods */

    onTextChange(e) {
        var event = e || window.event;

        this.detectManualDirection(e);

        // Handle backspace through control characters:
        if (event.type === "keydown") {
            this.erasePastMarkers(event);
        }

        this.setText(event.target || event.srcElement);
    };

    // Optionally takes a second param, with original text, to exclude from RTL/LTR calculation
    setText(textarea) {
        let plainText, newTextDir,
            text = textarea.value;

        // Original directionality could be in a few places. Check them all.
        if (!this.originalDir) {
            if (textarea.style.direction) {
                this.originalDir = textarea.style.direction;
            }
            else if (textarea.dir) {
                this.originalDir = textarea.dir;
            }
            else if (document.body.style.direction) {
                this.originalDir = document.body.style.direction;
            }
            else {
                this.originalDir = document.body.dir;
            }
        }

        // BB Commented out, because no idea where 'arguments' comes from.
/*        if (this.arguments.length === 2) {
            this.originalDir = textarea.ownerDocument.documentElement.className;
            this.originalText = arguments[1];
        }*/

        if (!text) {
            return;
        }

        plainText = this.removeMarkers(text);
        this.isRTL = this.shouldBeRTL(plainText);
        //var newText = setMarkers(plainText);
        newTextDir = (this.isRTL ? 'rtl' : 'ltr');

        if (!this.setManually) {
            this.setTextDirection(newTextDir, textarea);
        }
    };
}