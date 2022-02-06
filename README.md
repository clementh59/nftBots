## Communicating with rpi

ssh pi@192.168.1.33
scp -r ../rpiBots/ pi@192.168.1.33:/home/pi/
scp -r ./src pi@192.168.1.33:/home/pi/rpiBots
scp docker-compose.yml ubuntu@192.168.1.33:/home/ubuntu/rpiBots
scp runInLinux ubuntu@192.168.1.33:/home/ubuntu/rpiBots

JkXD9bokJay5JCSYrF

## Adding a new blockchain / smart contract

- Configure the config file
- Create a new db
- Create an info collection in the db
- Implement all the functions mandatory in the utils' retrieveAndAnalyzeTxs function.

## Test the api

- http://0.0.0.0:2727/ping
- http://0.0.0.0:2727/getCheapestItems?bc=terra&collection=galactic_punks&perPage=20&page=1

## Set up the mongo db

1. Create the terra db
```
use terra
```

2. Connect compass
```
mongodb://192.168.1.29:27017/terra?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false
```

3. Use the script (and modify it) to import data. Don't forget to add token_id index in each collections.