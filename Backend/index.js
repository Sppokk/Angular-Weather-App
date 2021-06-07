const fs = require("fs");
const express = require('express');
const fetch = require('node-fetch');// import to make request to an external endpoint

const app = express();

requestDelay = 30; // Time in minuts
apiURL = 'http://api.weatherstack.com/current?access_key=df65b51017e9178c96f6e6820467cfb0&query='//endpoint
localDB = loadDb();

function loadDb() {
    try {
        return JSON.parse(fs.readFileSync('./db.json', 'utf8'));
    } catch (error) {
        console.log(error)
    }
}

// Add headers
app.use(function (req, res, next) {

    //CORS problem!:
    //https://stackoverflow.com/questions/18310394/no-access-control-allow-origin-node-apache-port-issue

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');//give permission to all *

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.get('/weather', async (req, res) => {
    const location = req.query.location;

    // if query is empty, return error
    if (location != null) {

        console.log("Request for location: " + location);
        var existsInDatabase = false;
        for (var i in localDB.weather) {
            var item = localDB.weather[i];
            if (item.location == location) {
                var existsInDatabase = true;
                // The location exists in the database, check the timestamp
                if (item.timeStamp > (Date.now() - (requestDelay * 60000))) {

                    console.log("Request data from local db for location: " + location);

                    res.json({
                        "location": item.location,
                        "country": item.country,
                        "temperature": item.temperature,
                        "humidity": item.humidity,
                        "feelslike": item.feelslike,
                        "visibility": item.visibility,
                        "uv_index": item.uv_index
                    })
                } else {
                    // data is older than 30min request from service the weather
                    console.log("Request data from API for location: " + location);

                    await requestDataFromAPI(location);//waits for all before is done

                    res.json({
                        "location": item.location,
                        "country": item.country,
                        "temperature": item.temperature,
                        "humidity": item.humidity,
                        "feelslike": item.feelslike,
                        "visibility": item.visibility,
                        "uv_index": item.uv_index
                    })
                }
            }
        }

        if (existsInDatabase == false) {
            await requestDataFromAPI(location);//waits for all before is done

            var newItem = await getItemForLocation(location);

                    res.json({
                        "location": newItem.location,
                        "country": newItem.country,
                        "temperature": newItem.temperature,
                        "humidity": newItem.humidity,
                        "feelslike": newItem.feelslike,
                        "visibility": newItem.visibility,
                        "uv_index": newItem.uv_index
                    })
        }
    } else {
        res.json("ERROR no query params");
    }
});

app.listen(3000, () => console.log('Server is running...'))



function saveDb() {
    fs.writeFileSync('./db.json', JSON.stringify(localDB, null, 2), error => {
        if (error) {
            console.log(error);
        }
    })
}

async function getItemForLocation(location){
    if (localDB != null) {
        for (var i in localDB.weather) {
            var item = localDB.weather[i];
            if (item.location == location) {
                return item;
            }
        }
    }
}

async function requestDataFromAPI(location) {

    const fetch_response = await fetch(apiURL + location)
    const json_response = await fetch_response.json();

    if (localDB != null) {
        var existsInDatabase = false
        for (var i in localDB.weather) {
            var item = localDB.weather[i];
            if (item.location == location) {

                // The location exists in the database, add the data
                item.timeStamp = Date.now();
                item.country = json_response.location.country;
                item.temperature = json_response.current.temperature;
                item.wind_speed = json_response.current.wind_speed;
                item.wind_dir = json_response.current.wind_dir;
                item.humidity = json_response.current.humidity;
                item.cloudcover = json_response.current.cloudcover;
                item.feelslike = json_response.current.feelslike;
                item.uv_index = json_response.current.uv_index;
                item.visibility = json_response.current.visibility;

                console.log("Update");
                existsInDatabase = true;
            }
        }

        if (!existsInDatabase) {
            localDB['weather'].push(
                {
                    "location": location,
                    "timeStamp": Date.now(),
                    "country": json_response.location.country,
                    "temperature": json_response.current.temperature,
                    "wind_speed": json_response.current.wind_speed,
                    "wind_dir": json_response.current.wind_dir,
                    "humidity": json_response.current.humidity,
                    "cloudcover": json_response.current.cloudcover,
                    "feelslike": json_response.current.feelslike,
                    "uv_index": json_response.current.uv_index,
                    "visibility": json_response.current.visibility
                }
            );
        }
    }
    saveDb();

    function loadDb() {
        try {
            return JSON.parse(fs.readFileSync('./db.json', 'utf8'));
        } catch (error) {
            console.log(error)
        }
    }
}