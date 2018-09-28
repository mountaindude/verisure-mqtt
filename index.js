const Verisure = require('verisure');
const mqtt = require('mqtt');
var asyncInterval = require('asyncinterval');


// Set to true to output all received info to console.
// False will limit output to only mention that a query to the Verisure API is made
const flagDebug = (process.env.VERISURE_DEBUG == 'true') ? true : false;


// Read config and secrets from environment variables
const config = {
    "verisureUsername": process.env.VERISURE_USERNAME,
    "verisurePwd": process.env.VERISURE_PWD,
    "mqttBrokerHost": process.env.MQTT_BROKER_HOST,
    "mqttBrokerPort": process.env.MQTT_BROKER_PORT,
    "mqttRootTopic": (process.env.MQTT_ROOT_TOPIC.substr(process.env.MQTT_ROOT_TOPIC.length - 1) == '/') ? process.env.MQTT_ROOT_TOPIC.substr(0, process.env.MQTT_ROOT_TOPIC.length - 1) : process.env.MQTT_ROOT_TOPIC
};

const verisure_prefix = 'verisure';


if (flagDebug) {
    console.log(`Verisure username: ${config.verisureUsername}`);
    console.log(`Verisure pwd: ${config.verisurePwd}`);
    console.log(`MQTT host: ${config.mqttBrokerHost}`);
    console.log(`MQTT host port: ${config.mqttBrokerPort}`);
    console.log(`MQTT root topic: ${config.mqttRootTopic}`);
}


var mqttClient = mqtt.connect(`mqtt://${config.mqttBrokerHost}:${config.mqttBrokerPort}`);

mqttClient.on('connect', function () {
    mqttClient.subscribe(`${config.mqttRootTopic}/status/services/verisure-to-mqtt-bridge`, function (err) {
        if (!err) {
            mqttClient.publish(`${config.mqttRootTopic}/status/services/verisure-to-mqtt-bridge`, 'Hello mqtt');
        }
    })
})

function wait(timeout) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, timeout)
    })
}

function getVerisure() {
    try {
        const verisure = new Verisure(config.verisureUsername, config.verisurePwd);
        verisure.getToken()
            .then(() => verisure.getInstallations())
            .then(installations => installations[0].getOverview())
            .then((overview) => {
                console.log(`${new Date()} : Polling Verisure API...`);

                if (flagDebug) {
                    console.log('OVERVIEW:', overview);
                }

                // Overall alarm state 
                mqttClient.publish(`${config.mqttRootTopic}/${verisure_prefix}/tele/armState/STATE`,
                    JSON.stringify(overview.armState), {
                        "retain": true
                    });

                // Alarm state compatible 
                mqttClient.publish(`${config.mqttRootTopic}/${verisure_prefix}/tele/armstateCompatible/STATE`, overview.armstateCompatible.toString());

                // Control plugs
                overview.controlPlugs.forEach(controlPlug => {
                    mqttClient.publish(`${config.mqttRootTopic}/${verisure_prefix}/tele/controlPlug/STATE`, JSON.stringify(controlPlug));
                });

                // Smart plugs
                overview.smartPlugs.forEach(smartPlug => {
                    mqttClient.publish(`${config.mqttRootTopic}/${verisure_prefix}/tele/smartPlug/STATE`, JSON.stringify(smartPlug));
                });

                // Door locks
                // TODO

                // SMS count
                mqttClient.publish(`${config.mqttRootTopic}/${verisure_prefix}/tele/totalSmsCount/STATE`, overview.totalSmsCount.toString());

                // Environmental values
                overview.climateValues.forEach(climateValue => {
                    mqttClient.publish(`${config.mqttRootTopic}/${verisure_prefix}/tele/${climateValue.deviceArea}/SENSOR`, JSON.stringify(climateValue));
                });

                // Error list
                overview.installationErrorList.forEach(installationError => {
                    mqttClient.publish(`${config.mqttRootTopic}/${verisure_prefix}/tele/${installationError.area}/STATE`, JSON.stringify(installationError));
                });

                // Pending changes
                mqttClient.publish(`${config.mqttRootTopic}/${verisure_prefix}/tele/pendingChanges/STATE`, overview.pendingChanges.toString());

                // Ethernet mode active
                mqttClient.publish(`${config.mqttRootTopic}/${verisure_prefix}/tele/ethernetModeActive/STATE`, overview.ethernetModeActive.toString());

                // Ethernet connected now
                mqttClient.publish(`${config.mqttRootTopic}/${verisure_prefix}/tele/ethernetConnectedNow/STATE`, overview.ethernetConnectedNow.toString());

                // Heat pumps
                // TODO 

                // Smart Cameras
                // TODO

                // Latest Ethernet status
                mqttClient.publish(`${config.mqttRootTopic}/${verisure_prefix}/tele/latestEthernetStatus/STATE`, JSON.stringify(overview.latestEthernetStatus));

                // Customer image cameras
                // TODO

                // Battery process
                mqttClient.publish(`${config.mqttRootTopic}/${verisure_prefix}/tele/batteryProcess/STATE`, JSON.stringify(overview.batteryProcess));

                // User tracking status
                mqttClient.publish(`${config.mqttRootTopic}/${verisure_prefix}/tele/userTrackingStatus/STATE`, overview.userTracking.installationStatus.toString());

                // User tracking
                overview.userTracking.users.forEach(user => {
                    mqttClient.publish(`${config.mqttRootTopic}/${verisure_prefix}/tele/userTracking/STATE`, JSON.stringify(user));
                });

                // Event counts
                // TODO

                // Door/window report state
                mqttClient.publish(`${config.mqttRootTopic}/${verisure_prefix}/tele/doorWindowReportState/STATE`, overview.doorWindow.reportState.toString());

                // Door/window devices
                overview.doorWindow.doorWindowDevice.forEach(doorWindow => {
                    mqttClient.publish(`${config.mqttRootTopic}/${verisure_prefix}/tele/doorWindow/STATE`, JSON.stringify(doorWindow));
                });
            })
            .catch((error) => {
                console.error('Error 1: ', error);
            });



    } catch (err) {
        console.log('Error 2: ', err.message);
    }
}


// Pull data from Verisure API every 10 minutes
var interval = asyncInterval(async function (done) {
    // We only enter here one call at a time.
    var overview = await getVerisure();

    // After we finish our async function, let asyncInterval know
    // This will tell asyncInterval to schedule the next interval
    done();
}, 600000, 650000);


// optional timeout
interval.onTimeout(function () {
    console.log('XXXXXXXXXXXXXXXXXXXXXXXX')
    console.log('Timeout!');
    console.log('XXXXXXXXXXXXXXXXXXXXXXXX')
});