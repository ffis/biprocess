# biprocess
Business Process daemon


This daemon is intented to be running some heavyweight jobs and to store their
results in a _REDIS_ server. Example of heavyweight job is an SQL query that last
for more than a couple of seconds. If it's acceptable that it result can be cached
for some time this is a project you might be interested in. You can choose for how
long it will be cached and for each job when (_peridiocity_) it needs to be runned
using a cron like expression.

It should be combined with some other tools that monitor REDIS server and uses
the results to show some stats on a dashboard.

If you don't have a _REDIS_ server installed check the [redis installation manual](./redis.md).

## Install process

Using bash:

```bash
git clone https://github.com/ffis/biprocess # clone repository
cd biprocess
npm install 	 #install dependencies
cp config-example.json config.json 	# copy config.json and configure database and redis connection parameters
cp jobs-example.xml jobs.xml 		# configure what jobs should be executed and their peridiocity

```

Depending on the kind of database you want to connect (see next section), you may need to add one of the following:

```bash
npm install --save pg pg-hstore
npm install --save mysql2
npm install --save sqlite3
npm install --save tedious // MSSQL
```

If tests ran flawlessly then just keep the daemon running with something like:

```bash
sudo npm i -g mocha forever
npm test 				# run some tests to check everything is properly configured
forever index.js
```



## How to configure config.json

The file that configures how to connect to the different services is _config.json_ that looks like this:

```json
{
	"db": {
		"database": "",
		"username": "",
		"password": "",
		"options": {
			"dialect": "mssql",
			"host": "localhost",
			"operatorsAliases": false,
			"logging": false
		}
	},
	"redis": {
		"host": "localhost",
		"port": 6379,
		"no_ready_check": true
	},
	"debug": true
}

```

You should change the properties according to your infrastructure and services stack.

Note db.options.dialect accepts 'mysql'|'sqlite'|'postgres'|'mssql' as values.
This tool uses [Sequelize](http://docs.sequelizejs.com/) to gain support of several kind of databases.
Check it for more configuration options information.


## Copyright notes:

This software is available under MIT license:
* Copyright (c) 2018, FFIS
 
 Author: Loksly https://github.com/loksly/