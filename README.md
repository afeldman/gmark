# gmark
classify, order and filter your chrome-bookmarks with ai. the url is classified to the existing keywords. each url contain 5 keywords and in future can contain more.
to classify the webpages you can use openai, google gemini or Claude. the ai builds a summery and select the keywords.

bookmark:
    index: database index
    mode: access data
        user_mode: only the current user has access
        team_mode: only the current team has access
        public_mode: all have access
    user: user added this data
    time:
        access_time: last time data has been accessed
        modified_time: last time for modification
        changed_time: time for major change and delete
    url: the url
    title: page title
    keywords: dynamic list of keywords (n bookmarks contains m keywords)
    description: ai generated page description

user:
    index: user index
    name: display name
    email: user email
    passwort: user passwort
    gmarks: multiple bookmarks related to the user

# database
we use the libsql database. the software starts with a local database. using a server url later on syncs all the bookmarks to a server. if the bookmark 

# bootstrap
use the mozilla html bookmark wile and create the database. anytime additional mozilla bookmark files can be added to the url store
