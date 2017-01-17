var express = require('express'),
	path = require('path'),
	config = require('./config'),
	async = require('async'),
	gpio = require('./pi-gpio'),
	email = require('./lib/email'),
	propertiesReader = require('properties-reader'),
	app = express();

//app.set('port', process.env.PORT || 3000);
var properties = propertiesReader('./properties/app.properties');
app.set('port', properties.get('app.port'));

app.use('/', express.static(__dirname + '/public'));

app.get('/email', function(req, res) {
	email.sendEmail(properties.get('app.api.key'), properties.get('app.email.to'), properties.get('app.email.from'));
	res.json("email sent...");
});

function delayPinWrite(pin, value, callback) {
	setTimeout(function() {
		gpio.write(pin, value, callback);
	}, config.RELAY_TIMEOUT);
}

app.get("/api/ping", function(req, res) {
	res.json("pong");
});

app.post("/api/garage/left", function(req, res) {
	debugger;
	console.log('inside the left garage code');
	async.series([
		function(callback) {
			// Open pin for output
			console.log('Open pin for output');
			gpio.open(config.LEFT_GARAGE_PIN, "output", callback);			
			//email.sendEmail(properties.get('app.api.key'), properties.get('app.email.to'), properties.get('app.email.from'), 'LEFT GARAGE OPENED');
		},
		function(callback) {
			// Turn the relay on
			console.log('Turn the relay on');
			gpio.write(config.LEFT_GARAGE_PIN, config.RELAY_ON, callback);
			
		},
		function(callback) {
			// Turn the relay off after delay to simulate button press
			console.log('Turn the relay off after delay to simulate button press');
			delayPinWrite(config.LEFT_GARAGE_PIN, config.RELAY_OFF, callback);
			
		},
		function(err, results) {
			setTimeout(function() {
				// Close pin from further writing
				console.log('Close pin from further writing');
				gpio.close(config.LEFT_GARAGE_PIN);				

				email.sendEmail(properties.get('app.api.key'), properties.get('app.email.to'), properties.get('app.email.from'), 'LEFT GARAGE OPENED');
				// Return json
				res.json("ok");
			}, config.RELAY_TIMEOUT);
		}
	]);
});

app.post("/api/garage/right", function(req, res) {
	async.series([
		function(callback) {
			// Open pin for output
			console.log('Open pin for output - RIGHT');
			gpio.open(config.RIGHT_GARAGE_PIN, "output", callback);
		},
		function(callback) {
			// Turn the relay on
			console.log(' - RIGHT');
			gpio.write(config.RIGHT_GARAGE_PIN, config.RELAY_ON, callback);
		},
		function(callback) {
			// Turn the relay off after delay to simulate button press
			console.log('Turn the relay off after delay to simulate button press - RIGHT');
			delayPinWrite(config.RIGHT_GARAGE_PIN, config.RELAY_OFF, callback);
		},
		function(err, results) {
			setTimeout(function() {
				// Close pin from further writing
				console.log('Close pin from further writing - RIGHT');
				gpio.close(config.RIGHT_GARAGE_PIN);
				email.sendEmail(properties.get('app.api.key'), properties.get('app.email.to'), properties.get('app.email.from'), 'RIGHT GARAGE OPENED');
				// Return json
				res.json("ok");
			}, config.RELAY_TIMEOUT);
		}
	]);
});

app.post("/api/garage/both", function(req, res) {
	async.series([
		function(callback) {
			// Open pin for output
			gpio.open(config.LEFT_GARAGE_PIN, "output", callback);
		},
		function(callback) {
			// Open pin for output
			gpio.open(config.RIGHT_GARAGE_PIN, "output", callback);
		},
		function(callback) {
			// Turn the relay on
			gpio.write(config.LEFT_GARAGE_PIN, config.RELAY_ON, callback);
		},
		function(callback) {
			// Turn the relay on
			gpio.write(config.RIGHT_GARAGE_PIN, config.RELAY_ON, callback);
		},
		function(callback) {
			// Turn the relay off after delay to simulate button press
			delayPinWrite(config.LEFT_GARAGE_PIN, config.RELAY_OFF, callback);
		},
		function(callback) {
			// Turn the relay off after delay to simulate button press
			delayPinWrite(config.RIGHT_GARAGE_PIN, config.RELAY_OFF, callback);
		},
		function(err, results) {
			setTimeout(function() {
				// Close pin from further writing
				gpio.close(config.LEFT_GARAGE_PIN);
				gpio.close(config.RIGHT_GARAGE_PIN);
				// Return json
				res.json("ok");
			}, config.RELAY_TIMEOUT);
		}
	]);
});

app.listen(app.get('port'));
