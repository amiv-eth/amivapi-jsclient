!function(e){"use strict";function t(){function e(e,t,r){var n=new Date;n.setTime(n.getTime()+24*r*60*60*1e3);var o="expires="+n.toGMTString();document.cookie=e+"="+t+"; "+o}function t(e){for(var t=e+"=",r=document.cookie.split(";"),n=0;n<r.length;n++){for(var o=r[n];" "==o.charAt(0);)o=o.substring(1);if(0==o.indexOf(t))return o.substring(t.length,o.length)}return""}function r(e,t){t=t||function(e){console.log(e)},$.ajax({url:i.api_url+e.path,data:e.data,method:e.method,dataType:"json",timeout:3e3,headers:e.headers,success:function(e){return t(e),!0},error:function(e){return i.show_errors&&console.log(e),t(e),!1}})}function n(e,t){return function(n,o){n=n||{};var i={};for(var u in n.data)i[u]=n.data[u];var c={};for(var d in n.header)c[d]=n.header[d];var f="/"+e,h=f;if(void 0!=n.id&&(f+="/"+n.id,h+="/{_id}"),void 0!=s.cur_token&&(c.Authorization="Basic "+btoa(s.cur_token+":")),"GET"!=t){if("POST"==t||"PUT"==t)for(var m in a[e].methods[t][h].params)if(1==a[e].methods[t][h].params[m].required&&void 0==i[a[e].methods[t][h].params[m].name])return"Error: Missing "+a[e].methods[t][h].params[m].name;c["Content-Type"]="application/json",("PATCH"==t||"PUT"==t||"DELETE"==t)&&(c["If-Match"]=a.getEtag(e,n.id)),i=JSON.stringify(i)}return r({path:f,method:t,data:i,headers:c},o),!0}}function o(e){""!=t("cur_token")?(s.cur_token=t("cur_token"),s.cur_user_id=t("cur_user_id"),a.sessions.GET({data:{where:'token==["'+s.cur_token+'"]'}},function(t){0!=t&&0==t._items.length?i.authenticated=!1:i.authenticated=!0,e()})):e()}var a={},i={api_url:"https://amiv-apidev.vsos.ethz.ch",spec_url:"https://rawgit.com/amiv-eth/amiv-jsclient/master/spec.json",authenticated:!1,ready:!1,time_out:50,show_errors:!0},s={};return $.ajax({url:i.spec_url,dataType:"json",timeout:5e3,success:function(e){var t=e.domains;for(var r in t){a[r]={},a[r].methods=[];for(var o in t[r].paths)for(var s in t[r].paths[o])void 0==a[r].methods[s]&&(a[r].methods[s]={}),a[r].methods[s][o]=t[r].paths[o][s];for(var s in a[r].methods)a[r][s]=n(r,s)}i.ready=!0},error:function(e){console.log("Cannot reach AMIVAPI"),console.log(e)}}),a.getEtag=function(e,t){return a[e].GET({id:t})._etag},a.authenticated=function(){return i.authenticated},a.login=function(t,n,o){o=o||function(e){console.log(e)},r({path:"/sessions/",method:"POST",data:JSON.stringify({user:t.toLowerCase(),password:n}),headers:{"Content-Type":"application/json"}},function(t){var r=["token","user_id"];for(var n in r)s["cur_"+r[n]]=t[r[n]];"OK"==t._status?(i.authenticated=!0,e("cur_token",t.token,1),e("cur_user_id",parseInt(t.user_id),1),o(!0)):(e("cur_token","",-1),e("cur_user_id","",-1),i.authenticated=!1,o(!1))})},a.logout=function(){e("cur_token","",-1),e("cur_user_id","",-1),location.reload()},a.user=function(e,t){a.users.GET({id:s.cur_user_id},function(r){if("object"==typeof e){var n={};for(var o in e)n[e[o]]=r[e[o]];t(n)}else t(r[e])})},a.set=function(e,t){$(e).text(a.user(t))},a.getRequiredFields=function(e,t,r){var n,o={};if(n=r?a[e].methods[t]["/"+e+"/{_id}"].params:a[e].methods[t]["/"+e].params,0==n.length)return!1;for(var i=0;i<n.length;i++)1==n[i].required&&(o[n[i].name]=n[i]);return o},a.ready=function(e){i.ready?o(function(){e()}):setTimeout(function(){a.ready(e)},i.time_out)},a}"undefined"==typeof amivaccess?e.amivaccess=t():console.log("amivaccess already defined, please solve conflict")}(window);
