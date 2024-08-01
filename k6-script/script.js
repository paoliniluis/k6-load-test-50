import exec from 'k6/execution';
import http from 'k6/http'
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '5m', target: 60 }, // simulate ramp-up of traffic from 1 to 60 users over 5 minutes.
        { duration: '10m', target: 60 }, // stay at 60 users for 10 minutes
        { duration: '3m', target: 100 }, // ramp-up to 100 users over 3 minutes (peak hour starts)
        { duration: '2m', target: 100 }, // stay at 100 users for short amount of time (peak hour)
        { duration: '3m', target: 60 }, // ramp-down to 60 users over 3 minutes (peak hour ends)
        { duration: '10m', target: 60 }, // continue at 60 for additional 10 minutes
        { duration: '5m', target: 0 }, // ramp-down to 0 users
    ],
};

const host = __ENV.host
const payload = JSON.stringify({
    username: __ENV.user,
    password: __ENV.password,
});

const params = {
    headers: {
        'Content-Type': 'application/json',
    },
};

let sessionCookie = null;

export default function () {
    function logger (request_object) {
        console.log (`${request_object.request.method} ${request_object.request.url} ${request_object.status} took ${request_object.timings.duration} ms total`)
    }

    function checker(request_object) {
        if (
            !check(request_object, {
              'status code MUST be 200': (res) => res.status == 200 || res.status == 204 || res.status == 202,
            })
        ) {
            console.error(`${request_object.request.method} ${request_object.request.url} ${request_object.status} ${request_object.status_text}`)
            exec.test.abort('status code was *not* 200, 202 or 204');
        }
    }

    // Auth
    const jar = http.cookieJar();
    if (__ITER === 0) {
        // let jar = http.cookieJar();
        let res = http.post(`${host}/api/session`, payload, params)
        sessionCookie = res.cookies['metabase.SESSION'][0].value
        jar.set(host, 'metabase.SESSION', sessionCookie)
    }
    jar.set(host, 'metabase.SESSION', sessionCookie)

    console.log(`VU ${__VU} ITER ${__ITER} HOST ${host}`)

    sleep(1);

    let current = http.get(`${host}/api/user/current`, params)
    checker(current)
    logger(current)
    let properties = http.get(`${host}/api/session/properties`, params)
    checker(properties)
    logger(properties)

    let root = http.get(`${host}/api/collection/root`, params)
    checker(root)
    logger(root)
    
    let search = http.get(`${host}/api/search`, params)
    checker(search)
    logger(search)

    let database = http.get(`${host}/api/database`, params)
    checker(database)
    logger(database)

    let collection_tree = http.get(`${host}/api/collection/tree`, params)
    checker(collection_tree)
    logger(collection_tree)

    let bookmark = http.get(`${host}/api/bookmark`, params)
    checker(bookmark)
    logger(bookmark)

    let dashboard = http.get(`${host}/api/dashboard/8`, params)
    checker(dashboard)
    logger(dashboard)

    // v49
    // http.get(`${host}/api/table/card__76/query_metadata`, params)
    // http.get(`${host}/api/table/23/query_metadata`, params)
    // http.get(`${host}/api/table/28/query_metadata`, params)
    // http.get(`${host}/api/table/27/query_metadata`, params)
    http.get(`${host}/api/dashboard/8/params/1817812382/values`, params)

    // v50
    http.get(`${host}/api/dashboard/8/query_metadata`, params)
    sleep(1);
}