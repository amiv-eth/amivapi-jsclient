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
                api_url: api_url_config,
                spec_url: spec_url_config,
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
			var token = get('cur_token');
                        if (token != null)
                            return token;
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
        function set(cname, cvalue) {
	    if (lib.shortSession) {
		window.sessionStorage.setItem('glob-' + cname, cvalue);
	    }
	    else
		window.localStorage.setItem('glob-' + cname, cvalue);
        }

	/**
	 * Get from LocalStorage
	 * @constructor
	 * @param {string} cname
	 */
        function get(cname) {
	    if (lib.shortSession)
		return window.sessionStorage.getItem('glob-' + cname);
	    else
		return window.localStorage.getItem('glob-' + cname);
        }

	/**
	 * Remove variable in localStorage
	 * @param {string} cname
	 */
	function remove(cname) {
	    if (lib.shortSession) {
		if (window.sessionStorage.getItem('glob-' + cname) !== null)
		    window.sessionStorage.removeItem('glob-' + cname);
	    }
	    else {
		if (window.localStorage.getItem('glob-' + cname) !== null)
		    window.localStorage.removeItem('glob-' + cname);
	    }
	}


	 /**
	 * Make JSON request with all request parameters in attr
	 * @constructor
	 * @param {} attr - all request parameters (attr.path, attr.data, attr.method ...)
	 * @param {} callback
	 */
        function req(attr, callback) {
            callback = callback || function(msg) {
                console.log(msg);
            };
            $.ajax({
                url: core.lib.api_url + attr.path,
                data: JSON.stringify(attr.data),
                method: attr.method,
                dataType: "json",
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
	 * Make FormData request with all request parameters in attr
	 * @constructor
	 * @param {} attr - all request parameters (attr.path, attr.data, attr.method ...)
	 * @param {} callback
	 */
        function reqFormData(attr, callback) {
            callback = callback || function(msg) {
                console.log(msg);
            };
	    // put the json object into form-data
	    var form = new FormData();
	    for (var key in attr['data'])
		form.append(key, attr['data'][key]);
            $.ajax({
                url: core.lib.api_url + attr.path,
                data: form,
                method: attr.method,
                dataType: "json",
		contentType: false,
		processData: false,
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
	 * @param {string} m - method
	 */
        function makeFunc(domain, m) {
            return function(attr, callback) {
                attr = attr || {}; // if attr does not exist use empty object
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

		// handle where, sort, projection, embedded
		var urlParams = "";
		var urlTypes = ['where', 'sort', 'projection', 'embedded'];
		if (m === 'GET') {
		    for (var curUrlType of urlTypes) {
			if (attr[curUrlType] != undefined) {
			    urlParams += ((urlParams != "") ? "&" + curUrlType + "=": curUrlType + "=");
			    if (typeof attr[curUrlType] === 'object')
				urlParams += JSON.stringify(attr[curUrlType]);
			    else
				urlParams += attr[curUrlType];
			}
		    }
		}
		// append urlParams
		curPath += "?" + urlParams;

                if (get('cur_token') != null)
                    hdr['Authorization'] = 'Basic ' + btoa(get('cur_token') + ':');

                if (m != 'GET') {
                    if (m == 'POST' || m == 'PUT')
                        for (var param in lib[domain]['methods'][m][curLink]['params'])
                            if (lib[domain]['methods'][m][curLink]['params'][param]['required'] == true)
                                if (curLib[lib[domain]['methods'][m][curLink]['params'][param]['name']] == undefined)
                                    return 'Error: Missing ' + lib[domain]['methods'][m][curLink]['params'][param]['name'];
                    // hdr['Content-Type'] = 'application/json';
                    // curLib = JSON.stringify(curLib);
                }
                if (m != 'POST' && m != 'PATCH') {
		    req({
			path: curPath,
			method: m,
			data: curLib,
			headers: hdr,
                    }, callback);
		}
		else {
		    reqFormData({
			path: curPath,
			method: m,
			data: curLib,
			headers: hdr,
                    }, callback);
		}
                return true;
            };
        }

	/**
	 * Read spec.json and set all needed parameters
	 * @constructor
	 */
        $.ajax({
            url: core.lib.spec_url,
            dataType: 'json',
            timeout: core.lib.req_time_out,
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
                console.error(d);
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
	 * @param {string} dom
	 * @param {string} param
	 * @example 
	 * // returns type of field "_id" of resource "users"
	 * amivcore.getParamType("users", "_id")
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
	 * Get the time converted to the format the api understands
	 * @param {Date} d -  date. If none is given then the NOW is used
	 * @example
	 * amivcore.getTime() // "2016-12-20T14:12:55Z"
	 * amivcore.getTime(new Date(2011, 0, 1, 2, 3, 4, 567)) // "2011-01-01T01:03:04Z"
	 */
	lib.getTime = function(d) {
	    d = d || new Date();
	    return core.adapter['datetime'](d.toISOString());
	}

        /** 
	 * Get the etag
	 * @constructor
	 * @param {} curDomain
	 * @param {} curId
	 * @param {} callback
	 * @example 
	 * amivcore.getEtag("users", amivcore.cur_user, function(res) {
	 *     console.log(res);
	 * });
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
	 * Login function
	 * @constructor
	 * @param {String} curUser
	 * @param {String} curPass
	 * @param {function} callback
	 * @param {boolean} shortSession - if user is on a public computer
	 */
        lib.login = function(curUser, curPass, callback, shortSession = false) {
	    lib.shortSession = shortSession || false;
            callback = callback || dummy;
            req({
                path: '/sessions/',
                method: 'POST',
                data: {
                    username: curUser.toLowerCase(),
                    password: curPass
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            }, function(msg) {
                var reqVar = ['token', 'user', '_id'];
                for (var i in reqVar) {
                    lib['cur_' + reqVar[i]] = msg[reqVar[i]];
                }
                if (msg['_status'] == 'OK') {
                    set('cur_token_id', msg['_id']);
                    set('cur_token', msg['token']);
                    set('cur_user_id', msg['user']);
		    set('cur_session_etag', msg['_etag']);
                    callback(true);
                } else {
                    remove('cur_token_id');
                    remove('cur_token');
                    remove('cur_user_id');
		    remove('cur_session_etag');
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
                id: get('cur_token_id'),
		header: {"if-match": get('cur_session_etag')}
            }, function(res) {
                remove('cur_token');
                remove('cur_token_id');
                remove('cur_user_id');
		remove('cur_session_etag');
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
	 * Get the necessary field for specific requests
	 * @constructor
	 * @param {} domain - resource eg. "/users"
	 * @param {} type - HTTP request type eg. "PATCH"
	 * @param {boolean} wId - with id eg. "/users/$id"
	 * @example
	 * amivcore.getRequiredFields("users", "POST", false)
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
