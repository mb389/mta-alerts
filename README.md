This is a tool to receive notifications of wait times for various MTA train lines as well as Citibike bike/dock availability.

You'll need to provide a Mailjet key & secret in the `.env` file to use the emailSender or hook up your own email sending functionality. You'll also need to provide an MTA API key.

Use `config.js` to input your configs. MTA station codes can be found in `/data/mta_stations.json` and Citibike station codes can be found at `https://gbfs.citibikenyc.com/gbfs/en/station_information.json`. You can leave the arrays empty if you don't wish to receive information for any of options.
