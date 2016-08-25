A progressive web application takes advantage of the latest technologies to **combine the best of web and mobile apps**. Think of it as a website built using web technologies but that acts and feels like an app. Recent advancements in the browser and in the availability of service workers and in the Cache and Push APIs have enabled web developers to allow users to install web apps to their home screen, receive push notifications and even work offline.

<div class="highlight-blockquote"> *Originally proposed by Google in 2015, Progressive Web Apps have already attracted a lot of attention because of the relative ease of development and the almost instant wins for the application’s user experience.* </div>

Progressive web apps take advantage of the much larger web ecosystem, plugins and community and the relative ease of deploying and maintaining a website when compared to a native application in the respective app stores. For those of you who develop on both mobile and web, you’ll appreciate that a website can be built in less time, that an API does not need to be maintained with backwards-compatibility (all users will run the same version of your website’s code, unlike the version fragmentation of native apps) and that the **app will generally be easier to deploy and maintain**.

Why Progressive Web Apps?
-------------------------

<div class="highlight-blockquote"> *A study has shown that, on average, an [app loses 20%](http://blog.gaborcselle.com/2012/10/every-step-costs-you-20-of-users.html) of its users for every step between the user’s first contact with the app and the user starting to use the app.* </div>

A user must first find the app in an app store, download it, install it and then, finally, open it. When a user finds your progressive web app, they will be able to immediately start using it, eliminating the unnecessary downloading and installation stages. And when the user returns to the app, they will be prompted to install the app and upgrade to a full-screen experience.

<div class="highlight-blockquote"> *A progressive web application takes advantage of a mobile app’s characteristics, resulting in improved user retention and performance, without the complications involved in maintaining a mobile application.* </div>

<img src="/images/posts/pwa1.jpg" style="width: 70%;"/>


When should you build a progressive web app?
--------------------------------------------

Native is usually recommended for applications that you expect users to return to frequently, and a progressive web app is not any different. [Flipkart](http://www.flipkart.com/) uses a progressive web app for its popular e-commerce platform, Flipkart Lite, and [Air Berlin](https://flights.airberlin.com/en-DE/progressive-web-app) uses a progressive web app for its online check-in process, allowing users to access their tickets without an Internet connection.

When assessing whether your next application should be a progressive web app, a website or a native mobile application, first identify your users and the most important user actions. Being “progressive,” a progressive web app works in all browsers, and the experience is enhanced whenever the user’s browser is updated with new and improved features and APIs.
Thus, there is no compromise in the user experience with a progressive web app compared to a traditional website; however, you may have to decide what functionality to support offline, and you will have to facilitate navigation (remember that in standalone mode, the user does not have access to the back button). If your website already has an application-like interface,applying the concepts of progressive web apps will only make it better.

Characteristics Of A Progressive Web App
----------------------------------------
Before you jump into the code, it is important to understand that progressive web apps have the following [characteristics](https://developers.google.com/web/fundamentals/getting-started/your-first-progressive-web-app/):

 - **Progressive**
   By definition, a progressive web app must work on any device and
   enhance progressively, taking advantage of any features available on
   the user’s device and browser.
 - **Discoverable**
   Because a progressive web app is a website, it should be discoverable
   in search engines. This is a major advantage over native
   applications, which still lag behind websites in searchability.
 - **Linkable**
   As another characteristic inherited from websites, a well-designed
   website should use the URI to indicate the current state of the
   application. This will enable the web app to retain or reload its
   state when the user bookmarks or shares the app’s URL.
 - **Responsive**
    A progressive web app’s UI must fit the device’s form factor and
   screen size.
 - **App-like**
   A progressive web app should look like a native app and be built on
   the application shell model, with minimal page refreshes.
 - **Connectivity-independent**
   It should work in areas of low connectivity or offline (our favorite
   characteristic).
 - **Re-engageable**
   Mobile app users are more likely to reuse their apps, and progressive
   web apps are intended to achieve the same goals through features such
   as push notifications.
 - **Installable**
   A progressive web app can be installed on the device’s home screen,
   making it readily available.
 - **Fresh**
   When new content is published and the user is connected to the
   Internet, that content should be made available in the app.
 - **Safe**
   Because a progressive web app has a more intimate user experience and
   because all network requests can be intercepted through service
   workers, it is imperative that the app be hosted over HTTPS to
   prevent man-in-the-middle attacks.
   
 
Web App Manifest
---------------------

<div class="highlight-blockquote"> *The Manifest for Web applications is a simple JSON file that gives you, the developer, the ability to control how your app appears to the user in the areas that they would expect to see apps (for example the device home screen), direct what the user can launch and more importantly how they can launch it.* </div>

The manifest enables your web app to have a more native-like presence on the user's homescreen. It allows the app to be launched in full-screen mode (without a URL bar being present), provides control over the screen orientation and in recent versions of Chrome on Android supports defining a [Splash Screen](https://developers.google.com/web/updates/2015/10/splashscreen?hl=en) and [theme color](https://developers.google.com/web/updates/2014/11/Support-for-theme-color-in-Chrome-39-for-Android?hl=en) for the address bar. It is also used to define a set of icons by size and density used for the aforementioned Splash screen and homescreen icon.

<img src="/images/posts/pwa4.jpg" style="width: 70%;"/>


Cross-Browser Support
---------------------

These are still early days for progressive web apps, and cross-browser support is still limited, especially in Safari and Edge. However, Microsoft openly supports progressive web apps and should be implementing more features by the end of the year.

 - **Service workers and Cache API** 
Supported in Chrome, Firefox, Opera and Samsung’s browser. In development in Microsoft Edge, expected to be available by the end of 2016. Under consideration for Safari.
<img src="/images/posts/pwa6.jpg" style="width: 70%;"/>

 - **Add to home screen**
Supported in Chrome, Firefox, Opera, Android Browser and Samsung’s browser. Microsoft seems to indicate that progressive web apps will be available as store listings. No plans for Safari as of yet.

<img src="/images/posts/pwa5.jpg" style="width: 50%;"/>

 - **Push API**
Mostly supported in Chrome, Firefox, Opera and Samsung’s browser. In development in Microsoft Edge. No plans for Safari as of yet.

<img src="/images/posts/pwa7.jpg" style="width: 40%;"/>


If more developers take advantage of the features offered by progressive web apps — which are relatively easy to implement and provide immediate rewards — then users will prefer consuming these web apps in supported browsers, hopefully convincing the other browser vendors to adapt.

*(This article originally [posted](https://www.smashingmagazine.com/2016/08/a-beginners-guide-to-progressive-web-apps/) by [Kevin Farrugia](https://www.smashingmagazine.com/author/kevinfarrugia/))*

