# biprocess
Business Process daemon


This daemon is intented to be running some SQL queries and to store their results in a _REDIS_ server.
It should be combined with some other tools that monitor REDIS server and uses the results to show some stats on a dashboard.

## Install process


Using bash:

```bash
git clone https://github.com/ffis/biprocess # clone repository
cd biprocess
npm install 	 #install dependencies
cp config-example.json config.json 	# copy config.json and configure database and redis connection parameters
cp jobs-example.xml jobs.xml 		# configure what jobs should be executed and their peridiocity
npm test 							# run some tests to check everything is properly configured

```

If tests ran flawlessly then just keep the daemon running with something like:

```bash
forever index.js
```

