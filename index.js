const axios = require('axios');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
require('dotenv').config();

const feedId = 2;
const url = `http://datamine.mta.info/mta_esi.php?key=${process.env.MTA_KEY}&feed_id=${feedId}`;

var requestSettings = {
  method: 'GET',
  url,
  encoding: null,
  responseType: 'arraybuffer'
};

axios(requestSettings)
  .then((res) => {
    const feed = GtfsRealtimeBindings.FeedMessage.decode(res.data);
    feed.entity.forEach(function(entity) {
      if (entity.trip_update) {
        console.log(entity.trip_update);
      }
    });
  })
  .catch((e) => console.log(e));
