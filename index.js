const axios = require('axios');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const sendEmail = require('./emailSender');
const stations = require('./data/stations');
const feedIds = require('./data/feeds');
const { stationChoices, requestSettings } = require('./config');
require('dotenv').config();

const now = Date.now();

const getWaitTimes = (stationId, route) => {
  const collectedTimes = [];
  var request = {
    ...requestSettings,
    url: `http://datamine.mta.info/mta_esi.php?key=${process.env.MTA_KEY}&feed_id=${feedIds[route]}`
  };
  let stationName;
  const stationDetail = stations.find(e => e['GTFS Stop ID'] == stationId.slice(0, -1));
  if (stationDetail) {
    stationName = stationDetail['Stop Name'];
  }
  return axios(request)
    .then(res => {
      const feed = GtfsRealtimeBindings.FeedMessage.decode(res.data);
      feed.entity.forEach(train => {
        if (train.trip_update) {
          const arrivalTimes = train.trip_update.stop_time_update;
          arrivalTimes.forEach(el => {
            if (el.stop_id === stationId) {
              const routeId = train.trip_update.trip.route_id;
              const timeData = el.arrival;
              const uniqueTime = timeData.time.low;
              if (uniqueTime) {
                collectedTimes.push({ routeId, time: uniqueTime });
              }
            }
          });
        }
      });
      return collectedTimes
        .map(({ routeId, time }) => ({
          stationName,
          routeId,
          arrivalTime: new Date(time * 1000).toLocaleTimeString('en-US', {
            timeZone: 'America/New_York'
          }),
          waitTime: Math.ceil((time - now / 1000) / 60)
        }))
        .sort((a, b) => a.waitTime - b.waitTime);
    })
    .catch(e => console.log(e));
};

Promise.all(stationChoices.map(e => getWaitTimes(...e))).then(arr => {
  let text = '';
  arr.forEach(el => {
    text += el[0].stationName + '\n';
    el.slice(0, 5).reduce(
      (acc, curr) => (text += curr.routeId + ' - ' + curr.arrivalTime + '\n'),
      ''
    );
    text += '\n';
  });
  console.log(text);
  sendEmail('Upcoming Trains', text);
});
