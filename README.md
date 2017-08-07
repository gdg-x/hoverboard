![preview-web](https://cloud.githubusercontent.com/assets/2954281/17777476/5dbbbe1c-6569-11e6-9cc4-77185ae9bf92.png)

# Project Hoverboard

[![Join the chat at https://gitter.im/gdg-x/hoverboard](https://badges.gitter.im/gdg-x/hoverboard.svg)](https://gitter.im/gdg-x/hoverboard?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

> Project Hoverboard is the next generation conference website template after
[Project Zeppelin](https://github.com/gdg-x/zeppelin) and more optimized
version - [Project Zeppelin-Grunt](https://github.com/gdg-x/zeppelin-grunt).

> Template is brought by [Oleh Zasadnyy](https://plus.google.com/+OlehZasadnyy)
from [GDG Lviv](http://lviv.gdg.org.ua/).

> *Do you :heart: it?* Show your support - please, :star: the project.

:zap: [Live demo](https://hoverboard-dev.firebaseapp.com/)

### Features
:white_check_mark: Polymer  
:white_check_mark: [PRPL pattern](https://www.polymer-project.org/1.0/toolbox/server)  
:white_check_mark: Offline access  
:white_check_mark: Material design  
:white_check_mark: Animations  
:white_check_mark: Integrated speakers and sessions management  
:white_check_mark: SEO friendly  
:white_check_mark: Optimized and fast  
:white_check_mark: Editable theme colors  
:white_check_mark: Quick deploy (with [Travis CI](/docs/tutorials/deploy.md))  
:white_check_mark: My schedule  
:white_check_mark: Firebase Data Loading :new:  
:white_check_mark: Sessions star rating :new:  

### Setup
:book: [Full documentation](/docs/).

##### Docker-based development environment

If you don't want to bother with the dependencies, you can use the docker container for development.

Build the docker image:

    docker build -t hoverboard .

and execute the commands associated to the docker env in the following documentation:

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

### Updating
Here is a git workflow for updating your fork (or downloaded copy) to the latest version:
```
git remote add upstream https://github.com/gdg-x/hoverboard.git
git fetch upstream
git merge upstream/master # OR git merge upstream/develop
# resolve the merge conflicts in your editor
git add . -u
git commit -m 'Updated to the latest version'
```

### Who uses the template?

Going to use the template? Go on! The only thing we ask - let us know with a
pull request, so we can include you in this list.

| | | |
|------|------|------|
| [GDG DevFest Ukraine](http://devfest.gdg.org.ua)                | [GDG DevFest Sao Paulo](http://sp.devfest.com.br)                           | [GDG DevFest Hamburg 2015](http://devfest.de)               |
| [GDG DevFest Mezam 2015](https://devfest-mezam.gdgbambili.xyz)  | [GDG DevFest Silicon Valley 2015](http://devfest2015.gdgsv.com/)            | [GDG DevFest Belgium 2015](http://devfest.be/)              |
| [GDG DevFest South East Nigeria 2015](http://www.devfestse.com) | [GDG DevFest Istanbul 2015](https://www.devfesttr.com)                      | [GDG Cáceres CodeWeek 2015](http://codeweek.gdgcaceres.es)  |
| [GDG Bingham University Website](http://bhu.gdg.ng)             | [Google I/O Extended 2016 Kuala Lumpur](https://ioxkl2016.firebaseapp.com)  | [GDG DevFest Hamburg 2016](https://hamburg.devfest.de)      |
| [GDG DevFest Mezam 2016](https://devfest-mezam.gdgbambili.xyz)  | [GDG DevFest Vietnam 2016](https://devfest.vn)                              | [GDG DevFest Seattle 2016](https://devfest.gdgseattle.org)  |
| [GDG DevFest Belgium 2016](https://devfest.be)                  | [GDG DevFest Lisbon 2016](https://devfestlisbon.firebaseapp.com)            | [GDG DevFest Sudbury 2016](https://devfest.gdgsudbury.ca)   |
| [GDG DevFest Hong Kong 2016](https://devfest.gdghk.org)         | [GDG DevFest London 2016](https://devfest-london-2016.firebaseapp.com/)     | [GDG DevFest Paraná 2016](https://devfestpr.org/)           |  
| [GDG DevFest Srilanka 2016](https://devfest16.gdgsrilanka.org/) | [GDG DevFest Incheon 2016](http://devfest16in.gdg.kr/)                      | [GDG Dschang 2016 Website](http://gdgdschang.com)           |
| [GDG DevFest Eskisehir 2016](https://df16.gdgeskisehir.com/)    | [GDG DevFest Poland 2016](https://devfest.pl/)                              | [GDG DevFest Pilsen 2016](https://devfest.cz/)              |
| [GDG DevFest Switzerland 2016](https://devfest.ch/)             | [GDG DevFest Toulouse 2016](https://devfesttoulouse.fr/)                    | [GDG Ohio DevFest](https://ohiodevfest.com/)                |
| [GDG DevFest NYC 2016](https://devfestnyc.com/)                 | [GDG DevFest Los Angeles 2016](https://devfest.gdgla.org/)                  | [GDG DevFest West](https://devfest2016.gdgsv.com)           |
| [GDG DevFest Florida 2016](https://devfestflorida.org)          | [GDG DevFest Madrid 2016](https://gdgmadrid.com)                            | [GDG DevFest SBA 2016](https://devfest.gdgsba.org/)         |
| [GDG Foumban Website](https://gdgfoumban.org)                   | [GDG DevFest Granada 2016](http://devfest.gdggranada.com/)                  | [GDG DevFest Taipei 2016](http://devfest.gdg-taipei.org/)   |
| [2016 Valley DevFest](https://valleydevfest.com)                | [IWDC 2017 Fresno (WTM)](https://iwdc.wtmfresno.com/)                       | [ngVikings 2017](https://ngvikings.org)                     |
| [Mobile Era 2017](https://mobileera.rocks)                      | [DevFest Nantes 2017](https://devfest.gdgnantes.com)                        | [GDG DevFest Hamburg 2017](https://hamburg.devfest.de/)     |


### Roadmap :rocket:
:x: Admin panel    
:x: Push notification  
:x: ES2015  
:x: Accessibility  
:x: Unit/Integration Tests  
:point_right: __Propose your feature with [creating an issue](https://github.com/gdg-x/hoverboard/issues/new)__

### Contributing

Project Hoverboard is still under development, and it is open for contributions.
Feel free to send PR. If you have any questions, feel free to contact
[Oleh Zasadnyy](https://plus.google.com/+OlehZasadnyy).

##### General workflow
1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Make your changes
4. Run the tests, adding new ones for your code if necessary
5. Commit your changes (`git commit -am 'Added some feature'`)
6. Push to the branch (`git push origin my-new-feature`)
7. Create new Pull Request

:book: Read complete [contributing guide](CONTRIBUTING.md).


### Contributors :sparkles:
See [list of contributors](https://github.com/gdg-x/hoverboard/graphs/contributors).

__Maintainer:__ [Oleh Zasadnyy](https://github.com/ozasadnyy) and [Sophie Huts](https://github.com/sophieH29).


###### The GDG App, GDG[x] are not endorsed and/or supported by Google, the corporation.


### License

Project is published under the [MIT license](https://github.com/gdg-x/hoverboard/blob/master/LICENSE.md).  
Feel free to clone and modify repo as you want, but don't forget to add reference to authors :)
