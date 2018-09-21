# verisure-to-mqtt-bridge

Dockerized Node.js app that queries Verisure's APIs for status, and then forward this info to MQTT.  
Once the data has been injected into MQTT messages, it can be acted upon by any tool or system capable of subscribing to MQTT topics. 
A very powerful use case is to use [Node-RED](https://nodered.org/) to automate various actions based on information retrieved from the alarm system.  
For example

* Turn on lamps, radio etc when someone arrives home and disarms (turns off) the alarm. Different actions could even be taken depending on who it is that turns off the alarm.
* Store the climate readings (temperature and humidity) taken by the various alarm sensors in a database such as [InfluxDb](https://www.influxdata.com/time-series-platform/influxdb/).

The status JSON returned from Verisure is quite rich and includes both alarm related information (alarm state, status of door/window sensors), as well as temperature and humidity readings from the various devices in the system.  
  
It is easy to change th MQTT topics in case the current ones don't fit your needs. 


## Querying Verisure's API
There is some rate limiting for the API, preventing too frequent calls.  

It is hard to say how often calls can be made, but given that climate sensors only update once per hour, the Node.js code in index.js is set to query the API every 10 minutes. This seems to work fine from a rate limiting perspective.

Some parts (e.g. info on door locks, heat pumps, cameras etc) of the data received from Verisure's API are not forwarded to MQTT. The reason is simply that I don't have access to such devices, and thus don't know what the associated JSON looks like.  
Please feel free to fork this repository and add the missing code if you have access to those missing devices.


## Dockerizing the Node.js app

For testing purposes [this guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp) is useful.  
A proper production deployment requires more work, but even the steps outlined below will be enough to test things up on a home server, NAS or similar.

### Build Docker image
```
cd /directory/where/node/app/is/stored
docker build -t mountaindude/verisure-mqtt .
```


### Run Docker image
```
docker run --name verisure-mqtt -d mountaindude/verisure-mqtt
```

Even better, use docker-compose. Adapt the docker-compose.yml file to your needs:

```yaml
# docker-compose.yml
version: '2.2'  
services:  
  verisure-mqtt:  
    image: mountaindude/verisure-mqtt  
    container_name: verisure-mqtt  
    restart: always  
    environment:  
      - "MQTT_BROKER_HOST=<ip of MQTT broker>"  
      - "MQTT_BROKER_PORT=<port used by MQTT broker>"  
      - "VERISURE_USERNAME=<username used to log into Verisure web service>"  
      - "VERISURE_PWD=<password used to log into Verisure web service"  
    logging:  
      driver: json-file  
```

Then run

```bash
docker-compose up
```

from the directory where docker-compose.yml is stored.


### Get shell inside running container
In case you want to see what's going on within the running container, you can attach to it:

```bash
docker exec -it verisure-mqtt /bin/bash
```

### Monitor console output within the running container
Watch all console output messages generated within the container called verisure-mqtt

```bash
docker logs verisure-mqtt -f
```

### Export image to file, for copying to new server
If you develop on one computer but then want to deploy your newly created Docker image to a server, you need to export it to a TAR file.

```bash
docker images  

# Take note of the id of the image you want to export
docker save -o ./verisure-mqtt.tar <id>  
```

### Import image into new server
Once you have an image in a TAR file, you can load it into Docker on some other machine. 
An alternative to the steps below is to pubish the image to Docker Hub and thus make it generally available, but if that's too much work the steps below are quick and easy.

```bash
# Log into target server
# Copy verisure-mqtt.tar to temp folder on target server
docker load -i ./verisure-mqtt.tar  
docker images  

# Take note of the id of the newly loaded image. Then rename the image to something human readable
docker tag <image id> mountaindude/verisure-mqtt  

# Copy docker-compose.yml file to target server, then create and start a new container based on the image
docker-compose up  
```


