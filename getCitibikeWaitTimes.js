const axios = require('axios');
const citibikeStations = require('./data/citibike_stations');
const {
  citibike: { departureStationIds, arrivalStationIds }
} = require('./config');

const CITIBIKE_API_URL = 'https://gbfs.citibikenyc.com/gbfs/en/station_status.json';

module.exports = text => {
  if (!departureStationIds.length && !arrivalStationIds.length) {
    return Promise.resolve(text);
  }
  return axios.get(CITIBIKE_API_URL).then(res => {
    const { stations } = res.data.data;
    const departureStations = stations.filter(e => departureStationIds.includes(e.station_id));
    const arrivalStations = stations.filter(e => arrivalStationIds.includes(e.station_id));

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

    return text;
  });
};
