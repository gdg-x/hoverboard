# Development in Docker container
For running the website directly from a container you can use Docker

## Set up 

1. Install docker https://docs.docker.com/ (Follow the installation instructions for your platform)
1. Clone this repository `git clone https://github.com/gdg-x/hoverboard.git`.
1. Build the image `docker build -t hoverboard .`
1. Install dependencies `docker run -v "$PWD":/app hoverboard npm install`
1. Run the website from Docker container `docker run -it -p 3000:3000 -p 3001:3001 -v "$PWD":/app hoverboard`

## For specific dev commands, you can run those from container : 

Install all dependencies from docker command line :

    docker run -it -v "$PWD":/app hoverboard npm install
    
Run the site from the container : 

    docker run -it -p 3000:3000 -p 3001:3001 -v "$PWD":/app hoverboard npm run serve

Build the development version:

    docker run -it -v "$PWD":/app hoverboard npm run build

Build the production version:

    docker run -it -v "$PWD":/app hoverboard npm run build:prod

For the explanation of the commands and their modifications please refer to https://docs.docker.com/engine/reference/run
