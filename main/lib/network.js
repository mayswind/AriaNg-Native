'use strict';

const axios = require('axios').default;

const pkgfile = require('../../package');

const userAgent = 'AriaNg-Native/' + pkgfile.version;

axios.interceptors.request.use(function (config) {
    config.headers['User-Agent'] = userAgent;

    return config;
}, function (error) {
    return Promise.reject(error);
});

axios.interceptors.response.use(function (response) {
    return getFinalHttpResponse(response, true);
}, function (error) {
    return getFinalHttpResponse((error.response ? error.response : error), false);
});

let getFinalHttpResponse = function (response, success) {
    const finalResponse = {
        data: (response && response.data) ? response.data : null,
        status: (response && response.status) ? response.status : -1,
        statusText: (response && response.statusText) ? response.statusText : '',
        config: {}
    };

    if (response && response.config) {
        if (response.config.method) {
            finalResponse.config.method = response.config.method.toUpperCase();
        }

        finalResponse.config.url = response.config.url;
        finalResponse.config.timeout = response.config.timeout;

        try {
            finalResponse.config.data = JSON.parse(response.config.data);
        } catch (ex) {
            ; // Do Nothing
        }

        finalResponse.config.headers = response.config.headers;
    }

    return {
        success: success,
        response: finalResponse
    };
};

let requestHttp = function (requestContext) {
    const request = {
        url: requestContext.url,
        method: requestContext.method
    };

    if (requestContext.timeout) {
        request.timeout = requestContext.timeout;
    }

    if (requestContext.headers) {
        request.headers = requestContext.headers;
    }

    if (requestContext.method === 'POST') {
        request.data = requestContext.data;
    }

    return axios(request);
};

module.exports = {
    requestHttp: requestHttp
};
