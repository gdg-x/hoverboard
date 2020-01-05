# Deploy to Firebase

1. Create [Firebase account](https://console.firebase.google.com) and login into [Firebase CLI](https://firebase.google.com/docs/cli/):
    ```console
      npx firebase login
    ```

1.  Build with `/config/development.json`
    ```console
      npm run build
    ```

    or with `/config/production.json`
    ```console
      npm run build:prod
    ```

1.  Deploy
    ```console
      npx firebase deploy
    ```

The URL to your live site is listed in the output.

### Continuous integration with Travis CI

In the root folder, you can find [.travis.yml](/.travis.yml) which configures
[Travis CI][Travis CI] build and deployment on Firebase hosting:

```yaml
...
 - provider: firebase
   skip_cleanup: true
   on:
     branch: master      # on which branch trigger build
   project: hoverboard   # Firebase project name
   token:
     secure: Quq/Ys1GKDYFjqMCD107saKj005L0RaM7Ian9yLIW/er4KdMzwjYw7TVXmtMeJPIfEy/e2/4WJ63K1SaXieBoFndoUcpGWqPOoTrnkkj5K7tzeZKM32XqIarF+BNmOoqW5M7+kuN8L7N3RLp00ywFDOgKgiZJeoaDV6sIRRAIFVh+xHWabVWpFCwCUSeBZpufOsZhMXkicyRe0XhMmkUvS1P5CI3AyZZdIfWG+sguFsPOWRjMFKWrbnsilDFDjf7N0Wd8Z1H2Z0LBn/V00bNb95MSIuOhkdk3a1wP0P5Eollet+Y8g+NpdWyFq0/C+6+ECvFLBjtvbtMY1BVfdxkCo5XlogZx31OmkMWVX6PXOD5Va8aFoJnwvjovUT8oZbSCWEuyMxI91jDsLxXZt542MNfUfQ1Q2+SpUShdcRlwoV2c/XOYvme95HnI1LSqzLubooKWxz8wpa/aovkdZbum54t/z5nA54AXN1lYKsi+hcAFHOeucqd/kHOLG0bx05Ev86wcvNH8qGx+v7S644YH37No7PGnKU3g3Jq/m6quo1B/bMEIaatVnR40D301wAi8tsNWnqEdWFKnAlGrTIDd1qek9OHnApmgBQI8o0FOy6WbzLMwl9PnMl+t+wew/ggSY0IdWhjFWR/S1d6xML8cYHXHVpE0wxkat5ETbIYXlg=
```

To generate the `secure` value do the following steps:

1. Log in to Firebase console
    ```console
      npx firebase login:ci --interactive
    ```

    You will get your token:
    ```console
        ✔  Success! Use this token to log in on a CI server:

        1/9YmsNEh87G3cRyt_FXQbsYI_uV4FUMmUBXkbl_CHANGED
    ```

1. Install travis tool to encrypt the token
    ```console
      gem install travis
    ```

1. Log in to your account
    ```console
      travis login --auto
    ```

1. Encrypt your token
    ```console
      travis encrypt "1/9YmsNEh87G3cRyt_FXQbsYI_uV4FUMmUBXkbl_CHANGED"
    ```

    Approximate output:
    ```console
      secure: "cioDQ571EZpnuGiDn7ofvEghNFP82vz7N+SqIL5ZjOK0CBgaWO3OoePoh1eO1dvIsdLDr7yNs5kBIx8NIuOqUA9YLyIIasC7ah1QLtiK5zRVaCcgwt4aBqRLKJVbXPl08MIyk9GFYl2+J+oLOzoEOnVUuCpUcGYWdmDRTKis5KP6naK1msRmTu5ymQn55cyxpmSZS2F+iEsAgV7d0/h+HGgPPd77M26j8wV9JEFJp3iMhudaCkWdoBf9z9WP0cpPzTHgSHEU/Mski4oMfU1BqCFRiaKfcw/uLzMcTpjcf+YG2dc3qTMcuBNKNvhANnaYrxePtuW1VWb+xl19qVQWrsGpQgyWIbp+icSXF3KGR1wfNrC9zNQWKm112BckYn6id8w4M3JeRdWRaCwWitG9C5CWQ3ZepPpgBu2SYSfZQg5heIbVSYOgbXUfeR8ByJqyAGCrYrB3lyyR49cr+GAnILbOgxE7FRYuHmagLD+xa8cHUFcZUu6CxgrhOFa+28Lvrtvod1WqbIioZfhWRcdIZNdJxR4gxXaGycp5n0qjJ0o1VDFAUcy93ImYyVZFY+OmqfVLFQChAD9NnPT1a0v3gHYR3IMd5aXXtbOo9e6cAjuXU/NQCry10Y0bNiMKkHbvnj3aGfAWlA34CRj3iOK2Nz1udDwBMdUKsgt1xiVh3h8="
    ```

1. Replace generated encrypted token with existing one

1. **Tip:** deploy different builds depending on the branch:
    ```yaml
      script:
       - echo "Building..."
       - if [ "$TRAVIS_BRANCH" == "develop" ]; then npm run build; fi
       - if [ "$TRAVIS_BRANCH" == "master" ]; then npm run build:prod; fi
    ```
1. Push to a repository

1. Enjoy

[Travis CI]: https://travis-ci.com/
