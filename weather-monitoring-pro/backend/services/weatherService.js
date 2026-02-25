const axios = require('axios');

const getWeatherByCity = async (city) => {
    // Basic validation
    if (!city) {
        throw new Error('City name is required');
    }

    try {
        const response = await axios.get(`http://api.weatherstack.com/current`, {
            params: {
                access_key: process.env.WEATHERSTACK_API_KEY,
                query: city
            }
        });

        if (response.data.error) {
            throw new Error(response.data.error.info || 'Weather API Error');
        }

        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error?.info || error.message);
    }
};

module.exports = {
    getWeatherByCity
};
