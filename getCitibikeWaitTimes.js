const axios = require('axios');
const {
  citibike: { departureStationIds, arrivalStationIds }
} = require('./config');

const CITIBIKE_STATION_STATUS_URL = 'https://gbfs.citibikenyc.com/gbfs/en/station_status.json';
const CITIBIKE_STATION_INFO_URL = 'https://gbfs.citibikenyc.com/gbfs/en/station_information.json';

module.exports = text => {
  if (
    !departureStationIds ||
    !arrivalStationIds ||
    !departureStationIds.length ||
    !arrivalStationIds.length
  ) {
    return Promise.resolve(text);
  }
  const requests = [axios.get(CITIBIKE_STATION_INFO_URL), axios.get(CITIBIKE_STATION_STATUS_URL)];
  return Promise.all(requests).then(([stationInfo, stationStatus]) => {
    const info = stationInfo.data.data.stations;
    const { stations } = stationStatus.data.data;
    const departureStations = stations.filter(e => departureStationIds.includes(e.station_id));
    const arrivalStations = stations.filter(e => arrivalStationIds.includes(e.station_id));

    let lastReported;
    text += 'Citibikes\n';

    const setLastReported = time => (!lastReported ? time : Math.min(time, lastReported));

    departureStations.forEach(station => {
      const singleStation = info.find(e => e.station_id === station.station_id);
      if (!singleStation) return;
      text += `Bikes available at ${singleStation.name}: ${station.num_bikes_available}\n`;
      lastReported = setLastReported(station.last_reported);
    });

    arrivalStations.forEach(station => {
      const singleStation = info.find(e => e.station_id === station.station_id);
      if (!singleStation) return;
      text += `Docks available at ${singleStation.name}: ${station.num_docks_available}\n`;
      lastReported = setLastReported(station.last_reported);
    });

    const oldestReportedTime = new Date(lastReported * 1000).toLocaleTimeString('en-US', {
      timeZone: 'America/New_York'
    });
    text += `Last updated at ${oldestReportedTime}`;

    return text;
  });
};
