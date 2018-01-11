Project Hoverboard 2
--------
```
Project Hoverboard 2 is the next generation conference website template full
```

![preview-web](https://cloud.githubusercontent.com/assets/2954281/17777476/5dbbbe1c-6569-11e6-9cc4-77185ae9bf92.png)
> Template is brought by [GDG Lviv team](http://lviv.gdg.org.ua/).

> *Do you :heart: it?* Show your support - please, :star: the project.

:zap: [Live demo](https://hoverboard-v2-dev.firebaseapp.com/)

Install
--------
```
npm install
```
```
 npm run serve
 ```    
or you can install with Docker container: 
```
docker build -t hoverboard .
```
``` 
docker run -v "$PWD":/app hoverboard npm install
```
:book: Read more in [docker docs](/docs/tutorials/docker.md).

:book: [Full documentation](/docs/).


Build & Deploy
--------
This command performs HTML, CSS, and JS minification on the application
dependencies, and generates a service-worker.js file with code to pre-cache the
dependencies based on the entrypoint and fragments specified in `polymer.json`.
The minified files are output to the `build`.

    npm run build

Or you can build in Docker container:

    docker run -v "$PWD":/app hoverboard npm run build

:book: Read more in [deploy docs](/docs/tutorials/deploy.md).   


Compatibility
--------
:white_check_mark: Compatible with latest two version of Chrome, Chrome for Android, Firefox, Opera, Safari, Edge.

:x: IE and Opera Mini aren't supported.


Contributors :sparkles:
--------
See [list of contributors](https://github.com/gdg-x/hoverboard/graphs/contributors).

__Maintainer:__ [Oleh Zasadnyy](https://github.com/ozasadnyy) and [Sophie Huts](https://github.com/sophieH29).


###### The GDG App, GDG[x] are not endorsed and/or supported by Google, the corporation.


License
--------

Project is published under the [MIT license](https://github.com/gdg-x/hoverboard/blob/master/LICENSE.md).  
Feel free to clone and modify repo as you want, but don't forget to add reference to authors :)
