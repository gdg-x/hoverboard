![preview-web](https://cloud.githubusercontent.com/assets/2954281/17777476/5dbbbe1c-6569-11e6-9cc4-77185ae9bf92.png)

# Project Hoverboard 2


> Template is brought by [GDG Lviv team](http://lviv.gdg.org.ua/).

> *Do you :heart: it?* Show your support - please, :star: the project.

:zap: [Live demo](https://hoverboard-v2-dev.firebaseapp.com/)

### Setup
:book: [Full documentation](/docs/).

##### Docker based development env

If you don't want to bother with the dependencies, you can develop in the docker container.

Build the docker image :

    docker build -t hoverboard .

and execute the commands associated to the docker env in the following documentation

:book: Read more in [docker docs](/docs/tutorials/docker.md).

:point_right: **[Fork](https://github.com/gdg-x/hoverboard/fork) this repository** and clone it locally.

##### Install dependencies

    npm install
    
Or you can install with Docker container: 
     
    docker run -v "$PWD":/app hoverboard npm install 

##### Start the development server

This command serves the app at `http://localhost:3000` and provides basic URL
routing for the app:

    npm run serve
    
Or you can serve Docker container:

    docker run -v "$PWD":/app hoverboard

:book: Read more in [setup docs](/docs/tutorials/set-up.md).


### Build

This command performs HTML, CSS, and JS minification on the application
dependencies, and generates a service-worker.js file with code to pre-cache the
dependencies based on the entrypoint and fragments specified in `polymer.json`.
The minified files are output to the `build`.

    npm run build

Or you can build in Docker container:

    docker run -v "$PWD":/app hoverboard npm run build

:book: Read more in [deploy docs](/docs/tutorials/deploy.md).   

### Compatibility
:white_check_mark: Chrome 60, Chrome for Android 62 and higher

:white_check_mark: Firefox 57 and higher

:white_check_mark: Opera 47 and higher

:white_check_mark: Safari 10.1, iOS Safari 10.3 and higher

:white_check_mark: Edge 17 and higher

:x: IE 11

:x: Opera Mini


### Contributors :sparkles:
See [list of contributors](https://github.com/gdg-x/hoverboard/graphs/contributors).

__Maintainer:__ [Oleh Zasadnyy](https://github.com/ozasadnyy) and [Sophie Huts](https://github.com/sophieH29).


######The GDG App, GDG[x] are not endorsed and/or supported by Google, the corporation.


### License

Project is published under the [MIT license](https://github.com/gdg-x/hoverboard/blob/master/LICENSE.md).  
Feel free to clone and modify repo as you want, but don't forget to add reference to authors :)
