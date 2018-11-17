const redis = require("redis");

const { promisify } = require("util");
const client = redis.createClient({
    host: "localhost",
    port: 6379
});

client.on("error", function(err) {
    console.log(err);
});
client.on("connect", function() {
    console.log("Redis client connected");
});

client.set("key", " value", redis.print);
client.get("key", function(error, value) {
    if (error) {
        console.log(error);
        throw error;
    }
    console.log("GET result ->" + value);
});

exports.get = promisify(client.get).bind(client);

exports.setex = promisify(client.setex).bind(client);

exports.del = promisify(client.del).bind(client);

/*

//require redis in index.js: export these function

redis.setex('catnip', 20, 'cute as a button', function(err,data){
if(err){console.log(err)}
else {
client.get('catnip', function(err,data{
console.log(err||data)
}
});



client.get('funky', function(err,data){
console.log(err||data)
}*/

/*Session
store session in redis in stead of in cookie:
delete app.use cookieSession
Include this code instead in the index.js file

var session = require('express-session');

var Store = require('connect-redis')(session);
app.use(session({
    store: new Store({
        ttl: 3600,
        host: 'localhost',
        port: 6379
    }),
    resave: false,
    saveUninitialized: true,
    secret: 'my super fun secret'
}));
*/
