# labs-authorization

A full-stack component providing authorization functionality, designed for use in Labs projects

## Database

Running the initial demo (first cut of the service) uses Postgres in a Docker running instance, which can be created with:

```
npm run pg:build
```

Note: In case you have issues building or running it with Docker make sure you have a recent version of docker engine and docker compose.

###Start Postgres in a Docker container

A Docker container with Postgres can be started with:
```
npm run pg:start
```

To see the running container and its ID:
```
docker ps
```

To connect to the running container:
```
docker exec -ti <container_id> <command>
```
e.g.
```
docker exec -ti e343edecaaa7 ls
docker exec -ti e343edecaaa7 bash
docker exec -ti e bash        // short container name
```

###Populate the database

The Authorization database, system user and initial tables
can be created by executing:

```
npm run pg:init
```

Test data can be added with:
```
npm run pg:load-test-data
```

Note: the scripts that initialize and load data into the database require you to have the Postgresql client installed on your machine.
Not needed to have the full Postgtresql database and dependencies installed.

###pgAdmin database access
As the Postgresql docker container has its 5432 port forwarded on the local machine the database can be accessed with pgAdmin.

To access the database using the pgAdmin you have to fill in also the container IP beside the database names and access credentials. The conainer IP can be seen with `docker ps`.


## Service

There is a basic service which will respond to a list users request:

    {role: 'authorization', cmd: 'list', type: 'users'}

with data in the form:

    [ { id: 1, name: 'Charlie Bucket' },
      { id: 2, name: 'Grandpa Joe' },
      { id: 3, name: 'Veruca Salt' },
      { id: 4, name: 'Willy Wonka' } ]

It also has a shutdown operation, which should be called when finished with the
service:

    {role: 'authorization', cmd: 'done'}

## API

There is a simple route for fetching all the users: http://localhost:8000/auth/users
Curl examples for the other routes can be found in services.js

To expose the reoute start both the service and the API with the following:

    node integration/service.js

    node integration/index.js

## Testing

Tests are supplied for the service interface and the Mu wiring (npm test)

## Security

Please ignore any security bad practices at the minute!
