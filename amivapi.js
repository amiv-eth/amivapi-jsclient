(function(window) {
  'use strict';

  function amivapiLib() {

    var amivapi = {};
    var libName = 'amivapi';

    var core_lib = {
		api_url: 'https://amiv-apidev.vsos.ethz.ch',
		api_domains: ['sessions', 'users', 'events'],
		time_out: 50,
		spec_url: 'https://www.nicco.io/amiv/spec.json',
		//spec_url: 'https://amiv-apidev.vsos.ethz.ch/docs/spec.json',
    }

    var lib = {

    };

    function isEmpty(obj) {
      return Object.keys(obj).length == 0;
    }

    function err(m){
	    console.log(m);
	    $('.msg').html(m);
    }

    amivapi.authenticated = false;

    function req(attr){
		var ret = false;
	    $.ajax({
			url: core_lib.api_url+attr.path,
			async: false,
			data: attr.data,
			method: attr.method,
			dataType: 'json',
			timeout: 5000,
			headers: attr.headers,
			success: function(msg){
				ret = msg;
			},
			error: function(msg){
				err(msg);
			},
		});
		return ret;
    }

	function makeFunc(domain, m) {
		return function(attr, id){
		    var curLib = {}
		    for(var curAttr in attr)
		    	curLib[curAttr] = attr[curAttr];

		    /*
		    var curPath;
		    console.log(amivapi[domain][m]);
		    if(id) curPath = amivapi[domain][m];
		    else curPath = amivapi[domain][m]
			*/

			var curPath = '/' + domain;
			if(id) curPath += '/' + id;

		    return req({
			    path: curPath,
			    method: m,
			    data: curLib,
			    headers:{
				    'Authorization': 'Basic '+btoa(lib.cur_token+':')
				},
		    })
	    };
	}


    $.ajax({
	    url:core_lib.spec_url,
	    dataType: 'json',
	    async: false,
	    success: function(d){
		    var data = d['domains'];
			for (var domain in data){
				if(core_lib.api_domains.indexOf(domain) != -1){
				    amivapi[domain] = {};
				    amivapi[domain].methods = [];
				    for(var p in data[domain]['paths']){
					    for(var m in data[domain]['paths'][p]){
						    if(amivapi[domain].methods[m] == undefined) amivapi[domain].methods[m] = {};
						    amivapi[domain].methods[m][p] = data[domain]['paths'][p][m];
						}
				    }
				    for(var m in amivapi[domain]['methods']){
					    amivapi[domain][m] = makeFunc(domain, m);
				    }
			    }
	    	}
	    },
	    error: function(d){
		    console.log(d);
	    }
    });

    amivapi.read = function(){
	    console.log(amivapi);
    }

	amivapi.login = function(curUser, curPass){
		var msg = req({
			path: '/sessions/',
			method: 'POST',
			data: {user: curUser, password: curPass},
		});
		var reqVar = ['token','user_id'];
		for(var i in reqVar){
			lib['cur_'+reqVar[i]] = msg[reqVar[i]];
			localStorage['cur_'+reqVar[i]] = msg[reqVar[i]];
		}
		if(msg){
			amivapi.authenticated = true;
			return true;
		}
		else{
			amivapi.authenticated = false;
			return false;
		}
	}

    return amivapi;
  }

  if (typeof(amivapi) === 'undefined') {
    window.amivapi = amivapiLib();
  } else {
    console.log("amivapi already defined, please solve conflict");
  }

})(window);
