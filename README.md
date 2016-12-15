# amiv-jsclient
Small library to access the amiv api.

## Usage

Include amivcore.js in your webpage: 
```html
<script>
var api_url_config = "https://amiv-apidev.vsos.ethz.ch";
var spec_url_config = "https://amiv-apidev.vsos.ethz.ch/docs/spec.json";
</script>
<script src=https://rawgit.com/amiv-eth/amiv-jsclient/master/amivcore.js></script>
```

An example configuration is also in `config.js`.

## Examples

Get request for event resource:
```js
amivcore.events.GET({}, function(data) {
  console.log(data);
});
```

Get specific event(`584ef956b2d8952f701f3595`) with query to `/events/{_id}`:
```js
amivcore.events.GET({'id': '584ef956b2d8952f701f3595'}, function(data) {
  console.log(data);
});
```

Create event:
```js
attr = {}
attr['data'] = {
	"time_advertising_end":"2016-12-30T12:44:19Z",
	"time_advertising_start":"2016-12-07T12:44:19Z",
	"title_de":"Testevent",
	"priority":5,
	"show_announce":false,
	"show_infoscreen":"true",
	"spots":5,
	"show_website":"true"
	,"description_de":"wjfdaknflkwa",
	"catchphrase_de":"wjfdaknflkwa",
	"time_register_start":"2016-12-14T14:52:45Z",
	"time_register_end":"2016-12-24T14:53:35Z"
};
// "#img_infoscreen" is a file input in the html content of the website
attr['data']['img_infoscreen'] = $("#img_infoscreen")[0].files[0];

amivcore.events.POST(attr, function(res) {
	console.log(res);
});
```

For PATCH requests the etag is needed in order to guarantee concurency in the api. Note that the etag is also recieved  with every answer that contains the object we want to change. This example uses a spereate request to the api but if the etag is already known then this request can be skimped.
```js
amivcore.getEtag("events", "584ef956b2d8952f701f3595", function(etag) {
  console.log(etag);
  // now we can send the actual PATCH request
  amivcore.events.PATCH({
	'id': '584ef956b2d8952f701f3595',
	'header': {'if-match': etag},
	'data': {'title_de': 'GEÄNDERT'}},
	function(data) {
      console.log(data);
	});
});
```

Login:
```js
amivcore.login(user, password, function(loginReturn){
if (loginReturn !== true)
  alert("Wrong credentials!");
console.log(amivecore.cur_user);
});
```

## Development

**Important**: one has to wait for the amivcore to load with
```js
amivcore.on('ready', function() {
  // your code
});
```
