# Changelog

## Version 1.4.1

* Updated dependencies.

## Version 1.4.0

* Updated dependencies.
* Verisure now offers 2-factor authentication. This however doesn't work well with a tool like this one. For now you'll have to keep using username/pwd if you want to keep pulling your data from Verisure's system. Hopefully they will at some point offer app-specific tokens similar to how for example GitHub does things.

## Version 1.3

* Updated dependencies.
* Verisure's API has changed and now returns different fields vs earlier. Adapt to the new reality and extract what information is available.
* Create separate changelog file.
* A bit improved error handling.

## Version 1.2

* Updated dependencies.
* Switched to using Drone for building Docker images.
* Slight change in version numbers of images available on Docker Hub.
* Docker image now based on Node.js v12 (was using v8 previously).

## Version 1.1

* Added support for door lock state (thanks André!).
* Move to use docker-compose 3.3. Minor changes in docker-compose.yml file.

## Version 1.0

* First release.
