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
App.MyRoute = Ember.Route.extend(App.EventPusherActivation, {
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

We will extend an Ember Store` to auto-update on pusher events sent from the server.
We want to execute the following:

* `didUpdateRecord()` when the record has been updated on the server.
* `didCreateRecord()`, when a new record has been created on the server.
* `didDeleteRecord()` when the record has been deleted on the server

With `pusherable`, pusher should send a message of the form (`User` record example): 

* create: `"User.create", self.to_json`
* destroy: `"User.destroy", self.to_json`
* update: `"User.update", self.to_json`

In the future, we might want to provide bulk operations/events as well for improved performance :)

To achieve this funcitonality, ember-pusher extends Basic store like this, so that we can signal to the Adapter that a record was modified in the given way, using `did<Event>Record` without doing a real server sync for that record. 

```javascript
DS.Adapter.reopen({
  hasCreatedRecord: function(store, type, record) {
    var data = this.mockJSON(type, record);  
    this.didCreateRecord(store, type, record, data);
  },
  // ...
});
```

The store then get some `was<Event>` methods mixed in, that eah call the equivalent `has<Event>` method on the store adapter.

```javascript
  wasCreated: function(type, id, data) {
    var record = this.findTheRecord(type, id);
    if (this.isRecord(record)) {
      this.get('adapter').hasCreatedRecord(this, type, data);  
    }    
  },
```

See `store_pusher.js` for the Ember pusherable client code ;) 

`App.StorePusher` is automatically registered with every store, similar to how the `EventPusher` is connected to all controllers and routes.

For StorePusher, two mixins are provided

* App.StorePusherActivation (activate/deactivate pusher subscription)
* App.StorePusherEventHandler (handle store pusher events on store)

To customize the Pusher channel name:

```javascript
App.Store.reopen(StorePusherEventHandler, StorePusherActivation, {
  pusher_channel: "my-rest-channel"
});
```

Note: You should be able to override the default (main) store used by the StorePusher like so.

```javascript
App.MyOtherStorePusher = App.StorePusher.extend({
  store: function() {
    return this.get("container").lookup("store:other");
  }
})
```

Note that this code has not yet been tested, but I hope the architecture is close to something that would work! Please help out testing, debugging and improving the StorePusher code :) Would be awesome, similar to what we see with the *MeteorJS* framework!!!

Been tweaking more with the code, looking into *ember-data* for some guidance... this is way to hardcore/advanced that I can figure out how it needs to be tweaked to work correctly with *ember-data*. The main problem as I see it, is how to load a record from the store, without having it make a request to the server.

Looks like it is better to do it on the model!

* `reload()` for update
* `createRecord(json)` for create
* `deleteRecord` for delete

My issue is [here](https://github.com/emberjs/data/issues/867#issuecomment-16185998)

@darthdeus responded:

For loading records into the store you can just use `store.load` or `store.loadMany`

Hmm.. maybe that would solve it!?

You can retrieve DS.Model instances from the store in several ways. To retrieve
a record for a specific id, use the `find()` method:

     var record = MyApp.store.find(MyApp.Contact, 123);

 By default, the store will talk to your backend using a standard REST mechanism.
 You can customize how the store talks to your backend by specifying a custom adapter:

     MyApp.store = DS.Store.create({
       adapter: 'MyApp.CustomAdapter'
     });

Looks like this [local storage adapter](https://github.com/rpflorence/ember-localstorage-adapter/blob/master/localstorage_adapter.js) might be useful ;)

Would be nice perhaps with a BrideAdapter, one that saves to localstorage adapter and then to REST adapter. In this bridge adapter, you could then have the option to shut off the REST adapter temporarily, fx using a `serverSync: false` flag on key adapter methods?

I have started implementing [ember-bridge-adapter](https://github.com/kristianmandrup/ember-bridge-adapter) as a better solution to handle this.

The key model methods should now take an optional options hash, which is passed around to the most essential functions of adapter, store, transaction etc.

Currently two options are supported `syncServer: true` and `serverFirst: true`.
The `syncServer` option is used to disable syncing with the server.
serverFirst can be set in order to first try finding the record(s) on the server, before trying in the local storage. 

Important: BridgeAdapter is still very experimental and needs further testing and improvement!!!


## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
