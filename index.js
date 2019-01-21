const axios = require('axios');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const sendEmail = require('./emailSender');
const stations = require('./data/stations');
const feedIds = require('./data/feeds');
const { stationChoices, requestSettings } = require('./config');
require('dotenv').config();

const now = Date.now();
let text = '';

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

Promise.all(stationChoices.map(e => getWaitTimes(...e)))
  .then(arr => {
    text += 'Subways\n';
    arr.forEach(el => {
      text += `${el[0].stationName}\n`;
      el.slice(0, 5).reduce((acc, curr) => (text += `${curr.routeId} - ${curr.arrivalTime}\n`), '');
      text += '\n';
    });
    // Citibike data
    return axios.get('https://gbfs.citibikenyc.com/gbfs/en/station_status.json');
  })
  .then(res => {
    const { stations } = res.data.data;
    const bergenAndVanderbilt = stations.find(e => e.station_id === '3558');
    const bergenAndFlatbush = stations.find(e => e.station_id === '3414');
    if (bergenAndFlatbush && bergenAndVanderbilt) {
      text += 'Citibikes\n';
      text += `Bikes available at Bergen & Vanderbilt: ${
        bergenAndVanderbilt.num_bikes_available
      }\n`;
      text += `Docks available at Bergen & Flatbush: ${bergenAndFlatbush.num_docks_available}\n`;
      const oldestReportedTime = new Date(
        Math.min(bergenAndVanderbilt.last_reported, bergenAndFlatbush.last_reported) * 1000
      ).toLocaleTimeString('en-US', {
        timeZone: 'America/New_York'
      });
      text += `Last updated at ${oldestReportedTime}`;
    }
    console.log(text);
    sendEmail('Commute Info', text);
  });
