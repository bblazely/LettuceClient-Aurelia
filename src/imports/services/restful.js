import {HttpClient} from 'aurelia-http-client';

export class Restful {
    _cache = {};

    constructor(api_base_path = 'https://apps.blazely.com/sportscom', api_version = 'v1') {
        this._http = new HttpClient().configure(config => {
            config.withBaseUrl(`${api_base_path}/${api_version}`)
                .withResponseType('json')
                .withCredentials(true)
                .withInterceptor({
                    response: this._processResponse,
                    responseError: this._processResponse
                });

        });
    }

    _processResponse(raw) {
        let processed = {
            get str () {
                return (processed.altered) ? JSON.stringify(processed.obj) : raw.response;
            },
            get timestamp () {
                return raw.headers.get('Request-Time');
            },
            get errorCode () {
                return raw.headers.get('Error-Code');
            },
            get errorContext () {
                return raw.headers.get('Error-Context');
            },
            headers:    raw.headers,
            statusCode: raw.statusCode,
            original:   raw,
            altered:    false
        };

        try {
            processed.obj = JSON.parse(raw.response);
            if (processed.obj.c) {
                // TODO: Emit Change Set
                // emit_changeset(processed.json.c, processed.json.r, processed.timestamp);
                processed.altered = true;
                delete processed.obj.c;
            }

            if (processed.obj.r) {
                processed.altered = true;
                processed.obj = processed.obj.r;
            }
        } catch(e) {
            processed.obj = null;
        }

        if (raw.isSuccess) {
            return processed;    // Invoke the Responder
        } else {
            throw processed; // Invoke the Catcher
        }
    }

    post(node, params, content, timeout = 30000) {}

    put(node, params, content, timeout = 30000) {}

    // GET requests can be cached with a cache key. Note, params are not taken into account.
    get(node, params, cache_key = null, cache_refresh = false, timeout = 30000) {
        params = params || {};

        if (cache_key === true) {
            cache_key = node;
        }

        if (cache_key && this._cache[cache_key] && !cache_refresh) {
            return this._cache[cache_key];
        }

        let request = this._http.createRequest(node);
        if (cache_key && cache_refresh) {
            params.refresh = Math.round((new Date().getTime()) * Math.random());
        }

        if (params) {
            request.withParams(params);
        }

        let p = request.withTimeout(timeout).asGet().send(); // Returns promise with XHR abort method
        if (cache_key) {
            this._cache[cache_key] = p;
        }

        return p;
    }
    
    delete(node, params, timeout = 30000) {
        let request = this._http.createRequest(node);
        if (params) {
            request.withParams(params);
        }
        return request.withTimeout(timeout).asDelete().send();
    }
}