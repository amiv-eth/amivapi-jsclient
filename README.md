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
  // do stuff with events
});
```

Login:
```js
amivcore.login(user, password, function(loginReturn){
if (loginReturn !== true)
  alert("Wrong credentials!");
console.log(window.localStorage.getItem("glob-cur_token"))
});
```

## Development

**Important**: one has to wait for the amivcore to load with
```js
amivcore.on('ready', function() {
  // your code
});
```
