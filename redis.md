## Redis installation

If you don't have a Redis Server in your infrastructure you will need one.

[Redis](http://redis.io/) is an open source (BSD licensed), in-memory data
structure store, used as database, cache and message broker.

I suggest two ways to install Redis, one based on *vagrant* and another
one based on *docker*. The second one is lighter but you may choose the
one you prefer. Take in count you may install this VM or container in
another host, there's no need to be on the same machine of the the
application server.


### <a name="redisvagrant"></a> Redis provided by Vagrant Version


#### Install virtualbox, vagrant and git:
```bash
$ sudo apt-get install -y virtualbox vagrant
```

Test versions:

```bash:
$ vagrant -v
Vagrant 1.8.1

$ vboxmanage --version
5.0.24_Ubuntur108355

$ git --version
git version 2.7.4 
```

### Deploy redis using vagrant:
```bash
$ git clone https://github.com/ffis/vagrant-redis vagrant-redis
$ cd vagrant-redis
$ vagrant up # to wake up the Virtual Machine
$ vagrant halt # use this anytime you want or you need to, you may turn it off

```

## <a name="redisdocker"></a> Redis provided by Docker version (lighter)

### Install docker:
```bash
$ sudo apt-get install -y docker.io 
```


### Deploy redis using docker:

```bash
$ sudo service docker start
$ sudo docker pull redis
$ sudo docker run --name some-redis -p6379:6379 -d redis

# if you want to restart it
$ sudo docker restart some-redis

# if you want to stop and remove the container
$ pidredis=`sudo docker ps -a | grep redis | cut -f 1 -d " "`
$ sudo docker stop $pidredis
$ sudo docker rm $pidredis 
```

## <a name="redistest"></a> Test Redis works flawlessly:
```bash
$ wget https://github.com/crypt1d/redi.sh/raw/master/redi.sh
$ echo "this is a variable" | bash redi.sh -s testvar
$ bash redi.sh -g testvar
# If you can read "this is a variable" then everything is ok.
```

## <a name="redisprotect"></a> Filtering connections to prevent unauthorized access:
```bash
$ sudo iptables -I INPUT -p TCP -s 10.0.0.0/8 --dport 6379 -j ACCEPT # configure your ip range
$ sudo iptables -I INPUT -p TCP --dport 6379 -j DROP
```

