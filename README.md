## Communicating with rpi

ssh pi@192.168.1.33
scp -r ../rpiBots/ pi@192.168.1.33:/home/pi/
scp -r ./src pi@192.168.1.33:/home/pi/rpiBots
scp docker-compose.yml ubuntu@192.168.1.36:/home/ubuntu/bot

JkXD9bokJay5JCSYrF

## Adding a new blockchain / smart contract

- Configure the config file
- Create a new db
- Create an info collection in the db
- Implement all the functions mandatory in the utils' retrieveAndAnalyzeTxs function.

## Test the api

- http://0.0.0.0:2727/ping
- http://0.0.0.0:2727/getCheapestItems?bc=terra&collection=terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k&perPage=20&page=1