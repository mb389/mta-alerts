const axios = require('axios');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const mtaStations = require('./data/mta_stations');
const feedIds = require('./data/feeds');
const {
  mta: { stationChoices },
  requestSettings
} = require('./config');
require('dotenv').config();

const now = Date.now();

const fetchTimes = (stationId, route) => {
  const collectedTimes = [];
  var request = {
    ...requestSettings,
    url: `http://datamine.mta.info/mta_esi.php?key=${process.env.MTA_KEY}&feed_id=${feedIds[route]}`
  };
  let stationName;
  const stationDetail = mtaStations.find(e => e['GTFS Stop ID'] == stationId.slice(0, -1));
  if (stationDetail) {
    stationName = stationDetail['Stop Name'];
  }
  return axios(request)
    .then(res => {
      const feed = GtfsRealtimeBindings.FeedMessage.decode(res.data);
      feed.entity.forEach(entity => {
        if (entity.trip_update) {
          const arrivalTimes = entity.trip_update.stop_time_update;
          arrivalTimes.forEach(e => {
            if (e && e.stop_id === stationId) {
              const routeId = entity.trip_update.trip.route_id;
              const time = e.arrival.time.low;
              if (routeId && time) {
                collectedTimes.push({ routeId, time });
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
        .filter(e => e.waitTime >= 0)
        .sort((a, b) => a.waitTime - b.waitTime);
    })
    .catch(e => console.log(e));
};

module.exports = () => {
  let text = '';
  const errors = [];
  if (!stationChoices || !stationChoices.length) {
    return Promise.resolve(text);
  }
  return Promise.all(stationChoices.map(e => fetchTimes(...e))).then(arr => {
    if (arr.length) {
      text += 'Subways\n';
      arr.forEach((e, i) => {
        if (!e || !e[0]) {
          errors.push(stationChoices[i]);
        } else {
          text += `${e[0].stationName}\n`;
          e.slice(0, 5).reduce(
            (acc, curr) =>
              (text += `${curr.routeId} - ${curr.arrivalTime} (${curr.waitTime} mins)\n`),
            ''
          );
        }
        text += '\n';
      });
    }
    if (errors.length) {
      text += `\nThere were problems with the following inputs: ${errors
        .map(e => `[${e}]`)
        .join(', ')}\n\n`;
    }
    return text;
  });
};
