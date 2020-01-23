# LibertyJS Docs

## Add a blog post
Step 1: Write your blog post in markdown format.
See: [https://markdownlivepreview.com/](https://markdownlivepreview.com/)

Step 2: Save your post as a .md file in the `/data/posts/` folder

Step 3: Add an entry to `/data/posts/blog-list.json`.
The object key will become the post's URL. `backgroundColor` and `image` may be reused, but all other fields should be unique for each post.

Entries will appear on the site in the order they are listed in the file. Add newer entries to the top of the file, or check the `published` property to ensure consecutive order.