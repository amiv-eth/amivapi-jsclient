(function(window) {
  'use strict';

  function amivaccessLib() {
    var amivaccess = {};
    var libName = 'amivaccess';

    var core_lib = {
      api_url: 'https://amiv-apidev.vsos.ethz.ch',
      spec_url: 'https://rawgit.com/amiv-eth/amiv-jsclient/master/spec.json',
      //spec_url: 'https://amiv-apidev.vsos.ethz.ch/docs/spec.json',
      api_domains: ['sessions', 'users', 'events', 'permissions', 'groups'],
      authenticated: false,
      ready: false,
      time_out: 50,
      reqDone: {},
    }

    var lib = {};

    function setCookie(cname, cvalue, exdays) {
      var d = new Date();
      d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
      var expires = "expires=" + d.toGMTString();
      document.cookie = cname + "=" + cvalue + "; " + expires;
    }

    function getCookie(cname) {
      var name = cname + "=";
      var ca = document.cookie.split(';');
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    }

    function checkCookie() {
      var user = getCookie("username");
      if (user != "") {
        alert("Welcome again " + user);
      } else {
        user = prompt("Please enter your name:", "");
        if (user != "" && user != null) {
          setCookie("username", user, 30);
        }
      }
    }

    function req(attr) {
      var ret = false;
      $.ajax({
        url: core_lib.api_url + attr.path,
        async: false,
        data: attr.data,
        method: attr.method,
        dataType: 'json',
        timeout: 3000,
        headers: attr.headers,
        success: function(msg) {
          ret = msg;
        },
        error: function(msg) {
          console.log(msg);
        },
      });
      return ret;
    }

    function makeFunc(domain, m) {
      return function(attr, id, custHeader) {
        var curLib = {}
        for (var curAttr in attr)
          curLib[curAttr] = attr[curAttr];

        var hdr = {};
        for (var curHdr in custHeader)
          hdr[curHdr] = custHeader[curHdr];

        var curPath = '/' + domain;
        var curLink = curPath;
        if (id != undefined) {
          curPath += '/' + id;
          curLink += '/{_id}';
        }

        if (lib.cur_token != undefined)
          hdr['Authorization'] = 'Basic ' + btoa(lib.cur_token + ':');

        if (m != 'GET') {
          for (var param in amivaccess[domain]['methods'][m][curLink]['params'])
            if (amivaccess[domain]['methods'][m][curLink]['params'][param]['required'] == true)
              if (curLib[amivaccess[domain]['methods'][m][curLink]['params'][param]['name']] == undefined)
                return 'Error: Missing ' + amivaccess[domain]['methods'][m][curLink]['params'][param]['name'];
          hdr['Content-Type'] = 'application/json';
        }

        return req({
          path: curPath,
          method: m,
          data: JSON.stringify(curLib),
          headers: hdr,
        })
      };
    }


    $.ajax({
      url: core_lib.spec_url,
      dataType: 'json',
      timeout: 5000,
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
        core_lib.ready = true;
      },
      error: function(d) {
        console.log('Cannot reach AMIVAPI');
        console.log(d);
      }
    });

    function checkAuth() {
      if (getCookie('cur_token') != '') {
        lib.cur_token = getCookie('cur_token');
        lib.cur_user_id = getCookie('cur_user_id');
        var res = amivaccess.sessions.GET({
          where: 'token==["' + lib.cur_token + '"]'
        });
        if (res != false && res['_items'].length == 0)
          core_lib.authenticated = false;
        else
          core_lib.authenticated = true;
      }
    }

    amivaccess.authenticated = function() {
      checkAuth();
      return core_lib.authenticated;
    }

    amivaccess.login = function(curUser, curPass) {
      var msg = req({
        path: '/sessions/',
        method: 'POST',
        data: JSON.stringify({
          user: curUser.toLowerCase(),
          password: curPass
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      var reqVar = ['token', 'user_id'];
      for (var i in reqVar) {
        lib['cur_' + reqVar[i]] = msg[reqVar[i]];
      }
      if (msg) {
        core_lib.authenticated = true;
        setCookie('cur_token', msg['token'], 1);
        setCookie('cur_user_id', msg['user_id'], 1);
        return true;
      } else {
        setCookie('cur_token', '', -1);
        setCookie('cur_user_id', '', -1);
        core_lib.authenticated = false;
        return false;
      }
    }

    amivaccess.logout = function() {
      setCookie('cur_token', '', -1);
      location.reload();
    }

    amivaccess.user = function(attr) {
      if (typeof attr === 'object') {
        var tmp = amivaccess.users.GET({}, lib.cur_user_id);
        var ret = {};
        for (var key in attr)
          ret[attr[key]] = tmp[attr[key]];
        return ret;
      } else {
        return amivaccess.users.GET({}, lib.cur_user_id)[attr];
      }
    }

    amivaccess.set = function(sel, attr) {
      $(sel).text(amivaccess.user(attr));
    }

    amivaccess.ready = function(func) {
      if (core_lib.ready) {
        checkAuth();
        func();
      } else setTimeout(function() {
        amivaccess.ready(func);
      }, core_lib.time_out);
    }

    return amivaccess;
  }

  if (typeof(amivaccess) === 'undefined') {
    window.amivaccess = amivaccessLib();
  } else {
    console.log("amivaccess already defined, please solve conflict");
  }

})(window);
