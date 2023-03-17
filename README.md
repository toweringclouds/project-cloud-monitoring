# Cloud Monitoring

Cloud monitoring project comprised of web ui and api service

## Overview

This project aims to server monitoring platform on remote host or service.
It is recommended for startup or small-sized company.

### Main Features

- [2023. 03. ??] server push on periodical health check result via websocket (v0.2.0)
- [2023. 03. 17] port alive check on remote server or application by polling (v0.1.0)

### Running the server

1. web api service (backend-express)
   - update config.yml after redis server installation
   - update Servers.js or Applications.js in models folder
   - run test/test.js on bash-runnable commandline environment
   - run following commands with reference to scripts in package.json
   - open web browser and check swagger ui (localhost:50990/docs)

```
npm run setup (onetime)
npm start (every changed)
```

2. web ui service (frontend-vue2)
   - visit auth0 cloud (auth0.com) and register new auth0 account
   - add custom application and issue client credentials
   - update auth.json in src/services folder
   - run following commands with reference to scripts in package.json
   - open web browser and check dashboard ui (localhost:3000)

```
npm install
npm run serve
```
