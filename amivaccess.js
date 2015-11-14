(function(window) {
  'use strict';
  if (typeof jQuery == 'undefined') {
    var imported = document.createElement('script');
    imported.src = 'https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js';
    document.head.appendChild(imported);
  }

  function amivaccessLib() {
    var amivaccess = {};
    var libName = 'amivaccess';

    var core_lib = {
      api_domains: ['sessions', 'users', 'events'],
      spec_url: 'https://www.nicco.io/amiv/spec.json',
      //spec_url: 'https://amiv-apidev.vsos.ethz.ch/docs/spec.json',
    }

    var lib = {};

    function isEmpty(obj) {
      return Object.keys(obj).length == 0;
    }

    amivaccess.authenticated = false;

    function req(attr) {
      var ret = false;
      $.ajax({
        url: core_lib.api_url + attr.path,
        async: false,
        data: attr.data,
        method: attr.method,
        dataType: 'json',
        timeout: 5000,
        headers: attr.headers,
        success: function(msg) {
          ret = msg;
        },
        error: function(msg) {
          err(msg);
        },
      });
      return ret;
    }

    function makeFunc(domain, m) {
      return function(attr, id) {
        var curLib = {}
        for (var curAttr in attr)
          curLib[curAttr] = attr[curAttr];

        /*
		    var curPath;
		    console.log(amivaccess[domain][m]);
		    if(id) curPath = amivaccess[domain][m];
		    else curPath = amivaccess[domain][m]
			*/

        var curPath = '/' + domain;
        if (id) curPath += '/' + id;

        return req({
          path: curPath,
          method: m,
          data: curLib,
          headers: {
            'Authorization': 'Basic ' + btoa(lib.cur_token + ':')
          },
        })
      };
    }


    $.ajax({
      url: core_lib.spec_url,
      dataType: 'json',
      async: false,
      success: function(d) {
        var data = d['domains'];
        for (var domain in data) {
          if (core_lib.api_domains.indexOf(domain) != -1) {
            amivaccess[domain] = {};
            amivaccess[domain].methods = [];
            for (var p in data[domain]['paths']) {
              for (var m in data[domain]['paths'][p]) {
                if (amivaccess[domain].methods[m] == undefined) amivaccess[domain].methods[m] = {};
                amivaccess[domain].methods[m][p] = data[domain]['paths'][p][m];
              }
            }
            for (var m in amivaccess[domain]['methods']) {
              amivaccess[domain][m] = makeFunc(domain, m);
            }
          }
        }
      },
      error: function(d) {
        console.log(d);
      }
    });

    amivaccess.read = function() {
      console.log(amivaccess);
    }

    amivaccess.login = function(curUser, curPass) {
      var msg = req({
        path: '/sessions/',
        method: 'POST',
        data: {
          user: curUser,
          password: curPass
        },
      });
      var reqVar = ['token', 'user_id'];
      for (var i in reqVar) {
        lib['cur_' + reqVar[i]] = msg[reqVar[i]];
        localStorage['cur_' + reqVar[i]] = msg[reqVar[i]];
      }
      if (msg) {
        amivaccess.authenticated = true;
        return true;
      } else {
        amivaccess.authenticated = false;
        return false;
      }
    }

    return amivaccess;
  }

  if (typeof(amivaccess) === 'undefined') {
    window.amivaccess = amivaccessLib();
  } else {
    console.log("amivaccess already defined, please solve conflict");
  }

})(window);
