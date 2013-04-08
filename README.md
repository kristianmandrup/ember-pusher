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
  pusher_channel: "my-pusher-channel",

  // handle event from pusher just like normal actions
  events: {
    aMessageFromPusher: function(data) {
      // do something here
    }
  }
});
```

Default channel name is 'event_channel'. Override this via `App.EventPusher.pusher_channel = 'my-default-channel`

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

It should be possible to extend `DS.Model` to auto-update on pusher events sent from the server.

* `reload()` when the record has been updated on the server.
* `createRecord(attributes hash)`, when a new record has been created on the server.
* `deleteRecord()` when the record has been deleted on the server

With `pusherable`, pusher should send a message of the form (User record example): 

* create: "User.create", self.to_json
* destroy: "User.destroy", self.to_json
* update: "User.update", self.to_json

See `store_pusher.js` for the Ember pusherable client code ;) StorePusher is automatically registered with every store, similar to how the RoutePusher is connected to all Controllers and Routes.

To customize the Pusher channel name:

```javascript
App.Store.reopen({
  pusher_channel: "my-rest-channel"
});
```

Enjoy :)

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
