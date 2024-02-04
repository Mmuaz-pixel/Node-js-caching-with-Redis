const express = require('express');
const redis = require('redis');
const responseTime = require('response-time');

const app = express();

const redisClient = redis.createClient({
    host: '127.0.0.1',
    port: 6379
});

redisClient.connect().catch(console.error); 

app.use(responseTime()); // Capture response times

app.get('/rockets', async (req, res) => {
    try {
        const reply = await redisClient.get('rockets');
        if (reply) {
			console.log('using cached data'); 
            return res.json(JSON.parse(reply)); // Use res instead of response
        }
        const fetchResponse = await fetch('https://api.spacexdata.com/v3/rockets', {
			method: "GET"
		});
        if (!fetchResponse.ok) {
            throw new Error('Failed to fetch data from SpaceX API');
        }

        const responseData = await fetchResponse.json();
        await redisClient.set(
            'rockets',
            JSON.stringify(responseData),
            {
				EX: 10, // expires in 10 secs
				NX: true // only set key if it doesn't already exists
			}
        );
        res.json(responseData);
    } catch (error) {
        res.status(500).json({ error: error.message }); // Handle errors
    }
});

app.listen(5000, () => {
    console.log('App running on port 5000');
});
