(function(window) {
    'use strict';
    // Library NameSpace
    var lns = 'amivcore'

    function libgen() {
        // Lib to returned
        var lib = {};

        // Core
        var core = {
            // Important vars n' stuff
            lib: {
                //api_url: 'https://amiv-apidev.vsos.ethz.ch',
                api_url: 'https://amiv-apidev.vsos.ethz.ch',
                spec_url: '/spec.json',
                //spec_url: 'https://nicco.io/amiv/docs/spec.json',
                authenticated: false,
                ready: false,
                req_time_out: 5000,
                on_interval: 100,
                auth_interval: 5000,
                auth_allowed_fails: 5,
                auth_fails: 0,
                show_errors: false,
            },
            // Header Setup
            header: {
                req: {
                    'get': ['Content-Type', 'Authorization'],
                    'post': ['Content-Type', 'Authorization'],
                    'patch': ['Content-Type', 'Authorization', 'If-Match'],
                    'delete': ['Content-Type', 'Authorization', 'If-Match'],
                },
                make: {
                    'Content-Type': function() {
                        return 'application/json'
                    },
                    'Authorization': function() {
                        if (get('cur_token') != null)
                            return 'Basic ' + btoa(get('cur_token') + ':');
                        return '';
                    },
                    'If-Match': function() {
                        return null;
                    }
                }
            },
            adapter: {
                'none': function(ret) {
                    return ret;
                },
                'string': function(strg) {
                    return String(strg);
                },
                'integer': function(int) {
                    return parseInt(int);
                },
                'boolean': function(bool) {
                    return (String(bool).trim().toLowerCase() == 'true' || bool === true || bool === 1)
                },
                'datetime': function(dt) {
                    var tmp = new Date(dt);
		    // send an iso string without the milis, thats what the api expects
		    return new Date(dt).toISOString().split('.')[0]+"Z";
                }
            }
        }

        /**
	 *  Utility empty function for no callback
	 *  @constructor
	 */
        function dummy() {};

        /** 
	 * Save and get into localStorage
	 * @constructor
	 * @param {string} cname
	 * @param {string} cvalue
	 */
        function set(cname, cvalue, exdays) {
            window.localStorage.setItem('glob-' + cname, cvalue);
        }

	/**
	 * Get from LocalStorage
	 * @constructor
	 * @param {string} cname
	 */
        function get(cname) {
            return window.localStorage.getItem('glob-' + cname);
        }

        /** 
	 * Make Request
	 * @constructor
	 * @param {} attr
	 * @param {} callback
	 */
        function req(attr, callback) {
            callback = callback || function(msg) {
                console.log(msg);
            };
            $.ajax({
                url: core.lib.api_url + attr.path,
                data: attr.data,
                method: attr.method,
                dataType: 'json',
                timeout: core.lib.req_time_out,
                headers: attr.headers,
                error: function(res) {
                    if (core.lib.show_errors) console.log(res);
                    callback(res);
                },
            }).done(function(res) {
                callback(res);
            });
        }

	/**
	 * Make Function
	 * @constructor
	 * @param {string} domain
	 * @param {string} m
	 */
        function makeFunc(domain, m) {
            return function(attr, callback) {
                attr = attr || {};
                var curLib = {}
                for (var curAttr in attr['data']) {
                    var curAttrType = lib.getParamType(domain, curAttr);
                    if (core.adapter.hasOwnProperty(curAttrType))
                        curLib[curAttr] = core.adapter[lib.getParamType(domain, curAttr)](attr['data'][curAttr]);
                    else
                        curLib[curAttr] = attr['data'][curAttr];
                }
                //curLib[curAttr] = attr['data'][curAttr];

                var hdr = {};
                for (var curHdr in attr['header'])
                    hdr[curHdr] = attr['header'][curHdr];

                var curPath = '/' + domain;
                var curLink = curPath;
                if (attr['id'] != undefined) {
                    curPath += '/' + attr['id'];
                    curLink += '/{_id}';
                }

                if (get('cur_token') != null)
                    hdr['Authorization'] = 'Basic ' + btoa(get('cur_token') + ':');

                if (m != 'GET') {
                    if (m == 'POST' || m == 'PUT')
                        for (var param in lib[domain]['methods'][m][curLink]['params'])
                            if (lib[domain]['methods'][m][curLink]['params'][param]['required'] == true)
                                if (curLib[lib[domain]['methods'][m][curLink]['params'][param]['name']] == undefined)
                                    return 'Error: Missing ' + lib[domain]['methods'][m][curLink]['params'][param]['name'];
                    hdr['Content-Type'] = 'application/json';
                    curLib = JSON.stringify(curLib);
                }
                req({
                    path: curPath,
                    method: m,
                    data: curLib,
                    headers: hdr,
                }, callback);
                return true;
            };
        }

	/**
	 * AJAX Function
	 * @constructor
	 */
        $.ajax({
            url: core.lib.spec_url,
            dataType: 'json',
            timeout: 5000,
            success: function(d) {
                var data = d['domains'];
                for (var domain in data) {
                    lib[domain] = {};
                    lib[domain].methods = [];
                    for (var p in data[domain]['paths']) {
                        for (var m in data[domain]['paths'][p]) {
                            if (lib[domain].methods[m] == undefined) lib[domain].methods[m] = {};
                            lib[domain].methods[m][p] = data[domain]['paths'][p][m];
                        }
                    }
                    for (var m in lib[domain]['methods']) {
                        lib[domain][m] = makeFunc(domain, m);
                    }
                }
                checkAuth();
            },
            error: function(d) {
                console.log('Cannot reach initialization spec: ' + core.lib.spec_url);
                console.log(d);
            }
        });

	/**
	 * Check Authentication
	 * @constructor
	 * @param {} exec_once
	 */
        function checkAuth(exec_once) {
            exec_once = exec_once || false;
            if (get('cur_token') != null) {
                lib.sessions.GET({
                    data: {
                        where: 'token==["' + get('cur_token') + '"]'
                    }
                }, function(res) {
                    if (res !== undefined && res.hasOwnProperty('_items') && res['_items'].length > 0) {
                        core.lib.authenticated = true;
                        core.lib.auth_fails = 0;
                    } else {
                        core.lib.auth_allowed_fails++;
                        if (core.lib.auth_fails > core.lib.auth_allowed_fails)
                            core.lib.authenticated = false;
                    }
                    core.lib.ready = true;
                    if (!exec_once)
                        setTimeout(checkAuth, core.lib.auth_interval);
                });
            } else {
                core.lib.authenticated = false;
                core.lib.ready = true;
                if (!exec_once)
                    setTimeout(checkAuth, core.lib.auth_interval);
            }
        }

        /** 
	 * Get parameter type
	 * @constructor
	 * @param {} dom
	 * @param {} param
	 */
        lib.getParamType = function(dom, param) {
            var tmp = 'none';
            try {
                if (Array.isArray(lib[dom].methods.POST['/' + dom].params))
                    lib[dom].methods.POST['/' + dom].params.forEach(function(cur) {
                        if (cur.name == param) {
                            tmp = cur.type;
                        }
                    });

            } catch (e) {}
            return tmp;
        }

        /** 
	 * Get the etag
	 * @constructor
	 * @param {} curDomain
	 * @param {} curId
	 * @param {} callback
	 */
        lib.getEtag = function(curDomain, curId, callback) {
            return lib[curDomain].GET({
                id: curId
            }, function(res) {
                callback(res['_etag']);
            });
        }

        /** 
	 * Returns whether user is logged in
	 * @constructor
	 */
        lib.authenticated = function() {
            return core.lib.authenticated;
        }

        /**
	 *  Login function
	 *  @constructor
	 *  @param {} curUser
	 *  @param {} curPass
	 *  @param {} callback
	 */
        lib.login = function(curUser, curPass, callback) {
            callback = callback || dummy;
            req({
                path: '/sessions/',
                method: 'POST',
                data: JSON.stringify({
                    user: curUser.toLowerCase(),
                    password: curPass
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            }, function(msg) {
                var reqVar = ['token', 'user_id', 'id'];
                for (var i in reqVar) {
                    lib['cur_' + reqVar[i]] = msg[reqVar[i]];
                }
                if (msg['_status'] == 'OK') {
                    set('cur_token_id', msg['id'], 1);
                    set('cur_token', msg['token'], 1);
                    set('cur_user_id', parseInt(msg['user_id']), 1);
                    callback(true);
                } else {
                    set('cur_token_id', null);
                    set('cur_token', null);
                    set('cur_user_id', null);
                    callback(false);
                }
            });
        }

        /** 
	 * Logout
	 * @constructor
	 */
        lib.logout = function() {
            // Deleting token from api and unsetting the vars
            lib.sessions.DELETE({
                id: get('cur_token_id')
            }, function(res) {
                set('cur_token', null);
                set('cur_token_id', null);
                set('cur_user_id', null);
            });
        }

        /**
	 * Get info about the current user
	 * @constructor
	 * @param {} attr
	 * @param {} callback
	 */
        lib.user = function(attr, callback) {
            callback = callback || dummy;
            lib.users.GET({
                id: get('cur_user_id')
            }, function(res) {
                if (typeof attr === 'object') {
                    var ret = {};
                    for (var key in attr)
                        ret[attr[key]] = res[attr[key]];
                    callback(ret);
                } else {
                    callback(res[attr]);
                }
            });
        }

        /**
	 *  Get the necessary field for specific requests
	 *  @constructor
	 *  @param {} domain
	 *  @param {} type
	 *  @param {} wId
	 */
        lib.getRequiredFields = function(domain, type, wId) {
            var curTree;
            var resAttr = {};
            if (wId)
                curTree = lib[domain]['methods'][type]['/' + domain + '/{_id}']['params'];
            else
                curTree = lib[domain]['methods'][type]['/' + domain]['params'];
            if (curTree.length == 0) return false;
            else {
                for (var i = 0; i < curTree.length; i++)
                    if (curTree[i].required == true)
                        resAttr[curTree[i].name] = curTree[i];
            }
            return resAttr;
        }

        /**
	 * On function
	 * @constructor
	 * @param {} trigger
	 * @param {} callback
	 */
        lib.on = function(trigger, callback) {
            if (callback) {
                lib.on_mem[trigger].callback = callback;
                lib.on_mem[trigger].func();
            }
        }
        lib.on_mem = {
            ready: {
                func: function() {
                    if (core.lib.ready)
                        lib.on_mem.ready.callback();
                    else setTimeout(function() {
                        lib.on_mem.ready.func();
                    }, core.lib.on_interval);
                }
            },
            login: {
                func: function() {
                    if (core.lib.authenticated && !lib.on_mem.login.prev)
                        lib.on_mem.login.callback();
                    lib.on_mem.login.prev = core.lib.authenticated;
                    setTimeout(lib.on_mem.login.func, core.lib.on_interval);
                },
                prev: false,
            },
            logout: {
                func: function() {
                    if (!core.lib.authenticated && lib.on_mem.logout.prev)
                        lib.on_mem.logout.callback();
                    lib.on_mem.logout.prev = core.lib.authenticated;
                    setTimeout(lib.on_mem.logout.func, core.lib.on_interval);
                },
                prev: false,
            },
        }

        return lib;
    }

    if (typeof(window[lns]) === 'undefined') {
        window[lns] = libgen();
    } else {
        console.log(lns + ' already defined, please solve conflict');
    }

})(window);
