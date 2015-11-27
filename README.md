# AMIV-JSclient
### Small library to access the amiv api

## USE
To use please include in header:<br>
```
<script src="https://rawgit.com/amiv-eth/amiv-jsclient/master/amivaccess.js" type="text/JavaScript"></script>
```

Needs jQuery:<br>
```
<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js" type="text/JavaScript"></script
```

## Core Funcitons

### login()
```
amivaccess.login(username, password, callback);
```
#### Description:
Authenticates a user and saves a cookie for future authentication
#### Parameter:
```username (string)```
```password (string)```
```callback (function)```

#### Example:
```
amivaccess.login('Anon', 'P4$$w0rd'), function(res){
	if(res) console.log('Logged in!');
});
```

<br>
### logout()
```
amivaccess.logout;
```
#### Description:
Logges out a user

<br>
### authendticated()
```
amivaccess.authenticated()
```
#### description:
Check if is authenticated
#### Returns
```
True/False
```
#### Example:
```
if(amivaccess.authenticated())
	console.log('Login Successfull');
```

<br>
### ready()
```
amivaccess.ready( function );
```
#### Description:
Takes a function and executes it when the API is fully loaded
#### Parameter:
```function ()```

#### Example:
```
amivapi.ready(function(){
	console.log(amivaccess.events.GET())
	\\ List of all events
});
```

<br>
### user()
```
amivcaccess.user(attr, callback);
```
#### Description:
Get attributes of current user. Must be logged in.
#### Parameter:

```attribute (string)/attributes (array)```
```callback (function)```
#### Example:
```
amivaccess.user('firstname'), function(res){
	console.log(res);
	\\ "Anon"
});

amivaccess.user(['firstname','lastname'], function(res){
	console.log(res);
	\\ {firstname: "Anon", lastname: "Imus"}
});
```

<br>
### getEtag()
```
amivcaccess.getEtag();
```
#### Description:
Gets the current sessions etag
#### Returns:
```etag (string)```
#### Example:
```
console.log(amivaccess.getEtag());
\\ "08fs87v349o8ydfkj3b4kjhew9fhi3u4h9"
```

<br>
## General Syntax

```amivaccess.{domain}.{method}(data, id, headers)```
#### Description:
Access all the domains of the API (e.g. 'events' or 'users')<br>
Allowed methods are: GET, POST, DELETE, PATCH, PUT
These calls may only be made when the API is loaded

#### Parameter:
```data (object)``` (Optional) Data that will be transmitted to the API<br>
```id (integer)```  (Optional) Action will be performed on specific id <br>
```header (object)```  (Optional) Specify header

#### Returns:
```response (obeject)```
#### Example:
```
console.log(amivaccess.events.GET())
\\ List of all events

console.log(amivaccess.events.GET({}, 4))
\\ Get event with id=4

console.log(amivaccess.users.POST({firstname: 'Cup', lastname: 'Cake', email: 'Cup@Cake.Army', gender: 'male', membership: ''}));
\\ Creates and returns new user
```
