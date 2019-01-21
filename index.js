const axios = require('axios');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
require('dotenv').config();

// feed IDs
// 1 = 1,2,3,4,5,6,S
// 2 = L
// 26 = A,C,E,H,S (Franklin Ave. Shuttle)
// 16 = N,Q,R,W
// 21 = B,D,F,M
// 31 = G
// 36 = J,Z
// 51 = 7
const now = Date.now();
const feedId = 21;
const url = `http://datamine.mta.info/mta_esi.php?key=${process.env.MTA_KEY}&feed_id=${feedId}`;

var requestSettings = {
  method: 'GET',
  url,
  encoding: null,
  responseType: 'arraybuffer'
};

const getWaitTimes = (stationId) => {
  const collectedTimes = [];
  return axios(requestSettings)
    .then((res) => {
      const feed = GtfsRealtimeBindings.FeedMessage.decode(res.data);
      feed.entity.forEach((train) => {
        if (train.trip_update) {
          const routeId = train.trip_update.trip.route_id;
          const arrivalTimes = train.trip_update.stop_time_update;
          arrivalTimes.forEach((el) => {
            if (el.stop_id === stationId) {
              timeData = el.arrival;
              uniqueTime = timeData.time.low;
              if (uniqueTime) {
                collectedTimes.push({ routeId, time: uniqueTime });
              }
            }
          })
        }
      });
      return collectedTimes;
    })
    .catch((e) => console.log(e));
}

const waitTimes = getWaitTimes('D21S')
  .then(times => {
    times.map(({ routeId, time }) => ({ routeId, waitTime: Math.round((time - now/1000)/360) }));
  });


  console.log(waitTimes)
