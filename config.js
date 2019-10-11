require('dotenv').config();

// MTA
// Feed & station data in /data
// More info here: http://datamine.mta.info/list-of-feeds

// Citibike
// Station info: https://gbfs.citibikenyc.com/gbfs/en/station_information.json
module.exports = {
  mta: {
    stationChoices: [['D25N', 'Q'], ['D25N', 'B'], ['A44N', 'C']] // last letter indicates direction
  },
  citibike: {
    // If you are not seeing a station in the output, it is most likely because you entered an invalid ID
    departureStationIds: [
      '3558' // Bergen & Vanderbilt
    ],
    arrivalStationIds: [
      '3414', // Bergen & Flatbush
      '3416' // 7 Ave & Park Pl
    ]
  },
  emailRecipients: [process.env.OWNER_EMAIL],
  requestSettings: {
    method: 'GET',
    encoding: null,
    responseType: 'arraybuffer'
  }
};
