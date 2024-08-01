Metabase performance testing w/K6 on v50
=======
Contents of this docker-compose

Load testing of Metabase. 

## Components

- Metabase is exposed through port 3000
- App DB (PosgreSQL) is exposed through port 5432
- Data DB (PosgreSQL) is exposed through port 5433
- A python container that initializes Metabase by adding a@b.com / metabot1 as the user/pass, adds the data db and deletes the H2 sample DB
- K6 running on a container that will start when the previous container finishes

## Performance considerations:

1) Metabase App is resource constrained on CPU in order to see how many concurrent users can sustain on the load testing
2) App DB has more than enough resources to sustain the load, also Metabase has MB_DISABLE_SESSION_THROTTLE and MB_APPLICATION_DB_MAX_CONNECTION_POOL_SIZE defaults changed

Mac users: you need to follow the same pattern as in https://github.com/paoliniluis/postgres-metabase-stack-m1, and bundle Metabase inside a aarch64 image, till we can ship an ARM container image

## IMPORTANT: INITIALIZATION

1) start the stack via "docker compose up" but stop the k6 container as the instance initializes empty
2) go to metabase (localhost:3000), authenticate with a@b.com/metabot1 and create a model with orders+people+products+reviews table
3) do an x-ray on this model
4) save the x-ray (it should be ID 8)
5) then start the k6 container
6) you should be able to monitor the load on localhost:3030 (grafana) -> dashboards -> main