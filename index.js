const axios = require('axios');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const sendEmail = require('./emailSender');
const stations = require('./stations');
require('dotenv').config();

const feedIds = {
  1: '1',
  2: '1',
  3: '1',
  4: '1',
  5: '1',
  6: '1',
  S: '1',
  L: '2',
  A: '26',
  C: '26',
  E: '26',
  H: '26',
  S: '26',
  N: '16',
  Q: '16',
  R: '16',
  W: '16',
  B: '21',
  D: '21',
  F: '21',
  M: '21',
  G: '31',
  J: '36',
  Z: '36',
  7: '51',
}

const now = Date.now();

const getWaitTimes = (stationId, route) => {
  const collectedTimes = [];
  const url = `http://datamine.mta.info/mta_esi.php?key=${process.env.MTA_KEY}&feed_id=${feedIds[route]}`;
  var requestSettings = {
    method: 'GET',
    url,
    encoding: null,
    responseType: 'arraybuffer'
  };
  let stationName;
  const stationDetail = stations.find(e => e["GTFS Stop ID"] == stationId.slice(0, -1));
  if (stationDetail) {
    stationName = stationDetail["Stop Name"];
  }
  return axios(requestSettings)
    .then((res) => {
      const feed = GtfsRealtimeBindings.FeedMessage.decode(res.data);
      feed.entity.forEach((train) => {
        if (train.trip_update) {
          const arrivalTimes = train.trip_update.stop_time_update;
          arrivalTimes.forEach((el) => {
            if (el.stop_id === stationId) {
              const routeId = train.trip_update.trip.route_id;
              const timeData = el.arrival;
              const uniqueTime = timeData.time.low;
              if (uniqueTime) {
                collectedTimes.push({ routeId, time: uniqueTime });
              }
            }
          })
        }
      });
      return collectedTimes
        .map(({ routeId, time }) => ({ stationName, routeId, waitTime: Math.ceil((time - now/1000)/60) }))
        .sort((a, b) => a.waitTime - b.waitTime)
    })
    .catch((e) => console.log(e));
}

const choices = [['A44N', 'C'], ['236N', '2']];

Promise.all(choices.map(e => getWaitTimes(...e)))
  .then((arr) => {
    let text = '';
    arr.forEach(el => {
      text += el[0].stationName + '\n';
      el.reduce((acc, curr) => text += curr.routeId + ' ' + curr.waitTime + ' mins \n', '');
      text += '\n';
    });
    sendEmail('Train Wait Times', text);
  })

