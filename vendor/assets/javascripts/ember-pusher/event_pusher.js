App.EventPusher = App.Pusher.extend({
  handlePusherEvent: function(eventName, data) {
    var router, unhandled;

    // ignore pusher internal events
    if (eventName.match(/^pusher:/)) { return; }

    router = this.get("container").lookup("router:main");
    try {
      router.send(eventName, data);
    } catch (e) {
      unhandled = e.message.match(/Nothing handled the event/);
      if (!unhandled) { throw e };
    }
  }
});

App.EventPusherActivation = Ember.Mixin.create({
  pusher_channel: 'event_channel',

  activate: function() {
    this.get("pusher").subscribe(this.get('pusher_channel'));
  },
  deactivate: function() {
    this.get("pusher").unsuscribe(this.get('pusher_channel'));
  }
});

Ember.Application.initializer({
  name: "pusher",
  initialize: function(container, application) {
    // use the same instance of Pusher everywhere in the app
    container.optionsForType('pusher', { singleton: true });

    // register 'pusher:main' as our Pusher object
    container.register('pusher', 'main', application.EventPusher);

    // inject the Pusher object into all controllers and routes
    container.typeInjection('controller', 'pusher', 'pusher:main');
    container.typeInjection('route', 'pusher', 'pusher:main');
  }
});

