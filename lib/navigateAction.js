/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global window */

var debug = require('debug')('navigateAction');

module.exports = function (context, payload, done) {
    debug('dispatching NAVIGATE_START', payload);
    context.dispatch('NAVIGATE_START', payload);

    var routeStore = context.getStore('RouteStore');
    if (!routeStore.getCurrentRoute) {
        done(new Error('RouteStore has not implemented `getCurrentRoute` method.'));
        return;
    }
    debug('executing', payload);

    var route = routeStore.getCurrentRoute();

    if (!route) {
        var error404 = {
            statusCode: 404,
            message: 'Url does not exist'
        };

        context.dispatch('NAVIGATE_FAILURE', error404);
        done(error404);
        return;
    }

    var action = route.get('action');
    var onBeforeUnloadText = typeof window !== 'undefined' && typeof window.onbeforeunload === 'function' ? window.onbeforeunload() : '';
    var confirmResult = onBeforeUnloadText ? window.confirm(onBeforeUnloadText) : true;

    if (!confirmResult) {
        debug('route is no longer being navigated to because of a window.onbeforeunload() check, dispatching without calling action');
        context.dispatch('CHANGE_ROUTE_SUCCESS', route);
        done();
        return;        
    }

    if ('string' === typeof action && context.getAction) {
        action = context.getAction(action);
    }

    if (!action || 'function' !== typeof action) {
        debug('route has no action, dispatching without calling action');
        context.dispatch('NAVIGATE_SUCCESS', route);
        done();
        return;
    }

    debug('executing route action');
    context.executeAction(action, route, function (err) {
        if (err) {
            var error500 = {
                statusCode: err.statusCode || 500,
                message: err.message
            };

            context.dispatch('NAVIGATE_FAILURE', error500);
        } else {
            context.dispatch('NAVIGATE_SUCCESS', route);
        }

        done(err);
    });
};
