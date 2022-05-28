## Communicating with rpi

ssh clement@192.168.0.15
scp -r ../rpiBots/ clement@192.168.0.15:/home/pi/
scp -r ./src clement@192.168.0.15:/home/pi/rpiBots
scp docker-compose.yml clement@192.168.0.15:/home/ubuntu/rpiBots
scp runInLinux clement@192.168.0.15:/home/ubuntu/rpiBots

## Adding a new blockchain / smart contract

- Configure the config file
- Create a new db
- Create an info collection in the db
- Implement all the functions mandatory in the utils' retrieveAndAnalyzeTxs function.
- In the infoAndStatusDB, add all the mandatory functions

## Adding a new collection into terra algo

- add the contract in `terra/config`
```
"luna_bulls_tesseract": "terra1k5pa7htlznr7hskhr9dx8qlk65emhktrgmuknd"
```
- add the collection config in `terra/config`
```
{"name": "styllar", "triggerFactor": 3, "rarityFactor": 3},
```
- If you want to add a special function for special fields, you can do it by adding it in the `collectionToFunction` map.

## Buying algorithm

In order to determine if we buy an item or not, we compare the price of the cheapest item with the price of the second 
cheapest item.
Each collection has a triggerFactor parameter. It has to be between 1 and 5.
Here is what it means:
- 1 means we trigger if the price is 90% below the real price
- 2 means we trigger if the price is 60% below the real price 
- 3 means we trigger if the price is 40% below the real price 
- 4 means we trigger if the price is 25% below the real price 
- 5 means we trigger if the price is 15% below the real price 

Moreover, if the collection supports it, the algorithm looks at the rare items and buy them if they are close to the 
floor and below a certain rarity percentage. This percentage is determined by the rarityFactor defined in the 
collection's config. It has to be between 1 and 5.
- 1 means we trigger if an item with a rarity of 2.5% or below is close to the floor price.
- 2 means we trigger if an item with a rarity of 5% or below is close to the floor price.
- 3 means we trigger if an item with a rarity of 10% or below is close to the floor price.
- 4 means we trigger if an item with a rarity of 25% or below is close to the floor price.
- 5 means we trigger if an item with a rarity of 40% or below is close to the floor price.

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
mongodb://192.168.0.15:27017/terra?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false
```

3. Use the script (and modify it) to import data. Don't forget to add token_id index in each collections.