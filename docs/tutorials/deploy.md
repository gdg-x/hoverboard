# Deploy to Firebase

Firebase is a very simple and secure way to deploy a Hoverboard site. 
You can sign up for a free account and deploy your application in less than 5 minutes.

The instructions below are based on the [Firebase quick start][Firebase quick start].

1.  [Sign up for a Firebase account][Firebase console]

1.  Install the Firebase command line tools

        npm install -g firebase-tools

    The `-g` flag instructs `npm` to install the package globally so that you
    can use the `firebase` command from any directory. You may need
    to install the package with `sudo` privileges.

1.  `cd` into your project directory

1.  Inititalize the Firebase application

        firebase init

    Running the firebase init command creates a firebase.json settings file 
    in the root of your project directory. Otherwise, go to
    [Firebase console][Firebase console] to create a new app.
    
1.  When you initialize your app, you will be prompted for a directory to 
    use as the public root (default is "public"). Enter `build/bundled` 
    or `build/unbundled` (supports HTTP/2). `build` contains everything 
    your application needs to run.

1.  Edit firebase.json, change firebase name, and add `rewrites` section 
([see example firebase.json](/docs/firebase.json)).

1.  Build

        npm run build

1.  Deploy

        firebase deploy

    The URL to your live site is listed in the output.
    

### Continuous integration with Travis CI
In the root folder you can find [.travis.yml](/.travis.yml) which configures
[Travis CI][Travis CI] build and deployment on Firebase hosting:
```
... 
 - provider: firebase
   skip_cleanup: true
   on:
     branch: master      # on which branch trigger build
   project: hoverboard   # Firebase project name
   token:
     secure: Quq/Ys1GKDYFjqMCD107saKj005L0RaM7Ian9yLIW/er4KdMzwjYw7TVXmtMeJPIfEy/e2/4WJ63K1SaXieBoFndoUcpGWqPOoTrnkkj5K7tzeZKM32XqIarF+BNmOoqW5M7+kuN8L7N3RLp00ywFDOgKgiZJeoaDV6sIRRAIFVh+xHWabVWpFCwCUSeBZpufOsZhMXkicyRe0XhMmkUvS1P5CI3AyZZdIfWG+sguFsPOWRjMFKWrbnsilDFDjf7N0Wd8Z1H2Z0LBn/V00bNb95MSIuOhkdk3a1wP0P5Eollet+Y8g+NpdWyFq0/C+6+ECvFLBjtvbtMY1BVfdxkCo5XlogZx31OmkMWVX6PXOD5Va8aFoJnwvjovUT8oZbSCWEuyMxI91jDsLxXZt542MNfUfQ1Q2+SpUShdcRlwoV2c/XOYvme95HnI1LSqzLubooKWxz8wpa/aovkdZbum54t/z5nA54AXN1lYKsi+hcAFHOeucqd/kHOLG0bx05Ev86wcvNH8qGx+v7S644YH37No7PGnKU3g3Jq/m6quo1B/bMEIaatVnR40D301wAi8tsNWnqEdWFKnAlGrTIDd1qek9OHnApmgBQI8o0FOy6WbzLMwl9PnMl+t+wew/ggSY0IdWhjFWR/S1d6xML8cYHXHVpE0wxkat5ETbIYXlg=
```

To generate secure do next steps:

1. Login into Firebase console

        firebase login:ci

    You will get your token:
   
        ✔  Success! Use this token to login on a CI server:

        1/9YmsNEh87G3cRyt_FXQbsYI_uV4FUMmUBXkbl_CHANGED
   
1. Install travis tool to encrypt token

        gem install travis
        
1. Login into your account

        travis login --auto
        
1. Encrypt your token

        travis encrypt "1/9YmsNEh87G3cRyt_FXQbsYI_uV4FUMmUBXkbl_CHANGED"

    Approximate output:
  
        secure: "cioDQ571EZpnuGiDn7ofvEghNFP82vz7N+SqIL5ZjOK0CBgaWO3OoePoh1eO1dvIsdLDr7yNs5kBIx8NIuOqUA9YLyIIasC7ah1QLtiK5zRVaCcgwt4aBqRLKJVbXPl08MIyk9GFYl2+J+oLOzoEOnVUuCpUcGYWdmDRTKis5KP6naK1msRmTu5ymQn55cyxpmSZS2F+iEsAgV7d0/h+HGgPPd77M26j8wV9JEFJp3iMhudaCkWdoBf9z9WP0cpPzTHgSHEU/Mski4oMfU1BqCFRiaKfcw/uLzMcTpjcf+YG2dc3qTMcuBNKNvhANnaYrxePtuW1VWb+xl19qVQWrsGpQgyWIbp+icSXF3KGR1wfNrC9zNQWKm112BckYn6id8w4M3JeRdWRaCwWitG9C5CWQ3ZepPpgBu2SYSfZQg5heIbVSYOgbXUfeR8ByJqyAGCrYrB3lyyR49cr+GAnILbOgxE7FRYuHmagLD+xa8cHUFcZUu6CxgrhOFa+28Lvrtvod1WqbIioZfhWRcdIZNdJxR4gxXaGycp5n0qjJ0o1VDFAUcy93ImYyVZFY+OmqfVLFQChAD9NnPT1a0v3gHYR3IMd5aXXtbOo9e6cAjuXU/NQCry10Y0bNiMKkHbvnj3aGfAWlA34CRj3iOK2Nz1udDwBMdUKsgt1xiVh3h8="

1. Replace generated encrypted token with existing one

1. Push to a branch

1. Enjoy

[Firebase quick start]: https://firebase.google.com/docs/hosting/quickstart
[Firebase console]: https://firebase.google.com/console/
[Travis CI]: https://travis-ci.com/
