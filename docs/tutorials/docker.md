# Development in Docker container

For simpler development setup you can use Docker.

1. Install docker https://docs.docker.com/ (Follow the installation instructions for your platform)
2. Build the image `docker build -t hoverboard .`

Now you have prepared the local development environment!

Now you can run the project with local sources:

    docker run -it -v "$PWD":/app -p 8080:8080 hoverboard

or build the production version:

    docker run -v "$PWD":/app hoverboard polymer build

For the explanation of the commands and their modifications please refer to https://docs.docker.com/engine/reference/run
