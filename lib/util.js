(function(module, log){
	'use strict';
	const Q = require('q');

	module.exports.queryAndReturnAsPromise = function(connection, query, parameters){
		const defer = Q.defer();
		const request = connection.request();
		log.time(query);
		if (query.length > 4000){

			request.batch(query, function(err, value){
				if (err){
					defer.reject(err);
				} else {
					log.timeEnd(query);
					defer.resolve(value);
				}
			});

		} else {

			for (const name in parameters){
				request.input(name, parameters[name]);
			}

			request.query(query, function(err, value){
				if (err){
					err.query = query;
					defer.reject(err);
				} else {
					log.timeEnd(query);
					defer.resolve(value);
				}
			});
		}

		return defer.promise;
	};

	module.exports.queryAndSendResponse = function(connection, query, parameters, res){
		const request = connection.request();
		for (const name in parameters){
			request.input(name, parameters[name]);
		}
		request.query(query, function(err, recordset) {
			if (err) {
				log.error(err);
				res.status(500).send('Cannot retrieve records.' + query + ' ' + err);
			} else {
				res.json(recordset);
			}
		});
	};

	module.exports.parseLocaleESDate = function(strfecha){
		//formato recibido: d/m/Y H:i:s    formato destino: Y/m/d H:i:s
		if (typeof strfecha !== 'string' || strfecha.trim() === ''){
			return false;
		}
		var h = strfecha.split(' ');
		if (h.length !== 2){
			return false;
		}

		var partesfecha = h[0].split('/');
		if (partesfecha.length !== 3){
			return false;
		}

		let d = parseInt(partesfecha[0], 10),
			m = parseInt(partesfecha[1], 10),
			y = parseInt(partesfecha[2], 10);

		const parteshora = h[1].split(':');
		if (parteshora.length !== 3){
			return false;
		}

		let H = parseInt(parteshora[0], 10),
			i = parseInt(parteshora[1], 10),
			s = parseInt(parteshora[2], 10);

		if (i < 10){
			i = '0' + i;
		}
		if (H < 10){
			H = '0' + H;
		}
		if (s < 10){
			s = '0' + s;
		}
		if (d < 10){
			d = '0' + d;
		}
		if (m < 10){
			m = '0' + m;
		}
		if (y < 100){
			y = '20' + y;
		}

		return y + '/' + m + '/' + d + ' ' + H + ':' + i + ':' + s;
	};
})(module, console);
