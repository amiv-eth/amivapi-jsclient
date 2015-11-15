# AMIV-JSclient
### Small library to access the amiv api

## USE
To use please include in header:<br>
```
<script src="https://rawgit.com/amiv-eth/amiv-jsclient/master/amivaccess.js" type="text/JavaScript"></script
```

Needs jQuery:<br>
```
<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js" type="text/JavaScript"></script
```

## Core Funcitons

### Login()
```
amivaccess.login(username, password);
```
#### Description:
Authenticates a user and saves a cookie for future authentication
#### Parameter:
```username (string)```
```password (string)```

#### Returns:
```True/False``` if login was succesfull/failed
#### Example:
```
if(amivaccess.login('Anon', 'P4$$w0rd'))
	console.log('Login Successfull');
```

<br>
### Authendticated()
```
amivaccess.authenticated()
```
#### Description:
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
### User()
```
amivcaccess.user(attr);
```
#### Description:
Get attributes of current user. Must be logged in.
#### Parameter:

```attribute (string)/attributes (array)```
#### Returns:
```attribute (string)/attributes (object)```
#### Example:
```
console.log(amivaccess.user('firstname'));
\\ "Anon"

console.log(amivaccess.user(['firstname','lastname']));
\\ {firstname: "Anon", lastname: "Imus"}
```

<br>
## General Syntax

```amivaccess.{domain}.{method}(data, id)```
#### Description:
Access all the domains of the API (e.g. 'events' or 'users')<br>
Allowed methods are: GET, POST, DELETE, PATCH, PUT

#### Parameter:
```data (object)``` (Optional) Data that will be transmitted to the API<br>
```id (integer)```  (Optional) Action will be performed on specific id

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