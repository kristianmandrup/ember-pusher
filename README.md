# Ember Pusher

Extracted from http://livsey.org/blog/2013/02/10/integrating-pusher-with-ember/

The Ember Router takes events from user actions and hands them off to the appropriate Route depending on where the user is within the app.

[Pusher](http://pusher.com/) receives events from your server which your app then handles, but you might want to do different things depending on where your user is within your app at the time the message is received.

Wouldn’t it be great if we could hook these two things up together?

## Installation

Add this line to your application's Gemfile:

    gem 'ember-pusher'

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install ember-pusher

## Usage

Here’s what we’re going to end up with in a route:

```javascript
App.MyRoute = Ember.Route.extend({
  // subscribe/unsubscribe to a pusher channel
  // when we enter/exit this part of the app
  activate: function() {
    this.get("pusher").subscribe("a-channel");
  },
  deactivate: function() {
    this.get("pusher").unsuscribe("a-channel");
  },

  // handle event from pusher just like normal actions
  events: {
    aMessageFromPusher: function(data) {
      // do something here
    }
  }
});
```

Now in your app.js or wherever you kick-off your app, we can re-open App.Pusher to set the API key:

```javascript
App.Pusher.reopen({
  key: "your-pusher-key"
});
```

Job done, now any messages received from Pusher will trigger events on your routes and you can handle them just like normal user actions.

## Rails integration

Simply require `ember-pusher.js` in your Assets manifest:

```javascript
//= require ember_pusher
```

To have Rails trigger pusher events when models are created, updated or deleted:

See [pusherable](https://github.com/tonycoco/pusherable) or my fork with *Mongoid* integration at [pusherable](https://github.com/kristianmandrup/pusherable)

Enjoy :)

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
