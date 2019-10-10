const axios = require('axios');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const sendEmail = require('./emailSender');
const stations = require('./data/stations');
const citibikeStations = require('./data/citibike_stations');
const feedIds = require('./data/feeds');
const {
  mta: { stationChoices },
  citibike: { departureStationIds, arrivalStationIds },
  requestSettings
} = require('./config');
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
      feed.entity.forEach((train, i) => {
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
        .filter(e => e.waitTime >= 0)
        .sort((a, b) => a.waitTime - b.waitTime);
    })
    .catch(e => console.log(e));
};

// Fetch MTA data
Promise.all(stationChoices.map(e => getWaitTimes(...e)))
  .then(arr => {
    text += 'Subways\n';
    arr.forEach(el => {
      if (!el[0]) return;
      text += `${el[0].stationName}\n`;
      el.slice(0, 5).reduce(
        (acc, curr) => (text += `${curr.routeId} - ${curr.arrivalTime} (${curr.waitTime} mins)\n`),
        ''
      );
      text += '\n';
    });
    // Fetch Citibike data
    return axios.get('https://gbfs.citibikenyc.com/gbfs/en/station_status.json');
  })
  .then(res => {
    const { stations } = res.data.data;
    const departureStations = stations.filter(e => departureStationIds.includes(e.station_id));
    const arrivalStations = stations.filter(e => arrivalStationIds.includes(e.station_id));

    if (departureStations && arrivalStations) {
      let lastReported;
      text += 'Citibikes\n';

      const setLastReported = time => (!lastReported ? time : Math.min(time, lastReported));

      departureStations.forEach(station => {
        const stationName = citibikeStations[station.station_id];
        text += `Bikes available at ${stationName}: ${station.num_bikes_available}\n`;
        lastReported = setLastReported(station.last_reported);
      });

      arrivalStations.forEach(station => {
        const stationName = citibikeStations[station.station_id];
        text += `Docks available at ${stationName}: ${station.num_docks_available}\n`;
        lastReported = setLastReported(station.last_reported);
      });

      const oldestReportedTime = new Date(lastReported * 1000).toLocaleTimeString('en-US', {
        timeZone: 'America/New_York'
      });
      text += `Last updated at ${oldestReportedTime}`;
    }
    console.log(text);
    // Generate email
    sendEmail('Commute Info', text);
  });
